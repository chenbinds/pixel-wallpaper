/**
 * settings.ts - 应用设置状态管理 (Pinia Store)
 * 管理用户设置和偏好配置
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, ApiConfig, WallpaperStyle } from '../types/wallpaper'

/**
 * 默认设置
 */
const defaultSettings: AppSettings = {
  apiConfig: {
    provider: 'openai',
    apiKey: '',
    customUrl: '',
  },
  defaultResolution: '1920x1080',
  defaultStyle: 'realistic',
  autoSave: true,
  autoSetWallpaper: false,
  savePath: '',
  namingFormat: 'timestamp',
}

/**
 * 设置 Store
 */
export const useSettingsStore = defineStore('settings', () => {
  // ==================== State ====================

  /** 应用设置 */
  const settings = ref<AppSettings>({ ...defaultSettings })

  /** 是否已加载 */
  const isLoaded = ref(false)

  /** 是否正在保存 */
  const isSaving = ref(false)

  // ==================== Getters ====================

  /**
   * API 是否已配置
   */
  const isApiConfigured = computed(() => {
    return settings.value.apiConfig.apiKey.length > 0
  })

  /**
   * API 提供商名称
   */
  const providerName = computed(() => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      stability: 'Stability AI',
      midjourney: 'Midjourney',
      custom: '自定义',
    }
    return names[settings.value.apiConfig.provider] || '未知'
  })

  /**
   * 是否有自定义保存路径
   */
  const hasCustomSavePath = computed(() => {
    return settings.value.savePath.length > 0
  })

  // ==================== Actions ====================

  /**
   * 更新 API 配置
   */
  function updateApiConfig(config: Partial<ApiConfig>) {
    settings.value.apiConfig = {
      ...settings.value.apiConfig,
      ...config,
    }
  }

  /**
   * 设置 API 密钥
   */
  function setApiKey(apiKey: string) {
    settings.value.apiConfig.apiKey = apiKey
  }

  /**
   * 设置 API 提供商
   */
  function setProvider(provider: ApiConfig['provider']) {
    settings.value.apiConfig.provider = provider
  }

  /**
   * 设置默认分辨率
   */
  function setDefaultResolution(resolution: string) {
    settings.value.defaultResolution = resolution
  }

  /**
   * 设置默认风格
   */
  function setDefaultStyle(style: WallpaperStyle) {
    settings.value.defaultStyle = style
  }

  /**
   * 设置自动保存
   */
  function setAutoSave(autoSave: boolean) {
    settings.value.autoSave = autoSave
  }

  /**
   * 设置自动设为壁纸
   */
  function setAutoSetWallpaper(autoSet: boolean) {
    settings.value.autoSetWallpaper = autoSet
  }

  /**
   * 设置保存路径
   */
  function setSavePath(path: string) {
    settings.value.savePath = path
  }

  /**
   * 设置文件命名格式
   */
  function setNamingFormat(format: AppSettings['namingFormat']) {
    settings.value.namingFormat = format
  }

  /**
   * 加载设置
   * 从 Electron 后端加载
   */
  async function loadSettings(): Promise<boolean> {
    // Check if we're in Electron environment
    if (!window.electronAPI) {
      console.log('[Settings] Not in Electron environment, using defaults')
      settings.value = { ...defaultSettings }
      isLoaded.value = true
      return true
    }

    try {
      const result = await window.electronAPI.invoke('get-settings')

      settings.value.apiConfig.apiKey = result.api_key
      settings.value.defaultResolution = result.default_resolution
      settings.value.savePath = result.save_path
      settings.value.autoSave = result.auto_save

      isLoaded.value = true
      return true
    } catch (error) {
      console.error('加载设置失败:', error)
      // 使用默认设置
      settings.value = { ...defaultSettings }
      return false
    }
  }

  /**
   * 保存设置
   * 保存到 Electron 后端
   */
  async function saveSettings(): Promise<boolean> {
    isSaving.value = true

    // Check if we're in Electron environment
    if (!window.electronAPI) {
      console.log('[Settings] Not in Electron environment, saving to localStorage')
      try {
        localStorage.setItem('pixel-wallpaper-settings', JSON.stringify(settings.value))
        return true
      } catch (error) {
        console.error('保存设置到 localStorage 失败:', error)
        return false
      } finally {
        isSaving.value = false
      }
    }

    try {
      await window.electronAPI.invoke('save-settings', {
        newSettings: {
          api_key: settings.value.apiConfig.apiKey,
          default_resolution: settings.value.defaultResolution,
          save_path: settings.value.savePath,
          auto_save: settings.value.autoSave,
        },
      })

      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 重置为默认设置
   */
  function resetToDefaults() {
    settings.value = { ...defaultSettings }
  }

  /**
   * 导出设置
   */
  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  /**
   * 导入设置
   */
  function importSettings(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as AppSettings
      settings.value = { ...defaultSettings, ...parsed }
      return true
    } catch (error) {
      console.error('导入设置失败:', error)
      return false
    }
  }

  // ==================== Return ====================

  return {
    // State
    settings,
    isLoaded,
    isSaving,

    // Getters
    isApiConfigured,
    providerName,
    hasCustomSavePath,

    // Actions
    updateApiConfig,
    setApiKey,
    setProvider,
    setDefaultResolution,
    setDefaultStyle,
    setAutoSave,
    setAutoSetWallpaper,
    setSavePath,
    setNamingFormat,
    loadSettings,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  }
})
