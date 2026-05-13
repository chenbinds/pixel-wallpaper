/**
 * wallpaper.ts - 壁纸相关类型定义
 * 定义壁纸数据结构和相关枚举类型
 * 基于 PRD 参数体系设计
 */

// ============================================
// 分辨率/比例
// ============================================

/** 常用分辨率 */
export type CommonResolution = 
  | '1920x1080'   // Full HD
  | '2560x1440'   // 2K
  | '3840x2160'   // 4K
  | '1366x768'    // HD

/** 超宽屏分辨率 */
export type UltrawideResolution = 
  | '2560x1080'   // 21:9
  | '3440x1440'   // 21:9
  | '5120x1440'   // 32:9

/** 竖屏分辨率 */
export type PortraitResolution = 
  | '1080x1920'
  | '1440x2560'

/** 其他分辨率 */
export type OtherResolution = 
  | '1920x1200'   // 16:10
  | '2560x1600'   // 16:10

/** 所有分辨率类型 */
export type Resolution = CommonResolution | UltrawideResolution | PortraitResolution | OtherResolution

/** 分辨率选项配置 */
export interface ResolutionOption {
  value: Resolution
  label: string
  category: 'common' | 'ultrawide' | 'portrait' | 'other'
  ratio: string
}

// ============================================
// 色彩模式
// ============================================

/** 色调类型 */
export type ColorTone = 
  | 'colorful'      // 彩色
  | 'bw'            // 黑白
  | 'warm'          // 暖色调
  | 'cool'          // 冷色调
  | 'cyberpunk'     // 赛博朋克霓虹
  | 'retro'         // 复古怀旧

/** 色彩模式配置 */
export interface ColorMode {
  tone: ColorTone
  primaryColor?: string  // 主色调 HEX 值（可选）
}

// ============================================
// 场景风格
// ============================================

/** 自然场景 */
export type NatureScene = 
  | 'mountain'      // 山川
  | 'ocean'         // 海洋
  | 'forest'        // 森林
  | 'sky'           // 天空/星空
  | 'flower'        // 花田
  | 'seasons'       // 四季

/** 都市场景 */
export type UrbanScene = 
  | 'skyline'       // 城市天际线
  | 'street'        // 街道
  | 'neon'          // 霓虹夜景
  | 'cyberpunk'     // 赛博朋克
  | 'architecture'  // 建筑

/** 人文场景 */
export type CultureScene = 
  | 'chinese'       // 古风/水墨
  | 'japanese'      // 日式和风
  | 'european'      // 欧洲古典
  | 'steampunk'     // 蒸汽朋克

/** 幻想场景 */
export type FantasyScene = 
  | 'fantasy'       // 奇幻冒险
  | 'scifi'         // 太空/科幻
  | 'underwater'    // 海底世界
  | 'magic'         // 魔法森林

/** 可爱场景 */
export type CuteScene = 
  | 'animal'        // 动物
  | 'food'          // 美食
  | 'cartoon'       // 卡通角色
  | 'chibi'         // Q版

/** 抽象场景 */
export type AbstractScene = 
  | 'geometric'     // 几何图案
  | 'gradient'      // 渐变
  | 'texture'       // 纹理
  | 'psychedelic'   // 迷幻

/** 游戏场景（像素风核心） */
export type GameScene = 
  | 'fc_retro'      // FC复古游戏场景
  | 'rpg_map'       // RPG地图
  | 'shooter'       // 太空射击
  | 'platformer'    // 平台跳跃

/** 场景风格分类 */
export type SceneCategory = 'nature' | 'urban' | 'culture' | 'fantasy' | 'cute' | 'abstract' | 'game'

/** 场景风格 */
export type SceneStyle = NatureScene | UrbanScene | CultureScene | FantasyScene | CuteScene | AbstractScene | GameScene

/** 场景选项配置 */
export interface SceneOption {
  value: SceneStyle
  label: string
  category: SceneCategory
  icon: string
}

// ============================================
// 像素风专属参数（核心特色）
// ============================================

/** 像素密度 */
export type PixelDensity = 
  | '8bit'    // 8-bit（粗糙颗粒）
  | '16bit'   // 16-bit（经典FC/SFC）
  | '32bit'   // 32-bit（精细像素）

/** 风格参考 */
export type PixelStyleRef = 
  | 'fc'          // FC红白机风格
  | 'sfc'         // SFC风格
  | 'gb'          // GB灰度风格
  | 'arcade'      // 街机风格
  | 'modern'      // 现代像素风

/** 游戏视角 */
export type GamePerspective = 
  | 'side_scroll'     // 横版卷轴
  | 'top_down'        // 俯视角RPG
  | 'platformer'      // 平台跳跃
  | 'fighting'        // 格斗游戏
  | 'shmup'           // 弹幕射击

/** 像素风配置 */
export interface PixelArtConfig {
  density: PixelDensity
  styleRef: PixelStyleRef
  perspective: GamePerspective
}

// ============================================
// 构图
// ============================================

export type Composition = 
  | 'panorama'      // 全景
  | 'center'        // 居中
  | 'symmetric'     // 对称
  | 'rule3'         // 三分法
  | 'minimal'       // 极简留白

// ============================================
// 图片来源（新增）
// ============================================

/** 图片来源类型 */
export type WallpaperSource = 'ai' | 'upload'

// ============================================
// 壁纸数据结构
// ============================================

/** 壁纸风格类型（综合） */
export type WallpaperStyle = 
  | 'realistic'   // 写实
  | 'anime'       // 动漫
  | 'oil'         // 油画
  | 'watercolor'  // 水彩
  | 'sketch'      // 素描
  | 'cyberpunk'   // 赛博朋克
  | 'pixel'       // 像素风（新增）

/** 壁纸数据结构 */
export interface Wallpaper {
  /** 唯一标识符 */
  id: string
  /** 图片来源：ai = AI生成, upload = 手动上传 */
  source: WallpaperSource
  /** 生成提示词（AI生成时）或描述（上传时） */
  prompt: string
  /** 完整图片 URL */
  imageUrl: string
  /** 缩略图 URL */
  thumbnailUrl: string
  /** 分辨率 */
  resolution: Resolution
  /** 风格 */
  style: WallpaperStyle
  /** 场景风格 */
  scene: SceneStyle
  /** 像素风配置 */
  pixelConfig?: PixelArtConfig
  /** 色彩模式 */
  colorMode: ColorMode
  /** 构图 */
  composition: Composition
  /** 创建时间 (ISO 格式) */
  createdAt: string
  /** 是否收藏 */
  isFavorite: boolean
  /** 本地文件路径 */
  localPath?: string
  /** 原图作者（上传图片可选） */
  originalAuthor?: string
  /** 文件大小（字节） */
  fileSize?: number
}

// ============================================
// 上传相关类型（新增）
// ============================================

/** 上传图片请求 */
export interface UploadRequest {
  /** 文件路径 */
  filePath: string
  /** 可选描述 */
  description?: string
  /** 原图作者 */
  originalAuthor?: string
}

/** 上传图片响应 */
export interface UploadResponse {
  /** 是否成功 */
  success: boolean
  /** 壁纸数据 */
  wallpaper?: Wallpaper
  /** 错误信息 */
  error?: string
}

// ============================================
// 生成请求参数
// ============================================

/** 生成请求参数 */
export interface GenerateRequest {
  /** 基础提示词 */
  prompt: string
  /** 分辨率 */
  resolution: Resolution
  /** 场景风格 */
  scene: SceneStyle
  /** 色彩模式 */
  colorMode: ColorMode
  /** 像素风配置 */
  pixelConfig: PixelArtConfig
  /** 构图 */
  composition: Composition
  /** 负面提示词（可选） */
  negativePrompt?: string
}

/** 生成响应结果 */
export interface GenerateResponse {
  /** 是否成功 */
  success: boolean
  /** 生成的壁纸数据 */
  wallpaper?: Wallpaper
  /** 错误信息 */
  error?: string
  /** 用量信息 */
  usage?: {
    tokens?: number
    cost?: number
  }
}

// ============================================
// API 配置
// ============================================

/** AI 提供商 */
export type AiProvider = 'tongyi' | 'openai' | 'stability' | 'custom'

/** API 配置类型 */
export interface ApiConfig {
  /** API 提供商 */
  provider: AiProvider
  /** API 密钥 */
  apiKey: string
  /** 模型名称 */
  model?: string
  /** 自定义 API 地址 */
  customUrl?: string
}

// ============================================
// 应用设置
// ============================================

/** 应用设置类型 */
export interface AppSettings {
  /** API 配置 */
  apiConfig: ApiConfig
  /** 默认分辨率 */
  defaultResolution: Resolution
  /** 默认场景 */
  defaultScene: SceneStyle
  /** 默认色彩模式 */
  defaultColorMode: ColorMode
  /** 默认像素风配置 */
  defaultPixelConfig: PixelArtConfig
  /** 默认构图 */
  defaultComposition: Composition
  /** 自动保存 */
  autoSave: boolean
  /** 自动设为壁纸 */
  autoSetWallpaper: boolean
  /** 保存路径 */
  savePath: string
  /** 文件命名格式 */
  namingFormat: 'timestamp' | 'prompt' | 'id' | 'custom'
}

// ============================================
// 用量统计
// ============================================

/** 用量统计 */
export interface UsageStats {
  /** 本月生成次数 */
  monthlyCount: number
  /** 今日生成次数 */
  todayCount: number
  /** 累计生成次数 */
  totalCount: number
  /** 累计消耗估算（元） */
  totalCost: number
  /** 已保存壁纸数 */
  savedCount: number
  /** 最后更新时间 */
  lastUpdated: string
}

// ============================================
// 预设模板
// ============================================

/** 预设模板 */
export interface PresetTemplate {
  id: string
  name: string
  description: string
  icon: string
  config: Partial<GenerateRequest>
}
