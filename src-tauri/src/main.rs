// 预加载命令，避免警告
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    Manager,
    State,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter,
};
use std::sync::Mutex;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

// ============================================
// Windows API 导入（仅 Windows 平台编译）
// ============================================
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    SystemParametersInfoW, SPI_SETDESKWALLPAPER, SPIF_UPDATEINIFILE, SPIF_SENDWININICHANGE,
};

// ============================================
// 数据结构定义
// ============================================

/// 壁纸文件信息结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WallpaperFile {
    filename: String,
    filepath: String,
    size: u64,
    modified_time: String,
}

/// 应用状态结构体
struct AppState {
    generation_count: Mutex<i32>,
    settings: Mutex<AppSettings>,
}

/// 应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppSettings {
    api_key: String,
    default_resolution: String,
    save_path: String,
    auto_save: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            default_resolution: "1920x1080".to_string(),
            save_path: String::new(),
            auto_save: true,
        }
    }
}

// ============================================
// 辅助函数
// ============================================

/// 获取壁纸保存目录
fn get_wallpapers_dir() -> Result<PathBuf, String> {
    let home = dirs_or_home_dir()?;
    let wallpapers_dir = home.join("PixelWallpaper").join("wallpapers");

    if !wallpapers_dir.exists() {
        std::fs::create_dir_all(&wallpapers_dir)
            .map_err(|e| format!("创建壁纸目录失败: {}", e))?;
    }

    Ok(wallpapers_dir)
}

/// 获取用户主目录
fn dirs_or_home_dir() -> Result<PathBuf, String> {
    if let Some(home) = dirs::home_dir() {
        return Ok(home);
    }
    if let Ok(home) = std::env::var("HOME") {
        return Ok(PathBuf::from(home));
    }
    if let Ok(home) = std::env::var("USERPROFILE") {
        return Ok(PathBuf::from(home));
    }
    Err("无法获取用户主目录".to_string())
}

/// 获取壁纸目录（内部使用）
fn get_wallpaper_dir_internal() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("PixelWallpaper")
        .join("wallpapers")
}

/// 获取应用数据目录
fn get_app_data_dir_internal() -> Result<PathBuf, String> {
    let home = dirs_or_home_dir()?;
    let app_dir = home.join("PixelWallpaper");

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)
            .map_err(|e| format!("创建应用数据目录失败: {}", e))?;
    }

    Ok(app_dir)
}

/// 判断文件是否为图片
fn is_image_file(filename: &str) -> bool {
    let lower = filename.to_lowercase();
    lower.ends_with(".png")
        || lower.ends_with(".jpg")
        || lower.ends_with(".jpeg")
        || lower.ends_with(".bmp")
        || lower.ends_with(".gif")
        || lower.ends_with(".webp")
        || lower.ends_with(".svg")
}

// ============================================
// 内部壁纸设置函数
// ============================================

fn set_wallpaper_internal(image_path: &PathBuf) -> Result<(), String> {
    let image_path_str = image_path.to_string_lossy().to_string();

    if !image_path.exists() {
        return Err(format!("壁纸文件不存在: {}", image_path_str));
    }

    #[cfg(target_os = "windows")]
    {
        set_wallpaper_windows(&image_path_str)?;
    }

    #[cfg(target_os = "macos")]
    {
        let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
        rt.block_on(set_wallpaper_macos(&image_path_str))?;
    }

    #[cfg(target_os = "linux")]
    {
        let rt = tokio::runtime::Runtime::new().map_err(|e| e.to_string())?;
        rt.block_on(set_wallpaper_linux(&image_path_str))?;
    }

    println!("桌面壁纸设置成功: {}", image_path_str);
    Ok(())
}

/// Windows 平台设置壁纸
#[cfg(target_os = "windows")]
fn set_wallpaper_windows(image_path: &str) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let wide_path: Vec<u16> = OsStr::new(image_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let result = unsafe {
        SystemParametersInfoW(
            SPI_SETDESKWALLPAPER,
            0,
            wide_path.as_ptr() as *mut _,
            SPIF_UPDATEINIFILE | SPIF_SENDWININICHANGE,
        )
    };

    if result == 0 {
        Err("设置壁纸失败: SystemParametersInfoW 返回 0".to_string())
    } else {
        Ok(())
    }
}

/// macOS 平台设置壁纸
#[cfg(target_os = "macos")]
async fn set_wallpaper_macos(image_path: &str) -> Result<(), String> {
    let escaped_path = image_path.replace('"', "\\\"");
    let script = format!(
        r#"osascript -e 'tell application "System Events" to set picture of every desktop to "{}"'"#,
        escaped_path
    );

    let output = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(&script)
        .output()
        .await
        .map_err(|e| format!("执行 osascript 失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("设置壁纸失败: {}", stderr));
    }

    Ok(())
}

/// Linux 平台设置壁纸
#[cfg(target_os = "linux")]
async fn set_wallpaper_linux(image_path: &str) -> Result<(), String> {
    let gsettings_result = tokio::process::Command::new("gsettings")
        .arg("set")
        .arg("org.gnome.desktop.background")
        .arg("picture-uri")
        .arg(format!("file://{}", image_path))
        .output()
        .await;

    if let Ok(output) = gsettings_result {
        if output.status.success() {
            return Ok(());
        }
    }

    let feh_result = tokio::process::Command::new("feh")
        .arg("--bg-scale")
        .arg(image_path)
        .output()
        .await;

    if let Ok(output) = feh_result {
        if output.status.success() {
            return Ok(());
        }
    }

    let xfce_result = tokio::process::Command::new("xfconf-query")
        .arg("-c")
        .arg("xfce4-desktop")
        .arg("-p")
        .arg("/backdrop/screen0/monitor0/workspace0/last-image")
        .arg("-s")
        .arg(image_path)
        .output()
        .await;

    if let Ok(output) = xfce_result {
        if output.status.success() {
            return Ok(());
        }
    }

    Err("设置壁纸失败: 未找到支持的壁纸设置工具 (gsettings/feh/xfconf-query)".to_string())
}

// ============================================
// 内部随机切换壁纸函数
// ============================================

async fn generate_random_wallpaper_internal(app: &tauri::AppHandle) -> Result<String, String> {
    let wallpaper_dir = get_wallpaper_dir_internal();

    let entries = std::fs::read_dir(&wallpaper_dir)
        .map_err(|e| e.to_string())?;

    let images: Vec<PathBuf> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let ext = e.path().extension()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            matches!(ext.to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp" | "bmp")
        })
        .map(|e| e.path())
        .collect();

    if images.is_empty() {
        return Err("没有可用的壁纸".to_string());
    }

    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as usize;
    let index = seed % images.len();
    let selected = &images[index];

    set_wallpaper_internal(selected)?;

    // 通知前端更新
    let _ = app.emit("wallpaper-changed", selected.to_string_lossy().to_string());

    Ok(selected.to_string_lossy().to_string())
}

// ============================================
// Tauri 命令 - 壁纸管理
// ============================================

/// 从 URL 下载图片并保存到本地壁纸目录
#[tauri::command]
async fn download_and_save_wallpaper(
    image_url: String,
    filename: String,
) -> Result<String, String> {
    println!("开始下载壁纸: {} -> {}", image_url, filename);

    let wallpapers_dir = get_wallpapers_dir()?;
    let file_path = wallpapers_dir.join(&filename);

    let client = reqwest::Client::new();
    let response = client
        .get(&image_url)
        .send()
        .await
        .map_err(|e| format!("下载图片失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("下载失败，HTTP 状态码: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取图片数据失败: {}", e))?;

    tokio::fs::write(&file_path, &bytes)
        .await
        .map_err(|e| format!("保存文件失败: {}", e))?;

    let path_str = file_path
        .to_str()
        .ok_or("文件路径包含非法字符")?
        .to_string();

    println!("壁纸已保存到: {}", path_str);
    Ok(path_str)
}

/// 保存用户上传的图片（base64 数据）
#[tauri::command]
async fn save_uploaded_wallpaper(
    file_data: String,
    filename: String,
    description: String,
    original_author: String,
) -> Result<String, String> {
    println!(
        "保存上传壁纸: {}, 描述: {}, 作者: {}",
        filename, description, original_author
    );

    let decoded_data = if file_data.contains(",") {
        let parts: Vec<&str> = file_data.splitn(2, ',').collect();
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.decode(parts[1])
            .map_err(|e| format!("Base64 解码失败: {}", e))?
    } else {
        use base64::Engine;
        base64::engine::general_purpose::STANDARD.decode(&file_data)
            .map_err(|e| format!("Base64 解码失败: {}", e))?
    };

    let wallpapers_dir = get_wallpapers_dir()?;
    let file_path = wallpapers_dir.join(&filename);

    tokio::fs::write(&file_path, &decoded_data)
        .await
        .map_err(|e| format!("保存上传文件失败: {}", e))?;

    let path_str = file_path
        .to_str()
        .ok_or("文件路径包含非法字符")?
        .to_string();

    println!("上传壁纸已保存到: {}", path_str);
    Ok(path_str)
}

/// 设置桌面壁纸
#[tauri::command]
async fn set_desktop_wallpaper(image_path: String) -> Result<(), String> {
    println!("设置桌面壁纸: {}", image_path);
    let path = PathBuf::from(&image_path);
    set_wallpaper_internal(&path)
}

/// 获取壁纸保存目录
#[tauri::command]
fn get_wallpaper_directory() -> Result<String, String> {
    let dir = get_wallpapers_dir()?;
    let path_str = dir
        .to_str()
        .ok_or("壁纸目录路径包含非法字符")?
        .to_string();
    Ok(path_str)
}

/// 列出壁纸目录中的所有图片文件
#[tauri::command]
fn list_wallpapers() -> Result<Vec<WallpaperFile>, String> {
    let wallpapers_dir = get_wallpapers_dir()?;
    let mut wallpapers: Vec<WallpaperFile> = Vec::new();

    let entries = std::fs::read_dir(&wallpapers_dir)
        .map_err(|e| format!("读取壁纸目录失败: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录条目失败: {}", e))?;
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if !is_image_file(&filename) {
            continue;
        }

        let metadata = std::fs::metadata(&path)
            .map_err(|e| format!("获取文件元数据失败: {}", e))?;

        let modified = metadata
            .modified()
            .map_err(|e| format!("获取修改时间失败: {}", e))?;
        let datetime: chrono::DateTime<chrono::Local> = modified.into();
        let modified_time = datetime.format("%Y-%m-%d %H:%M:%S").to_string();

        let size = metadata.len();

        let filepath = path
            .to_str()
            .ok_or("文件路径包含非法字符")?
            .to_string();

        wallpapers.push(WallpaperFile {
            filename,
            filepath,
            size,
            modified_time,
        });
    }

    wallpapers.sort_by(|a, b| b.modified_time.cmp(&a.modified_time));

    println!("共找到 {} 张壁纸", wallpapers.len());
    Ok(wallpapers)
}

/// 删除壁纸文件
#[tauri::command]
fn delete_wallpaper(file_path: String) -> Result<(), String> {
    println!("删除壁纸: {}", file_path);

    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    let wallpapers_dir = get_wallpapers_dir()?;
    let canonical_path = path
        .canonicalize()
        .map_err(|e| format!("解析文件路径失败: {}", e))?;
    let canonical_dir = wallpapers_dir
        .canonicalize()
        .map_err(|e| format!("解析壁纸目录失败: {}", e))?;

    if !canonical_path.starts_with(&canonical_dir) {
        return Err("安全限制: 只能删除壁纸目录内的文件".to_string());
    }

    std::fs::remove_file(path).map_err(|e| format!("删除文件失败: {}", e))?;

    println!("壁纸已删除: {}", file_path);
    Ok(())
}

/// 获取应用数据目录
#[tauri::command]
fn get_app_data_dir() -> Result<String, String> {
    let dir = get_app_data_dir_internal()?;
    let path_str = dir
        .to_str()
        .ok_or("应用数据目录路径包含非法字符")?
        .to_string();
    Ok(path_str)
}

// ============================================
// Tauri 命令 - 随机壁纸切换
// ============================================

#[tauri::command]
async fn generate_random_wallpaper(state: State<'_, AppState>) -> Result<String, String> {
    let mut count = state.generation_count.lock().map_err(|e| e.to_string())?;
    *count += 1;

    let wallpaper_dir = get_wallpaper_dir_internal();

    let entries = std::fs::read_dir(&wallpaper_dir)
        .map_err(|e| e.to_string())?;

    let images: Vec<PathBuf> = entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let ext = e.path().extension()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            matches!(ext.to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp" | "bmp")
        })
        .map(|e| e.path())
        .collect();

    if images.is_empty() {
        return Err("没有可用的壁纸".to_string());
    }

    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as usize;
    let index = seed % images.len();
    let selected = &images[index];

    set_wallpaper_internal(selected)?;

    Ok(selected.to_string_lossy().to_string())
}

/// 获取壁纸目录命令
#[tauri::command]
fn get_wallpaper_dir() -> String {
    get_wallpaper_dir_internal().to_string_lossy().to_string()
}

// ============================================
// Tauri 命令 - 原有功能
// ============================================

#[tauri::command]
async fn generate_wallpaper(
    prompt: String,
    resolution: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut count = state.generation_count.lock().map_err(|e| e.to_string())?;
    *count += 1;

    println!("生成壁纸 - 提示词: {}, 分辨率: {}", prompt, resolution);

    // TODO: 调用 AI API 生成壁纸
    Ok(format!("generated_wallpaper_{}.png", *count))
}

/// 获取生成统计信息
#[tauri::command]
fn get_generation_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let count = state.generation_count.lock().map_err(|e| e.to_string())?;
    let settings = state.settings.lock().map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "total_generations": *count,
        "default_resolution": settings.default_resolution,
        "auto_save": settings.auto_save,
    }))
}

/// 保存设置
#[tauri::command]
fn save_settings(
    new_settings: AppSettings,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    *settings = new_settings;
    println!("设置已保存: {:?}", settings);
    Ok(())
}

/// 获取设置
#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

/// 保存壁纸到本地
#[tauri::command]
async fn save_wallpaper(
    image_data: Vec<u8>,
    filename: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    let save_path = if settings.save_path.is_empty() {
        std::env::temp_dir()
    } else {
        std::path::PathBuf::from(&settings.save_path)
    };

    let file_path = save_path.join(&filename);

    tokio::fs::write(&file_path, image_data)
        .await
        .map_err(|e| format!("保存文件失败: {}", e))?;

    println!("壁纸已保存到: {:?}", file_path);
    Ok(file_path.to_string_lossy().to_string())
}

// ============================================
// 应用入口
// ============================================

fn main() {
    // 初始化应用状态
    let app_state = AppState {
        generation_count: Mutex::new(0),
        settings: Mutex::new(AppSettings::default()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state)
        .setup(|app| {
            // 创建托盘菜单
            let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let random_item = MenuItem::with_id(app, "random", "随机切换壁纸", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &random_item, &quit_item])?;

            // 构建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .tooltip("PixelWallpaper AI")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "random" => {
                            let app_handle = app.clone();
                            tauri::async_runtime::spawn(async move {
                                let _ = generate_random_wallpaper_internal(&app_handle).await;
                            });
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // 应用启动时的初始化逻辑
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            // 初始化壁纸目录
            match get_wallpapers_dir() {
                Ok(dir) => println!("壁纸目录已就绪: {:?}", dir),
                Err(e) => eprintln!("初始化壁纸目录失败: {}", e),
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            download_and_save_wallpaper,
            save_uploaded_wallpaper,
            set_desktop_wallpaper,
            get_wallpaper_directory,
            list_wallpapers,
            delete_wallpaper,
            get_app_data_dir,
            generate_random_wallpaper,
            get_wallpaper_dir,
            generate_wallpaper,
            get_generation_stats,
            save_settings,
            get_settings,
            save_wallpaper,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
