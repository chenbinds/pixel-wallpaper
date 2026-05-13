// 预加载命令，避免警告
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    Manager,
    State,
    CustomMenuItem,
    SystemTray,
    SystemTrayMenu,
    SystemTrayMenuItem,
    SystemTrayEvent,
};
use std::sync::Mutex;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

// ============================================
// Windows API 导入（仅 Windows 平台编译）
// ============================================
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::SystemParametersInfoW;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::SPI_SETDESKWALLPAPER;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::SPIF_UPDATEINIFILE;
#[cfg(target_os = "windows")]
use windows_sys::Win32::UI::WindowsAndMessaging::SPIF_SENDWININICHANGE;

// ============================================
// 数据结构定义
// ============================================

/// 壁纸文件信息结构体
/// 用于 list_wallpapers 命令返回壁纸列表
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WallpaperFile {
    /// 文件名
    filename: String,
    /// 文件完整路径
    filepath: String,
    /// 文件大小（字节）
    size: u64,
    /// 最后修改时间（格式化字符串）
    modified_time: String,
}

/// 应用状态结构体
/// 用于在 Tauri 命令中共享数据
struct AppState {
    /// 生成计数器
    generation_count: Mutex<i32>,
    /// 用户设置
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
/// 默认为用户主目录下的 PixelWallpaper/wallpapers/
fn get_wallpapers_dir() -> Result<PathBuf, String> {
    // 获取用户主目录
    let home = dirs_or_home_dir()?;
    let wallpapers_dir = home.join("PixelWallpaper").join("wallpapers");

    // 如果目录不存在则创建
    if !wallpapers_dir.exists() {
        std::fs::create_dir_all(&wallpapers_dir)
            .map_err(|e| format!("创建壁纸目录失败: {}", e))?;
    }

    Ok(wallpapers_dir)
}

/// 获取用户主目录
/// 优先使用 dirs crate，失败时回退到环境变量
fn dirs_or_home_dir() -> Result<PathBuf, String> {
    // 尝试使用 dirs crate
    if let Some(home) = dirs::home_dir() {
        return Ok(home);
    }
    // 回退方案：尝试从环境变量获取
    if let Ok(home) = std::env::var("HOME") {
        return Ok(PathBuf::from(home));
    }
    if let Ok(home) = std::env::var("USERPROFILE") {
        return Ok(PathBuf::from(home));
    }
    Err("无法获取用户主目录".to_string())
}

/// 获取壁纸目录（内部使用，返回 PathBuf）
fn get_wallpaper_dir_internal() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("PixelWallpaper")
        .join("wallpapers")
}

/// 获取应用数据目录
/// 默认为用户主目录下的 PixelWallpaper/
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
// 内部壁纸设置函数（供多处复用）
// ============================================

/// 内部壁纸设置函数
/// 供托盘菜单和其他命令调用
fn set_wallpaper_internal(image_path: &PathBuf) -> Result<(), String> {
    let image_path_str = image_path.to_string_lossy().to_string();

    // 验证文件是否存在
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
/// 使用 SystemParametersInfoW API
#[cfg(target_os = "windows")]
fn set_wallpaper_windows(image_path: &str) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    // 将路径转换为宽字符字符串（UTF-16）
    let wide_path: Vec<u16> = OsStr::new(image_path)
        .encode_wide()
        .chain(std::iter::once(0)) // 添加 null 终止符
        .collect();

    // 调用 SystemParametersInfoW 设置壁纸
    let result = unsafe {
        SystemParametersInfoW(
            SPI_SETDESKWALLPAPER,
            0,
            wide_path.as_ptr() as *const _,
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
/// 使用 osascript 执行 AppleScript
#[cfg(target_os = "macos")]
async fn set_wallpaper_macos(image_path: &str) -> Result<(), String> {
    // 转义路径中的特殊字符
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
/// 优先使用 gsettings（GNOME），回退到 feh
#[cfg(target_os = "linux")]
async fn set_wallpaper_linux(image_path: &str) -> Result<(), String> {
    // 转义路径中的特殊字符
    let _escaped_path = image_path.replace("'", "'\\''");

    // 方法1: 尝试使用 gsettings (GNOME / Unity)
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

    // 方法2: 尝试使用 feh (轻量级壁纸设置工具)
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

    // 方法3: 尝试使用 xfconf-query (Xfce)
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
// 托盘相关辅助函数
// ============================================

/// 内部随机切换壁纸函数（供托盘菜单调用）
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

    // 通知前端更新（如果需要）
    if let Some(window) = app.get_window("main") {
        let _ = window.emit("wallpaper-changed", selected.to_string_lossy().to_string());
    }

    Ok(selected.to_string_lossy().to_string())
}

// ============================================
// Tauri 命令 - 壁纸管理（P3 阶段）
// ============================================

/// 从 URL 下载图片并保存到本地壁纸目录
///
/// 参数：
/// - image_url: 图片的网络地址
/// - filename: 保存的文件名
///
/// 返回：本地文件的完整路径
#[tauri::command]
async fn download_and_save_wallpaper(
    image_url: String,
    filename: String,
) -> Result<String, String> {
    println!("开始下载壁纸: {} -> {}", image_url, filename);

    // 获取壁纸保存目录
    let wallpapers_dir = get_wallpapers_dir()?;
    let file_path = wallpapers_dir.join(&filename);

    // 使用 reqwest 下载图片
    let client = reqwest::Client::new();
    let response = client
        .get(&image_url)
        .send()
        .await
        .map_err(|e| format!("下载图片失败: {}", e))?;

    // 检查响应状态
    if !response.status().is_success() {
        return Err(format!("下载失败，HTTP 状态码: {}", response.status()));
    }

    // 获取图片二进制数据
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取图片数据失败: {}", e))?;

    // 写入本地文件
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
///
/// 参数：
/// - file_data: base64 编码的图片数据
/// - filename: 保存的文件名
/// - description: 图片描述（暂存到元数据）
/// - original_author: 原图作者
///
/// 返回：本地文件的完整路径
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

    // 解码 base64 数据
    // 支持带 "data:image/xxx;base64," 前缀的格式
    let decoded_data = if file_data.contains(",") {
        // 去掉 data URI 前缀
        let parts: Vec<&str> = file_data.splitn(2, ',').collect();
        base64::decode(parts[1]).map_err(|e| format!("Base64 解码失败: {}", e))?
    } else {
        base64::decode(&file_data).map_err(|e| format!("Base64 解码失败: {}", e))?
    };

    // 获取壁纸保存目录
    let wallpapers_dir = get_wallpapers_dir()?;
    let file_path = wallpapers_dir.join(&filename);

    // 写入文件
    tokio::fs::write(&file_path, &decoded_data)
        .await
        .map_err(|e| format!("保存上传文件失败: {}", e))?;

    // TODO: 将 description 和 original_author 保存到元数据文件（如 JSON 侧边文件）

    let path_str = file_path
        .to_str()
        .ok_or("文件路径包含非法字符")?
        .to_string();

    println!("上传壁纸已保存到: {}", path_str);
    Ok(path_str)
}

/// 设置桌面壁纸
///
/// 参数：
/// - image_path: 本地图片文件的完整路径
///
/// 根据不同操作系统调用对应的系统 API：
/// - Windows: SystemParametersInfoW
/// - macOS: osascript AppleScript
/// - Linux: gsettings (GNOME) 或 feh (其他桌面环境)
#[tauri::command]
async fn set_desktop_wallpaper(image_path: String) -> Result<(), String> {
    println!("设置桌面壁纸: {}", image_path);

    let path = PathBuf::from(&image_path);
    set_wallpaper_internal(&path)
}

/// 获取壁纸保存目录
///
/// 返回壁纸目录的完整路径字符串
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
///
/// 返回壁纸文件信息列表（文件名、路径、大小、修改时间）
#[tauri::command]
fn list_wallpapers() -> Result<Vec<WallpaperFile>, String> {
    let wallpapers_dir = get_wallpapers_dir()?;
    let mut wallpapers: Vec<WallpaperFile> = Vec::new();

    // 读取目录中的所有条目
    let entries = std::fs::read_dir(&wallpapers_dir)
        .map_err(|e| format!("读取壁纸目录失败: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录条目失败: {}", e))?;
        let path = entry.path();

        // 只处理文件（跳过子目录）
        if !path.is_file() {
            continue;
        }

        // 只处理图片文件
        let filename = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        if !is_image_file(&filename) {
            continue;
        }

        // 获取文件元数据
        let metadata = std::fs::metadata(&path)
            .map_err(|e| format!("获取文件元数据失败: {}", e))?;

        // 获取修改时间
        let modified = metadata
            .modified()
            .map_err(|e| format!("获取修改时间失败: {}", e))?;
        let datetime: chrono::DateTime<chrono::Local> = modified.into();
        let modified_time = datetime.format("%Y-%m-%d %H:%M:%S").to_string();

        // 获取文件大小
        let size = metadata.len();

        // 获取完整路径
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

    // 按修改时间降序排序（最新的在前）
    wallpapers.sort_by(|a, b| b.modified_time.cmp(&a.modified_time));

    println!("共找到 {} 张壁纸", wallpapers.len());
    Ok(wallpapers)
}

/// 删除壁纸文件
///
/// 参数：
/// - file_path: 要删除的壁纸文件完整路径
#[tauri::command]
fn delete_wallpaper(file_path: String) -> Result<(), String> {
    println!("删除壁纸: {}", file_path);

    // 验证文件是否存在
    let path = std::path::Path::new(&file_path);
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    // 安全检查：确保文件在壁纸目录内，防止误删系统文件
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

    // 删除文件
    std::fs::remove_file(path).map_err(|e| format!("删除文件失败: {}", e))?;

    println!("壁纸已删除: {}", file_path);
    Ok(())
}

/// 获取应用数据目录
///
/// 返回应用数据目录的完整路径字符串
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

/// 生成随机壁纸命令（供前端调用）
/// 增加计数并随机选择一张壁纸设置为桌面
#[tauri::command]
async fn generate_random_wallpaper(state: State<'_, AppState>) -> Result<String, String> {
    // 增加计数
    let mut count = state.generation_count.lock().map_err(|e| e.to_string())?;
    *count += 1;

    // 获取壁纸目录
    let wallpaper_dir = get_wallpaper_dir_internal();

    // 列出目录中的图片文件
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

    // 随机选择一张
    use std::time::{SystemTime, UNIX_EPOCH};
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos() as usize;
    let index = seed % images.len();
    let selected = &images[index];

    // 设置为壁纸
    set_wallpaper_internal(selected)?;

    Ok(selected.to_string_lossy().to_string())
}

/// 获取壁纸目录命令（供前端调用）
#[tauri::command]
fn get_wallpaper_dir() -> String {
    get_wallpaper_dir_internal().to_string_lossy().to_string()
}

// ============================================
// Tauri 命令 - 原有功能（P1/P2 阶段）
// ============================================

/// 生成壁纸命令
/// 接收提示词和分辨率参数，返回生成的图片路径
#[tauri::command]
async fn generate_wallpaper(
    prompt: String,
    resolution: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // 增加生成计数
    let mut count = state.generation_count.lock().map_err(|e| e.to_string())?;
    *count += 1;

    println!("生成壁纸 - 提示词: {}, 分辨率: {}", prompt, resolution);

    // TODO: 调用 AI API 生成壁纸
    // 这里返回模拟结果
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

/// 保存壁纸到本地（原有命令，保留兼容性）
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

    // 写入文件
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
    // 创建托盘菜单
    let show_item = CustomMenuItem::new("show".to_string(), "显示主窗口");
    let random_item = CustomMenuItem::new("random".to_string(), "随机切换壁纸");
    let quit_item = CustomMenuItem::new("quit".to_string(), "退出");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show_item)
        .add_item(random_item)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit_item);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    // 初始化应用状态
    let app_state = AppState {
        generation_count: Mutex::new(0),
        settings: Mutex::new(AppSettings::default()),
    };

    tauri::Builder::default()
        .system_tray(system_tray)  // 添加系统托盘
        .on_system_tray_event(|app, event| {  // 托盘事件处理
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    // 左键点击显示窗口
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            if let Some(window) = app.get_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "random" => {
                            // 触发随机切换命令
                            let app_handle = app.clone();
                            tauri::async_runtime::spawn(async move {
                                let _ = generate_random_wallpaper_internal(&app_handle).await;
                            });
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // P3 阶段 - 壁纸管理命令
            download_and_save_wallpaper,
            save_uploaded_wallpaper,
            set_desktop_wallpaper,
            get_wallpaper_directory,
            list_wallpapers,
            delete_wallpaper,
            get_app_data_dir,
            // 新增命令
            generate_random_wallpaper,
            get_wallpaper_dir,
            // P1/P2 阶段 - 原有命令
            generate_wallpaper,
            get_generation_stats,
            save_settings,
            get_settings,
            save_wallpaper,
        ])
        .setup(|app| {
            // 应用启动时的初始化逻辑
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }

            // 初始化壁纸目录
            match get_wallpapers_dir() {
                Ok(dir) => println!("壁纸目录已就绪: {:?}", dir),
                Err(e) => eprintln!("初始化壁纸目录失败: {}", e),
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用时出错");
}
