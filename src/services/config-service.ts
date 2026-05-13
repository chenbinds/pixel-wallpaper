/**
 * config-service.ts - 安全的配置存储服务
 * 使用加密存储敏感信息（如 API Key）
 */

import type { ProviderConfig, AiProvider } from './ai-service'

// ============================================
// 加密工具
// ============================================

/** 简单的加密密钥（实际应用中应该使用更安全的方式） */
const getEncryptionKey = (): string => {
  // 使用浏览器指纹或用户 ID 作为加密密钥的一部分
  // 这里简化处理，实际应该使用更安全的方式
  const storedKey = localStorage.getItem('app_secret')
  if (storedKey) return storedKey
  
  // 生成新的密钥
  const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  localStorage.setItem('app_secret', newKey)
  return newKey
}

/** 简单的 XOR 加密（用于演示，生产环境应使用 Web Crypto API） */
const encrypt = (text: string, key: string): string => {
  const keyBytes = new TextEncoder().encode(key)
  const textBytes = new TextEncoder().encode(text)
  const encrypted = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length])
  return btoa(String.fromCharCode(...encrypted))
}

/** 解密 */
const decrypt = (encrypted: string, key: string): string => {
  try {
    const keyBytes = new TextEncoder().encode(key)
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const decrypted = encryptedBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length])
    return new TextDecoder().decode(decrypted)
  } catch {
    return ''
  }
}

// ============================================
// 配置存储服务
// ============================================

/** 应用配置 */
export interface AppConfig {
  /** AI 提供商配置列表 */
  providers: ProviderConfig[]
  /** 当前使用的提供商 */
  currentProvider: AiProvider
  /** 默认生成参数 */
  defaultParams: {
    resolution: string
    scene: string
    colorTone: string
    pixelDensity: string
    pixelStyle: string
    perspective: string
    composition: string
  }
  /** 应用设置 */
  settings: {
    autoSave: boolean
    autoSetWallpaper: boolean
    savePath: string
    namingFormat: 'timestamp' | 'prompt' | 'id' | 'custom'
  }
}

/** 默认配置 */
const DEFAULT_CONFIG: AppConfig = {
  providers: [
    { provider: 'tongyi', apiKey: '', model: 'wanx-v1', enabled: true },
    { provider: 'openai', apiKey: '', model: 'dall-e-3', enabled: false },
  ],
  currentProvider: 'tongyi',
  defaultParams: {
    resolution: '1920x1080',
    scene: 'fc_retro',
    colorTone: 'colorful',
    pixelDensity: '16bit',
    pixelStyle: 'fc',
    perspective: 'side_scroll',
    composition: 'center'
  },
  settings: {
    autoSave: true,
    autoSetWallpaper: false,
    savePath: '',
    namingFormat: 'timestamp'
  }
}

// ============================================
// 配置服务类
// ============================================

export class ConfigService {
  private readonly STORAGE_KEY = 'pixelwallpaper_config'
  private config: AppConfig
  private encryptionKey: string
  
  constructor() {
    this.encryptionKey = getEncryptionKey()
    this.config = this.load()
  }
  
  /** 加载配置 */
  private load(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return { ...DEFAULT_CONFIG }
      
      const parsed = JSON.parse(stored)
      
      // 解密 API Keys
      if (parsed.providers) {
        parsed.providers = parsed.providers.map((p: ProviderConfig) => ({
          ...p,
          apiKey: p.apiKey ? decrypt(p.apiKey, this.encryptionKey) : ''
        }))
      }
      
      return { ...DEFAULT_CONFIG, ...parsed }
    } catch (error) {
      console.error('加载配置失败:', error)
      return { ...DEFAULT_CONFIG }
    }
  }
  
  /** 保存配置 */
  private save(): void {
    try {
      // 加密 API Keys
      const toSave = {
        ...this.config,
        providers: this.config.providers.map(p => ({
          ...p,
          apiKey: p.apiKey ? encrypt(p.apiKey, this.encryptionKey) : ''
        }))
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }
  
  /** 获取完整配置 */
  getConfig(): AppConfig {
    return this.config
  }
  
  /** 获取当前提供商配置 */
  getCurrentProviderConfig(): ProviderConfig | undefined {
    return this.config.providers.find(p => p.provider === this.config.currentProvider)
  }
  
  /** 获取指定提供商配置 */
  getProviderConfig(provider: AiProvider): ProviderConfig | undefined {
    return this.config.providers.find(p => p.provider === provider)
  }
  
  /** 设置提供商配置 */
  setProviderConfig(config: ProviderConfig): void {
    const index = this.config.providers.findIndex(p => p.provider === config.provider)
    if (index >= 0) {
      this.config.providers[index] = config
    } else {
      this.config.providers.push(config)
    }
    this.save()
  }
  
  /** 设置 API Key */
  setApiKey(provider: AiProvider, apiKey: string): void {
    const config = this.getProviderConfig(provider)
    if (config) {
      config.apiKey = apiKey
      this.save()
    }
  }
  
  /** 获取 API Key（已解密） */
  getApiKey(provider: AiProvider): string {
    return this.getProviderConfig(provider)?.apiKey || ''
  }
  
  /** 设置当前提供商 */
  setCurrentProvider(provider: AiProvider): void {
    this.config.currentProvider = provider
    this.save()
  }
  
  /** 获取当前提供商 */
  getCurrentProvider(): AiProvider {
    return this.config.currentProvider
  }
  
  /** 设置默认参数 */
  setDefaultParams(params: Partial<AppConfig['defaultParams']>): void {
    this.config.defaultParams = { ...this.config.defaultParams, ...params }
    this.save()
  }
  
  /** 获取默认参数 */
  getDefaultParams(): AppConfig['defaultParams'] {
    return this.config.defaultParams
  }
  
  /** 设置应用设置 */
  setSettings(settings: Partial<AppConfig['settings']>): void {
    this.config.settings = { ...this.config.settings, ...settings }
    this.save()
  }
  
  /** 获取应用设置 */
  getSettings(): AppConfig['settings'] {
    return this.config.settings
  }
  
  /** 验证当前提供商是否配置完成 */
  isCurrentProviderConfigured(): boolean {
    const config = this.getCurrentProviderConfig()
    return !!(config && config.apiKey && config.enabled)
  }
  
  /** 重置配置 */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG }
    this.save()
  }
  
  /** 导出配置（不包含 API Key） */
  exportConfig(): string {
    const toExport = {
      ...this.config,
      providers: this.config.providers.map(p => ({
        provider: p.provider,
        model: p.model,
        enabled: p.enabled,
        apiKey: ''  // 不导出 API Key
      }))
    }
    return JSON.stringify(toExport, null, 2)
  }
  
  /** 导入配置 */
  importConfig(json: string): boolean {
    try {
      const imported = JSON.parse(json)
      // 保留现有的 API Keys
      const existingKeys = new Map(
        this.config.providers.map(p => [p.provider, p.apiKey])
      )
      
      this.config = {
        ...DEFAULT_CONFIG,
        ...imported,
        providers: imported.providers?.map((p: ProviderConfig) => ({
          ...p,
          apiKey: existingKeys.get(p.provider) || ''
        })) || DEFAULT_CONFIG.providers
      }
      
      this.save()
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }
}

// 导出单例
export const configService = new ConfigService()
