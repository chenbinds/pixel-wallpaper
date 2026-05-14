/**
 * tauri-service.ts - Electron 服务桥接层
 *
 * 封装所有 Electron IPC 调用，提供类型安全的前端 API。
 * 在浏览器开发模式下（非 Electron 环境），自动返回模拟数据。
 */

// ============================================
// 类型定义
// ============================================

/** 壁纸文件信息（与 Electron 端 WallpaperFile 对应） */
export interface WallpaperFile {
  /** 文件名 */
  filename: string
  /** 文件完整路径 */
  filepath: string
  /** 文件大小（字节） */
  size: number
  /** 最后修改时间 */
  modified_time: string
}

/** Electron API 类型声明 */
interface ElectronAPI {
  invoke: (channel: string, args?: any) => Promise<any>
  onWallpaperChanged: (callback: (wallpaperPath: string) => void) => () => void
}

// 扩展 Window 类型以包含 electronAPI
declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

// ============================================
// 环境检测
// ============================================

/**
 * 检测当前是否运行在 Electron 环境中
 * 如果在浏览器中直接打开（开发模式），则返回 false
 */
function isElectronEnvironment(): boolean {
  return !!(window.electronAPI)
}

// ============================================
// 模拟数据（浏览器开发模式使用）
// ============================================

/** 模拟壁纸目录路径 */
const MOCK_WALLPAPER_DIR = '/mock/path/to/PixelWallpaper/wallpapers'

/** 模拟应用数据目录 */
const MOCK_APP_DATA_DIR = '/mock/path/to/PixelWallpaper'

/** 模拟壁纸文件列表 */
const MOCK_WALLPAPERS: WallpaperFile[] = [
  {
    filename: 'pixel_forest_1920x1080.png',
    filepath: `${MOCK_WALLPAPER_DIR}/pixel_forest_1920x1080.png`,
    size: 2048576,
    modified_time: '2026-05-13 10:30:00',
  },
  {
    filename: 'cyberpunk_city_2560x1440.png',
    filepath: `${MOCK_WALLPAPER_DIR}/cyberpunk_city_2560x1440.png`,
    size: 4097152,
    modified_time: '2026-05-12 18:45:00',
  },
  {
    filename: 'sunset_ocean_1920x1080.jpg',
    filepath: `${MOCK_WALLPAPER_DIR}/sunset_ocean_1920x1080.jpg`,
    size: 1536000,
    modified_time: '2026-05-11 09:15:00',
  },
]

// ============================================
// 服务方法
// ============================================

/**
 * 从 URL 下载图片并保存到本地壁纸目录
 *
 * @param imageUrl - 图片的网络地址
 * @param filename - 保存的文件名
 * @returns 本地文件的完整路径
 */
export async function downloadAndSave(
  imageUrl: string,
  filename: string
): Promise<string> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] downloadAndSave:', imageUrl, '->', filename)
    await simulateDelay()
    return `${MOCK_WALLPAPER_DIR}/${filename}`
  }

  try {
    const result = await window.electronAPI!.invoke('download-and-save-wallpaper', {
      imageUrl,
      filename,
    })
    return result
  } catch (error) {
    console.error('下载并保存壁纸失败:', error)
    throw new Error(`下载并保存壁纸失败: ${error}`)
  }
}

/**
 * 保存用户上传的图片（base64 数据）
 *
 * @param fileData - base64 编码的图片数据（支持 data URI 前缀）
 * @param filename - 保存的文件名
 * @param description - 图片描述
 * @param author - 原图作者
 * @returns 本地文件的完整路径
 */
export async function saveUploaded(
  fileData: string,
  filename: string,
  description: string,
  author: string
): Promise<string> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] saveUploaded:', filename, '描述:', description, '作者:', author)
    await simulateDelay()
    return `${MOCK_WALLPAPER_DIR}/${filename}`
  }

  try {
    const result = await window.electronAPI!.invoke('save-uploaded-wallpaper', {
      fileData,
      filename,
      description,
      originalAuthor: author,
    })
    return result
  } catch (error) {
    console.error('保存上传壁纸失败:', error)
    throw new Error(`保存上传壁纸失败: ${error}`)
  }
}

/**
 * 设置桌面壁纸
 *
 * @param imagePath - 本地图片文件的完整路径
 */
export async function setDesktopWallpaper(imagePath: string): Promise<void> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] setDesktopWallpaper:', imagePath)
    await simulateDelay()
    return
  }

  try {
    await window.electronAPI!.invoke('set-desktop-wallpaper', { imagePath })
  } catch (error) {
    console.error('设置桌面壁纸失败:', error)
    throw new Error(`设置桌面壁纸失败: ${error}`)
  }
}

/**
 * 显示保存对话框，让用户选择保存位置
 *
 * @param sourcePath - 源文件路径
 * @param defaultName - 默认文件名
 * @returns 保存后的文件路径，如果用户取消则返回 null
 */
export async function saveWallpaperDialog(sourcePath: string, defaultName: string): Promise<string | null> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] saveWallpaperDialog:', sourcePath, defaultName)
    await simulateDelay()
    return sourcePath
  }

  try {
    const result = await window.electronAPI!.invoke('save-wallpaper-dialog', { sourcePath, defaultName })
    return result
  } catch (error) {
    console.error('保存壁纸对话框失败:', error)
    throw new Error(`保存壁纸对话框失败: ${error}`)
  }
}

/**
 * 获取壁纸保存目录
 *
 * @returns 壁纸目录的完整路径
 */
export async function getWallpaperDirectory(): Promise<string> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] getWallpaperDirectory')
    await simulateDelay(100)
    return MOCK_WALLPAPER_DIR
  }

  try {
    const result = await window.electronAPI!.invoke('get-wallpaper-directory')
    return result
  } catch (error) {
    console.error('获取壁纸目录失败:', error)
    throw new Error(`获取壁纸目录失败: ${error}`)
  }
}

/**
 * 列出壁纸目录中的所有图片文件
 *
 * @returns 壁纸文件信息列表
 */
export async function listWallpapers(): Promise<WallpaperFile[]> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] listWallpapers')
    await simulateDelay(200)
    return [...MOCK_WALLPAPERS]
  }

  try {
    const result = await window.electronAPI!.invoke('list-wallpapers')
    return result
  } catch (error) {
    console.error('列出壁纸失败:', error)
    throw new Error(`列出壁纸失败: ${error}`)
  }
}

/**
 * 删除壁纸文件
 *
 * @param filePath - 要删除的壁纸文件完整路径
 */
export async function deleteWallpaper(filePath: string): Promise<void> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] deleteWallpaper:', filePath)
    await simulateDelay()
    return
  }

  try {
    await window.electronAPI!.invoke('delete-wallpaper', { filePath })
  } catch (error) {
    console.error('删除壁纸失败:', error)
    throw new Error(`删除壁纸失败: ${error}`)
  }
}

/**
 * 获取应用数据目录
 *
 * @returns 应用数据目录的完整路径
 */
export async function getAppDataDir(): Promise<string> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] getAppDataDir')
    await simulateDelay(100)
    return MOCK_APP_DATA_DIR
  }

  try {
    const result = await window.electronAPI!.invoke('get-app-data-dir')
    return result
  } catch (error) {
    console.error('获取应用数据目录失败:', error)
    throw new Error(`获取应用数据目录失败: ${error}`)
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 模拟网络延迟（用于浏览器开发模式）
 * 让 mock 行为更接近真实异步操作
 *
 * @param ms - 延迟毫秒数，默认 300ms
 */
function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 格式化文件大小为可读字符串
 *
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的字符串，如 "2.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// ============================================
// 系统托盘服务（系统集成）
// ============================================

/**
 * 监听壁纸变化事件
 * 当系统托盘或后端触发了壁纸切换时，前端会收到通知
 *
 * @param callback - 壁纸路径回调函数
 */
export function onWallpaperChanged(callback: (wallpaperPath: string) => void): void {
  if (!isElectronEnvironment()) {
    console.log('[Mock] onWallpaperChanged listener registered')
    return
  }

  try {
    window.electronAPI!.onWallpaperChanged((wallpaperPath) => {
      callback(wallpaperPath)
    })
  } catch (error) {
    console.error('Failed to setup wallpaper-changed listener:', error)
  }
}

/**
 * 随机切换壁纸
 * 调用系统托盘菜单中的随机切换功能
 *
 * @returns 切换后的壁纸路径
 * @throws 如果没有可用壁纸则抛出错误
 */
export async function randomWallpaper(): Promise<string> {
  if (!isElectronEnvironment()) {
    console.log('[Mock] randomWallpaper')
    await simulateDelay(500)
    // 随机返回一个模拟壁纸
    const randomIndex = Math.floor(Math.random() * MOCK_WALLPAPERS.length)
    return MOCK_WALLPAPERS[randomIndex].filepath
  }

  try {
    const result = await window.electronAPI!.invoke('generate-random-wallpaper')
    return result
  } catch (error) {
    console.error('随机切换壁纸失败:', error)
    throw new Error(`随机切换壁纸失败: ${error}`)
  }
}

// ============================================
// 兼容层：统一导出对象形式
// ============================================

/**
 * 兼容层：导出 tauriService 对象
 * 供旧代码使用，调用上述独立函数
 */
export const tauriService = {
  downloadAndSave,
  saveUploaded,
  setDesktopWallpaper,
  saveWallpaperDialog,
  getWallpaperDirectory,
  listWallpapers,
  deleteWallpaper,
  getAppDataDir,
  onWallpaperChanged,
  randomWallpaper,
}
