/**
 * ai-service.ts - AI 图片生成服务抽象层
 * 支持多个 AI 提供商，可配置切换
 */

import type { GenerateRequest, GenerateResponse } from '../types/wallpaper'

// ============================================
// AI 提供商枚举
// ============================================

/** 支持的 AI 提供商 */
export type AiProvider = 'tongyi' | 'openai' | 'stability' | 'custom'

/** 提供商配置 */
export interface ProviderConfig {
  /** 提供商标识 */
  provider: AiProvider
  /** API Key（加密存储） */
  apiKey: string
  /** 模型名称 */
  model: string
  /** 自定义 API 地址（可选） */
  baseUrl?: string
  /** 是否启用 */
  enabled: boolean
}

/** 提供商信息 */
export interface ProviderInfo {
  id: AiProvider
  name: string
  description: string
  models: ModelInfo[]
  defaultModel: string
  icon: string
}

/** 模型信息 */
export interface ModelInfo {
  id: string
  name: string
  description?: string
  maxResolution?: string
}

// ============================================
// 提供商注册表
// ============================================

/** 所有支持的提供商信息 */
export const PROVIDERS: Record<AiProvider, ProviderInfo> = {
  tongyi: {
    id: 'tongyi',
    name: '通义万相',
    description: '阿里云 DashScope 图片生成服务',
    icon: '🇨🇳',
    defaultModel: 'wanx-v1',
    models: [
      { id: 'wanx-v1', name: '通义万相 v1', description: '基础图片生成模型', maxResolution: '1024x1024' },
      { id: 'wanx-sketch-to-image-v1', name: '草图生图', description: '根据草图生成图片' },
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI DALL-E',
    description: 'OpenAI 图片生成服务',
    icon: '🇺🇸',
    defaultModel: 'dall-e-3',
    models: [
      { id: 'dall-e-3', name: 'DALL-E 3', description: '最新版本，效果最佳', maxResolution: '1024x1792' },
      { id: 'dall-e-2', name: 'DALL-E 2', description: '经典版本，速度快', maxResolution: '1024x1024' },
    ]
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    description: 'Stable Diffusion 图片生成服务',
    icon: '🎨',
    defaultModel: 'stable-diffusion-xl-1024-v1-0',
    models: [
      { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0', description: '高质量图片生成', maxResolution: '1024x1024' },
      { id: 'stable-diffusion-v1-6', name: 'SD 1.6', description: '经典版本' },
    ]
  },
  custom: {
    id: 'custom',
    name: '自定义服务',
    description: '自定义 OpenAI 兼容 API',
    icon: '⚙️',
    defaultModel: '',
    models: []
  }
}

// ============================================
// AI 服务接口
// ============================================

/** AI 服务接口 - 所有提供商必须实现 */
export interface IAiService {
  /** 提供商标识 */
  readonly providerId: AiProvider
  
  /** 生成图片 */
  generate(request: GenerateRequest, config: ProviderConfig): Promise<GenerateResponse>
  
  /** 验证配置是否有效 */
  validateConfig(config: ProviderConfig): boolean
  
  /** 获取可用模型列表 */
  getModels(): ModelInfo[]
}

// ============================================
// 基础 AI 服务类
// ============================================

/** 基础 AI 服务 - 提供通用功能 */
export abstract class BaseAiService implements IAiService {
  abstract readonly providerId: AiProvider
  
  abstract generate(request: GenerateRequest, config: ProviderConfig): Promise<GenerateResponse>
  
  validateConfig(config: ProviderConfig): boolean {
    return !!(config.apiKey && config.apiKey.length > 0 && config.enabled)
  }
  
  getModels(): ModelInfo[] {
    return PROVIDERS[this.providerId].models
  }
  
  /** 构建完整的提示词（包含像素风增强） */
  protected buildPrompt(request: GenerateRequest): string {
    const parts: string[] = []
    
    // 基础提示词
    if (request.prompt.trim()) {
      parts.push(request.prompt.trim())
    }
    
    // 像素风核心关键词（自动注入）
    const densityMap: Record<string, string> = {
      '8bit': '8-bit pixel art',
      '16bit': '16-bit pixel art',
      '32bit': '32-bit pixel art'
    }
    
    const styleMap: Record<string, string> = {
      'fc': 'NES Nintendo retro style',
      'sfc': 'SNES Super Nintendo style',
      'gb': 'GameBoy monochrome style',
      'arcade': 'arcade game aesthetic',
      'modern': 'modern pixel art'
    }
    
    const perspectiveMap: Record<string, string> = {
      'side_scroll': 'side-scrolling view',
      'top_down': 'top-down isometric view',
      'platformer': 'platformer side view',
      'fighting': 'fighting game scene',
      'shmup': 'vertical shoot em up view'
    }
    
    const colorMap: Record<string, string> = {
      'colorful': 'vibrant colorful palette',
      'bw': 'black and white monochrome',
      'warm': 'warm color palette',
      'cool': 'cool color palette',
      'cyberpunk': 'neon cyberpunk colors',
      'retro': 'retro sepia vintage tones'
    }
    
    // 添加像素风参数
    if (request.pixelConfig) {
      parts.push(densityMap[request.pixelConfig.density] || 'pixel art')
      parts.push(styleMap[request.pixelConfig.styleRef] || '')
      parts.push(perspectiveMap[request.pixelConfig.perspective] || '')
    }
    
    // 添加色彩
    if (request.colorMode) {
      parts.push(colorMap[request.colorMode.tone] || '')
    }
    
    // 通用像素风增强
    parts.push('pixelated, retro game aesthetic, crisp pixel edges, limited color palette')
    
    return parts.filter(p => p).join(', ')
  }
  
  /** 解析分辨率 */
  protected parseResolution(resolution: string): { width: number; height: number } {
    const [width, height] = resolution.split('x').map(Number)
    return { width: width || 1024, height: height || 1024 }
  }
}

// ============================================
// AI 服务管理器
// ============================================

/** AI 服务管理器 - 统一管理所有 AI 服务 */
export class AiServiceManager {
  private services: Map<AiProvider, IAiService> = new Map()
  private currentProvider: AiProvider = 'tongyi'
  
  /** 注册服务 */
  registerService(service: IAiService): void {
    this.services.set(service.providerId, service)
  }
  
  /** 设置当前提供商 */
  setCurrentProvider(provider: AiProvider): void {
    if (this.services.has(provider)) {
      this.currentProvider = provider
    } else {
      throw new Error(`AI 服务 ${provider} 未注册`)
    }
  }
  
  /** 获取当前服务 */
  getCurrentService(): IAiService {
    const service = this.services.get(this.currentProvider)
    if (!service) {
      throw new Error('当前 AI 服务未配置')
    }
    return service
  }
  
  /** 生成图片 */
  async generate(request: GenerateRequest, config: ProviderConfig): Promise<GenerateResponse> {
    const service = this.getCurrentService()
    return service.generate(request, config)
  }
  
  /** 获取所有已注册的提供商 */
  getRegisteredProviders(): AiProvider[] {
    return Array.from(this.services.keys())
  }
  
  /** 获取当前提供商 */
  get getCurrentProvider(): AiProvider {
    return this.currentProvider
  }
}

// 导出单例管理器
export const aiServiceManager = new AiServiceManager()
