<template>
  <div class="settings-container">
    <div class="settings-layout">
      <!-- AI 服务配置 -->
      <section class="settings-section">
        <h2 class="section-title">
          <span class="icon">🤖</span>
          AI 服务配置
        </h2>
        
        <!-- 提供商选择 -->
        <div class="setting-item">
          <label class="setting-label">选择 AI 提供商</label>
          <div class="provider-grid">
            <button
              v-for="provider in providers"
              :key="provider.id"
              class="provider-card"
              :class="{ 
                active: currentProvider === provider.id,
                configured: isProviderConfigured(provider.id)
              }"
              @click="selectProvider(provider.id)"
            >
              <span class="provider-icon">{{ provider.icon }}</span>
              <span class="provider-name">{{ provider.name }}</span>
              <span class="provider-status" v-if="isProviderConfigured(provider.id)">✓</span>
            </button>
          </div>
        </div>
        
        <!-- 当前提供商配置 -->
        <div class="setting-item" v-if="currentProviderInfo">
          <label class="setting-label">{{ currentProviderInfo.name }} 配置</label>
          
          <div class="config-form">
            <!-- API Key 输入 -->
            <div class="form-group">
              <label>API Key</label>
              <div class="api-key-input">
                <input
                  :type="showApiKey ? 'text' : 'password'"
                  v-model="apiKey"
                  placeholder="输入 API Key..."
                  class="text-input"
                />
                <button class="toggle-visibility" @click="showApiKey = !showApiKey">
                  {{ showApiKey ? '🙈' : '👁️' }}
                </button>
              </div>
              <p class="form-hint">
                <template v-if="currentProvider === 'tongyi'">
                  获取方式：访问 
                  <a href="https://dashscope.console.aliyun.com/" target="_blank">阿里云 DashScope 控制台</a>
                </template>
                <template v-else-if="currentProvider === 'openai'">
                  获取方式：访问 
                  <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys</a>
                </template>
              </p>
            </div>
            
            <!-- 模型选择 -->
            <div class="form-group">
              <label>模型选择</label>
              <select v-model="selectedModel" class="select-input">
                <option 
                  v-for="model in currentProviderInfo.models" 
                  :key="model.id" 
                  :value="model.id"
                >
                  {{ model.name }} {{ model.description ? `- ${model.description}` : '' }}
                </option>
              </select>
            </div>
            
            <!-- 启用开关 -->
            <div class="form-group inline">
              <label>启用此服务</label>
              <label class="switch">
                <input type="checkbox" v-model="providerEnabled" />
                <span class="slider"></span>
              </label>
            </div>
            
            <!-- 保存按钮 -->
            <button class="save-btn" @click="saveProviderConfig">
              💾 保存配置
            </button>
          </div>
        </div>
        
        <!-- 自定义 API（仅 custom 提供商） -->
        <div class="setting-item" v-if="currentProvider === 'custom'">
          <label class="setting-label">自定义 API 地址</label>
          <input
            v-model="customBaseUrl"
            type="text"
            placeholder="https://your-api-endpoint.com/v1/images/generations"
            class="text-input full-width"
          />
        </div>
      </section>
      
      <!-- 默认生成参数 -->
      <section class="settings-section">
        <h2 class="section-title">
          <span class="icon">🎨</span>
          默认生成参数
        </h2>
        
        <div class="setting-item">
          <label class="setting-label">默认分辨率</label>
          <select v-model="defaultParams.resolution" class="select-input">
            <option value="1920x1080">1920 × 1080 (Full HD)</option>
            <option value="2560x1440">2560 × 1440 (2K)</option>
            <option value="3840x2160">3840 × 2160 (4K)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">默认像素密度</label>
          <select v-model="defaultParams.pixelDensity" class="select-input">
            <option value="8bit">8-bit（粗糙颗粒）</option>
            <option value="16bit">16-bit（经典FC/SFC）</option>
            <option value="32bit">32-bit（精细像素）</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">默认像素风格</label>
          <select v-model="defaultParams.pixelStyle" class="select-input">
            <option value="fc">FC红白机风格</option>
            <option value="sfc">SFC风格</option>
            <option value="gb">GameBoy风格</option>
            <option value="arcade">街机风格</option>
            <option value="modern">现代像素风</option>
          </select>
        </div>
        
        <button class="save-btn secondary" @click="saveDefaultParams">
          💾 保存默认参数
        </button>
      </section>
      
      <!-- 应用设置 -->
      <section class="settings-section">
        <h2 class="section-title">
          <span class="icon">📱</span>
          应用设置
        </h2>
        
        <div class="setting-item">
          <div class="form-group inline">
            <label>自动保存生成的壁纸</label>
            <label class="switch">
              <input type="checkbox" v-model="appSettings.autoSave" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="form-group inline">
            <label>生成后自动设为壁纸</label>
            <label class="switch">
              <input type="checkbox" v-model="appSettings.autoSetWallpaper" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
        
        <div class="setting-item">
          <label class="setting-label">文件命名格式</label>
          <select v-model="appSettings.namingFormat" class="select-input">
            <option value="timestamp">时间戳</option>
            <option value="prompt">提示词摘要</option>
            <option value="id">唯一ID</option>
          </select>
        </div>
        
        <button class="save-btn secondary" @click="saveAppSettings">
          💾 保存应用设置
        </button>
      </section>
      
      <!-- 数据管理 -->
      <section class="settings-section">
        <h2 class="section-title">
          <span class="icon">📦</span>
          数据管理
        </h2>
        
        <div class="setting-item">
          <div class="action-row">
            <button class="action-btn" @click="exportConfig">
              📤 导出配置
            </button>
            <button class="action-btn" @click="triggerImport">
              📥 导入配置
            </button>
            <input 
              ref="importInput"
              type="file" 
              accept=".json"
              style="display: none"
              @change="handleImport"
            />
          </div>
        </div>
        
        <div class="setting-item danger-zone">
          <label class="setting-label">危险操作</label>
          <div class="action-row">
            <button class="action-btn danger" @click="resetConfig">
              🗑️ 重置所有配置
            </button>
            <button class="action-btn danger" @click="clearAllData">
              🧹 清除所有数据
            </button>
          </div>
        </div>
      </section>
      
      <!-- 关于 -->
      <section class="settings-section about">
        <h2 class="section-title">
          <span class="icon">ℹ️</span>
          关于
        </h2>
        <div class="about-content">
          <p><strong>PixelWallpaper AI</strong> v1.0</p>
          <p>AI 像素风壁纸生成器</p>
          <p class="copyright">致敬 FC/SFC 时代的像素艺术</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Settings.vue - 设置面板
 * 管理 AI 服务配置、默认参数、应用设置等
 */
import { ref, computed, onMounted } from 'vue'
import { configService } from '../services/config-service'
import { PROVIDERS, type AiProvider, type ProviderInfo } from '../services/ai-service'

// ============ 状态 ============
const currentProvider = ref<AiProvider>('tongyi')
const apiKey = ref('')
const selectedModel = ref('')
const providerEnabled = ref(true)
const customBaseUrl = ref('')
const showApiKey = ref(false)
const importInput = ref<HTMLInputElement | null>(null)

// 默认参数
const defaultParams = ref({
  resolution: '1920x1080',
  scene: 'fc_retro',
  colorTone: 'colorful',
  pixelDensity: '16bit',
  pixelStyle: 'fc',
  perspective: 'side_scroll',
  composition: 'center'
})

// 应用设置
const appSettings = ref({
  autoSave: true,
  autoSetWallpaper: false,
  savePath: '',
  namingFormat: 'timestamp' as const
})

// 提供商列表
const providers = computed(() => Object.values(PROVIDERS))

// 当前提供商信息
const currentProviderInfo = computed(() => PROVIDERS[currentProvider.value])

// ============ 方法 ============

/** 初始化加载配置 */
onMounted(() => {
  loadConfig()
})

/** 加载配置 */
const loadConfig = () => {
  const config = configService.getConfig()
  currentProvider.value = config.currentProvider
  
  const providerConfig = configService.getCurrentProviderConfig()
  if (providerConfig) {
    apiKey.value = providerConfig.apiKey
    selectedModel.value = providerConfig.model
    providerEnabled.value = providerConfig.enabled
    customBaseUrl.value = providerConfig.baseUrl || ''
  }
  
  defaultParams.value = { ...config.defaultParams }
  appSettings.value = { ...config.settings }
}

/** 检查提供商是否已配置 */
const isProviderConfigured = (provider: AiProvider): boolean => {
  const config = configService.getProviderConfig(provider)
  return !!(config && config.apiKey && config.enabled)
}

/** 选择提供商 */
const selectProvider = (provider: AiProvider) => {
  currentProvider.value = provider
  const config = configService.getProviderConfig(provider)
  if (config) {
    apiKey.value = config.apiKey
    selectedModel.value = config.model || PROVIDERS[provider].defaultModel
    providerEnabled.value = config.enabled
    customBaseUrl.value = config.baseUrl || ''
  } else {
    apiKey.value = ''
    selectedModel.value = PROVIDERS[provider].defaultModel
    providerEnabled.value = true
    customBaseUrl.value = ''
  }
}

/** 保存提供商配置 */
const saveProviderConfig = () => {
  configService.setProviderConfig({
    provider: currentProvider.value,
    apiKey: apiKey.value,
    model: selectedModel.value,
    enabled: providerEnabled.value,
    baseUrl: customBaseUrl.value || undefined
  })
  configService.setCurrentProvider(currentProvider.value)
  alert('配置已保存！')
}

/** 保存默认参数 */
const saveDefaultParams = () => {
  configService.setDefaultParams(defaultParams.value)
  alert('默认参数已保存！')
}

/** 保存应用设置 */
const saveAppSettings = () => {
  configService.setSettings(appSettings.value)
  alert('应用设置已保存！')
}

/** 导出配置 */
const exportConfig = () => {
  const json = configService.exportConfig()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pixelwallpaper-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** 触发导入 */
const triggerImport = () => {
  importInput.value?.click()
}

/** 处理导入 */
const handleImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const json = e.target?.result as string
    if (configService.importConfig(json)) {
      loadConfig()
      alert('配置导入成功！')
    } else {
      alert('配置导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
}

/** 重置配置 */
const resetConfig = () => {
  if (confirm('确定要重置所有配置吗？API Key 将被清除。')) {
    configService.reset()
    loadConfig()
    alert('配置已重置！')
  }
}

/** 清除所有数据 */
const clearAllData = () => {
  if (confirm('确定要清除所有数据吗？包括壁纸、配置等所有数据将被删除，此操作不可恢复！')) {
    localStorage.clear()
    loadConfig()
    alert('所有数据已清除！')
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

/* Section 样式 */
.settings-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  margin-bottom: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
}

.icon {
  font-size: 1.3rem;
}

/* Setting Item */
.setting-item {
  margin-bottom: 1.25rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

/* Provider Grid */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.provider-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem 0.75rem;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.provider-card:hover {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
}

.provider-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.2);
}

.provider-card.configured::after {
  content: '✓';
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.8rem;
  color: #10b981;
}

.provider-icon {
  font-size: 1.8rem;
}

.provider-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.provider-status {
  position: absolute;
  top: 6px;
  right: 6px;
  color: #10b981;
}

/* Form */
.config-form {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group.inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.4rem;
}

.form-group.inline label {
  margin-bottom: 0;
}

.form-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.4rem;
}

.form-hint a {
  color: #667eea;
  text-decoration: none;
}

.form-hint a:hover {
  text-decoration: underline;
}

/* API Key Input */
.api-key-input {
  display: flex;
  gap: 0.5rem;
}

.api-key-input .text-input {
  flex: 1;
}

.toggle-visibility {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  font-size: 1rem;
}

/* Inputs */
.text-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.9rem;
}

.text-input:focus {
  outline: none;
  border-color: #667eea;
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.select-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
}

.select-input option {
  background: #1a1a2e;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #667eea;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Buttons */
.save-btn {
  width: 100%;
  padding: 0.75rem;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.save-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.save-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}

/* Action Row */
.action-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.danger {
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Danger Zone */
.danger-zone {
  border-top: 1px solid rgba(239, 68, 68, 0.3);
  padding-top: 1.25rem;
  margin-top: 1.25rem;
}

/* About */
.about {
  text-align: center;
}

.about-content p {
  margin: 0.4rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.about-content .copyright {
  font-size: 0.8rem;
  opacity: 0.6;
  margin-top: 0.75rem;
}

/* Responsive */
/* ============================================
   中等屏幕适配（笔记本 125% 缩放）
   ============================================ */
@media (max-width: 1100px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .settings-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .setting-item {
    margin-bottom: 1rem;
  }

  .setting-label {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }

  .provider-grid {
    gap: 0.75rem;
  }

  .provider-card {
    padding: 0.75rem;
    gap: 0.4rem;
  }

  .provider-icon {
    font-size: 1.2rem;
  }

  .provider-name {
    font-size: 0.85rem;
  }

  .input-field,
  .select-input {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }

  .api-key-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .api-key-row .input-field {
    width: 100%;
  }

  .action-row {
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1;
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) {
  .provider-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-row {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>
