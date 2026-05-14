<template>
  <div class="generator-container">
    <h1 class="page-title">✨ AI 像素风壁纸生成器</h1>
    
    <div class="generator-layout">
      <!-- 左侧：生成控制面板 -->
      <div class="control-panel">
        <!-- 模式切换：生成 / 上传 -->
        <div class="section mode-switch">
          <div class="mode-tabs">
            <button 
              class="mode-tab" 
              :class="{ active: activeMode === 'generate' }"
              @click="activeMode = 'generate'"
            >
              <span>✨</span> AI 生成
            </button>
            <button 
              class="mode-tab" 
              :class="{ active: activeMode === 'upload' }"
              @click="activeMode = 'upload'"
            >
              <span>📤</span> 手动上传
            </button>
          </div>
        </div>

        <!-- AI 生成模式 -->
        <template v-if="activeMode === 'generate'">
          <!-- 快速预设模板 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">⚡</span>
              快速预设
            </label>
            <div class="preset-grid">
              <button
                v-for="preset in presetTemplates"
                :key="preset.id"
                class="preset-btn"
                :class="{ active: selectedPreset === preset.id }"
                @click="applyPreset(preset)"
              >
                <span class="preset-icon">{{ preset.icon }}</span>
                <span class="preset-name">{{ preset.name }}</span>
              </button>
            </div>
          </div>

          <!-- 提示词输入 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">💭</span>
              描述你想要的壁纸
            </label>
            <textarea
              v-model="prompt"
              class="prompt-input"
              placeholder="例如：一片宁静的星空下，有一座古老的城堡，周围环绕着萤火虫..."
              rows="3"
            />
            <div class="prompt-hint">
              提示：描述越详细，生成的效果越好。留空则使用预设配置。
            </div>
          </div>

          <!-- 分辨率选择 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">📐</span>
              分辨率 / 比例
            </label>
            <select v-model="resolution" class="select-input">
              <optgroup label="常用分辨率">
                <option v-for="res in resolutionOptions.common" :key="res.value" :value="res.value">
                  {{ res.label }}
                </option>
              </optgroup>
              <optgroup label="超宽屏">
                <option v-for="res in resolutionOptions.ultrawide" :key="res.value" :value="res.value">
                  {{ res.label }}
                </option>
              </optgroup>
              <optgroup label="竖屏">
                <option v-for="res in resolutionOptions.portrait" :key="res.value" :value="res.value">
                  {{ res.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 场景风格 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">🏞️</span>
              场景风格
            </label>
            <div class="category-tabs">
              <button
                v-for="cat in sceneCategories"
                :key="cat.value"
                class="category-tab"
                :class="{ active: selectedSceneCategory === cat.value }"
                @click="selectedSceneCategory = cat.value"
              >
                {{ cat.icon }} {{ cat.label }}
              </button>
            </div>
            <div class="scene-grid">
              <button
                v-for="scene in filteredScenes"
                :key="scene.value"
                class="scene-btn"
                :class="{ active: sceneStyle === scene.value }"
                @click="sceneStyle = scene.value"
              >
                <span class="scene-icon">{{ scene.icon }}</span>
                <span class="scene-name">{{ scene.label }}</span>
              </button>
            </div>
          </div>

          <!-- 色彩模式 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">🎨</span>
              色彩模式
            </label>
            <div class="color-grid">
              <button
                v-for="color in colorOptions"
                :key="color.value"
                class="color-btn"
                :class="{ active: colorTone === color.value }"
                @click="colorTone = color.value"
              >
                <span class="color-preview" :style="{ background: color.preview }"></span>
                <span class="color-name">{{ color.label }}</span>
              </button>
            </div>
          </div>

          <!-- 像素风专属参数（核心特色） -->
          <div class="section pixel-section">
            <label class="section-title">
              <span class="icon">👾</span>
              像素风参数
              <span class="badge">核心</span>
            </label>
            
            <!-- 像素密度 -->
            <div class="pixel-row">
              <span class="pixel-label">像素密度</span>
              <div class="pixel-options">
                <button
                  v-for="opt in pixelDensityOptions"
                  :key="opt.value"
                  class="pixel-btn"
                  :class="{ active: pixelDensity === opt.value }"
                  @click="pixelDensity = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- 风格参考 -->
            <div class="pixel-row">
              <span class="pixel-label">风格参考</span>
              <div class="pixel-options">
                <button
                  v-for="opt in pixelStyleOptions"
                  :key="opt.value"
                  class="pixel-btn"
                  :class="{ active: pixelStyle === opt.value }"
                  @click="pixelStyle = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- 游戏视角 -->
            <div class="pixel-row">
              <span class="pixel-label">游戏视角</span>
              <div class="pixel-options">
                <button
                  v-for="opt in perspectiveOptions"
                  :key="opt.value"
                  class="pixel-btn"
                  :class="{ active: perspective === opt.value }"
                  @click="perspective = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- 构图 -->
          <div class="section">
            <label class="section-title">
              <span class="icon">📷</span>
              构图方式
            </label>
            <div class="composition-grid">
              <button
                v-for="comp in compositionOptions"
                :key="comp.value"
                class="composition-btn"
                :class="{ active: composition === comp.value }"
                @click="composition = comp.value"
              >
                {{ comp.label }}
              </button>
            </div>
          </div>

          <!-- 生成按钮 -->
          <button
            class="generate-btn"
            :disabled="isGenerating"
            @click="handleGenerate"
          >
            <span v-if="isGenerating" class="loading-spinner"></span>
            <span v-else class="btn-icon">🚀</span>
            {{ isGenerating ? 'AI 创作中...' : '开始生成' }}
          </button>
        </template>

        <!-- 手动上传模式 -->
        <template v-else>
          <div class="section">
            <label class="section-title">
              <span class="icon">📤</span>
              上传图片
            </label>
            
            <!-- 拖拽上传区域 -->
            <div 
              class="upload-dropzone"
              :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
              @dragenter.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
              @click="selectFile"
            >
              <input 
                ref="fileInput"
                type="file" 
                accept="image/*"
                style="display: none"
                @change="handleFileSelect"
              />
              <div v-if="!selectedFile" class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <p>点击选择或拖拽图片到此处</p>
                <p class="upload-hint">支持 JPG、PNG、WebP、BMP 格式</p>
              </div>
              <div v-else class="upload-preview">
                <img :src="selectedFilePreview" alt="预览" />
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
            </div>
          </div>

          <!-- 上传信息填写 -->
          <div class="section" v-if="selectedFile">
            <label class="section-title">
              <span class="icon">📝</span>
              图片信息（可选）
            </label>
            
            <div class="upload-form">
              <div class="form-field">
                <label>描述 / 标签</label>
                <textarea
                  v-model="uploadDescription"
                  class="prompt-input"
                  placeholder="添加图片描述或标签，方便后续查找..."
                  rows="2"
                />
              </div>
              
              <div class="form-field">
                <label>原图作者</label>
                <input
                  v-model="uploadAuthor"
                  type="text"
                  class="text-input"
                  placeholder="原作者名称（如果有）"
                />
              </div>
            </div>
          </div>

          <!-- 上传按钮 -->
          <button
            class="generate-btn upload-btn"
            :disabled="!selectedFile || isUploading"
            @click="handleUpload"
          >
            <span v-if="isUploading" class="loading-spinner"></span>
            <span v-else class="btn-icon">📤</span>
            {{ isUploading ? '上传中...' : '上传到画廊' }}
          </button>
        </template>
      </div>

      <!-- 右侧：预览区域 -->
      <div class="preview-panel">
        <div class="preview-container" :class="{ 'has-image': generatedImage }">
          <div v-if="!generatedImage && !isGenerating" class="empty-state">
            <span class="empty-icon">🎮</span>
            <p>配置好参数后点击生成</p>
            <p class="empty-hint">AI 将为你创作专属像素风壁纸</p>
          </div>
          
          <div v-else-if="isGenerating" class="generating-state">
            <div class="pixel-animation">
              <div v-for="i in 9" :key="i" class="pixel-block"></div>
            </div>
            <p>AI 正在绘制像素世界...</p>
            <p class="progress-text">{{ Math.floor(progress) }}%</p>
          </div>
          
          <img
            v-else
            :src="generatedImage"
            alt="生成的壁纸"
            class="generated-image"
          />
        </div>

        <!-- 生成的提示词展示 -->
        <div v-if="generatedPrompt && !isGenerating" class="prompt-display">
          <div class="prompt-header">
            <label>实际使用的提示词：</label>
            <button class="copy-btn" @click="copyPrompt" title="复制提示词">
              📋
            </button>
          </div>
          <p class="prompt-text">{{ generatedPrompt }}</p>
        </div>

        <div v-if="generatedImage && !isGenerating" class="action-buttons">
          <button class="action-btn secondary" @click="handleRegenerate">
            <span>🔄</span> 重新生成
          </button>
          <button class="action-btn primary" @click="handleSave">
            <span>💾</span> 保存到画廊
          </button>
          <button class="action-btn secondary" @click="handleSetWallpaper()">
            <span>🖥️</span> 设为桌面
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Generator.vue - AI 像素风壁纸生成主界面
 * 提供完整的参数配置和生成预览功能
 */
import { ref, computed, watch } from 'vue'
import { useGeneratorStore } from '../stores/generator'
import { tongyiService } from '../services/tongyi-service'
import { configService } from '../services/config-service'
import { tauriService } from '../services/tauri-service'
import type { 
  Resolution, SceneStyle, ColorTone, PixelDensity, 
  PixelStyleRef, GamePerspective, Composition,
  GenerateRequest, PresetTemplate, Wallpaper 
} from '../types/wallpaper'

// Store
const store = useGeneratorStore()

// ============ 响应式状态 ============
const prompt = ref('')
const resolution = ref<Resolution>('1920x1080')
const selectedPreset = ref('')
const selectedSceneCategory = ref('game')
const sceneStyle = ref<SceneStyle>('fc_retro')
const colorTone = ref<ColorTone>('colorful')
const pixelDensity = ref<PixelDensity>('16bit')
const pixelStyle = ref<PixelStyleRef>('fc')
const perspective = ref<GamePerspective>('side_scroll')
const composition = ref<Composition>('center')

const isGenerating = ref(false)
const progress = ref(0)
const generatedImage = ref('')
const generatedPrompt = ref('')

// ============ 预设模板 ============
const presetTemplates: PresetTemplate[] = [
  {
    id: 'fc_castle',
    name: 'FC城堡',
    description: '经典FC游戏风格的城堡场景',
    icon: '🏰',
    config: {
      scene: 'fc_retro',
      pixelConfig: { density: '8bit', styleRef: 'fc', perspective: 'side_scroll' },
      colorMode: { tone: 'colorful' }
    }
  },
  {
    id: 'rpg_village',
    name: 'RPG村庄',
    description: '俯视角RPG风格的村庄',
    icon: '🏘️',
    config: {
      scene: 'rpg_map',
      pixelConfig: { density: '16bit', styleRef: 'sfc', perspective: 'top_down' },
      colorMode: { tone: 'warm' }
    }
  },
  {
    id: 'space_shooter',
    name: '太空射击',
    description: '街机风格的太空射击场景',
    icon: '🚀',
    config: {
      scene: 'shooter',
      pixelConfig: { density: '16bit', styleRef: 'arcade', perspective: 'shmup' },
      colorMode: { tone: 'cyberpunk' }
    }
  },
  {
    id: 'retro_neon',
    name: '复古霓虹',
    description: '赛博朋克霓虹夜景',
    icon: '🌃',
    config: {
      scene: 'neon',
      pixelConfig: { density: '32bit', styleRef: 'modern', perspective: 'side_scroll' },
      colorMode: { tone: 'cyberpunk' }
    }
  },
  {
    id: 'gb_landscape',
    name: 'GB风景',
    description: 'GameBoy风格的灰度风景',
    icon: '🎮',
    config: {
      scene: 'mountain',
      pixelConfig: { density: '8bit', styleRef: 'gb', perspective: 'side_scroll' },
      colorMode: { tone: 'bw' }
    }
  },
  {
    id: 'platformer',
    name: '平台跳跃',
    description: '平台跳跃游戏场景',
    icon: '🦘',
    config: {
      scene: 'platformer',
      pixelConfig: { density: '16bit', styleRef: 'sfc', perspective: 'platformer' },
      colorMode: { tone: 'colorful' }
    }
  }
]

// ============ 选项配置 ============
const resolutionOptions = {
  common: [
    { value: '1920x1080', label: '1920 × 1080 (Full HD / 16:9)', ratio: '16:9' },
    { value: '2560x1440', label: '2560 × 1440 (2K / 16:9)', ratio: '16:9' },
    { value: '3840x2160', label: '3840 × 2160 (4K / 16:9)', ratio: '16:9' },
    { value: '1366x768', label: '1366 × 768 (HD / 16:9)', ratio: '16:9' },
  ],
  ultrawide: [
    { value: '2560x1080', label: '2560 × 1080 (21:9 超宽屏)', ratio: '21:9' },
    { value: '3440x1440', label: '3440 × 1440 (21:9 超宽屏)', ratio: '21:9' },
    { value: '5120x1440', label: '5120 × 1440 (32:9 超宽屏)', ratio: '32:9' },
  ],
  portrait: [
    { value: '1080x1920', label: '1080 × 1920 (竖屏)', ratio: '9:16' },
    { value: '1440x2560', label: '1440 × 2560 (竖屏)', ratio: '9:16' },
  ],
  other: [
    { value: '1920x1200', label: '1920 × 1200 (16:10)', ratio: '16:10' },
    { value: '2560x1600', label: '2560 × 1600 (16:10)', ratio: '16:10' },
  ]
}

const sceneCategories = [
  { value: 'game', label: '游戏', icon: '🎮' },
  { value: 'nature', label: '自然', icon: '🌲' },
  { value: 'urban', label: '都市', icon: '🏙️' },
  { value: 'culture', label: '人文', icon: '🏯' },
  { value: 'fantasy', label: '幻想', icon: '🔮' },
  { value: 'cute', label: '可爱', icon: '😊' },
  { value: 'abstract', label: '抽象', icon: '🎨' },
]

const sceneOptions = [
  // 游戏
  { value: 'fc_retro', label: 'FC复古', icon: '👾', category: 'game' },
  { value: 'rpg_map', label: 'RPG地图', icon: '🗺️', category: 'game' },
  { value: 'shooter', label: '太空射击', icon: '🚀', category: 'game' },
  { value: 'platformer', label: '平台跳跃', icon: '🦘', category: 'game' },
  // 自然
  { value: 'mountain', label: '山川', icon: '⛰️', category: 'nature' },
  { value: 'ocean', label: '海洋', icon: '🌊', category: 'nature' },
  { value: 'forest', label: '森林', icon: '🌲', category: 'nature' },
  { value: 'sky', label: '星空', icon: '✨', category: 'nature' },
  { value: 'flower', label: '花田', icon: '🌸', category: 'nature' },
  { value: 'seasons', label: '四季', icon: '🍂', category: 'nature' },
  // 都市
  { value: 'skyline', label: '天际线', icon: '🌆', category: 'urban' },
  { value: 'street', label: '街道', icon: '🛣️', category: 'urban' },
  { value: 'neon', label: '霓虹夜景', icon: '🌃', category: 'urban' },
  { value: 'cyberpunk', label: '赛博朋克', icon: '🤖', category: 'urban' },
  { value: 'architecture', label: '建筑', icon: '🏛️', category: 'urban' },
  // 人文
  { value: 'chinese', label: '古风', icon: '🏯', category: 'culture' },
  { value: 'japanese', label: '和风', icon: '⛩️', category: 'culture' },
  { value: 'european', label: '欧洲古典', icon: '🏰', category: 'culture' },
  { value: 'steampunk', label: '蒸汽朋克', icon: '⚙️', category: 'culture' },
  // 幻想
  { value: 'fantasy', label: '奇幻冒险', icon: '🐉', category: 'fantasy' },
  { value: 'scifi', label: '科幻太空', icon: '🪐', category: 'fantasy' },
  { value: 'underwater', label: '海底世界', icon: '🐠', category: 'fantasy' },
  { value: 'magic', label: '魔法森林', icon: '🧙', category: 'fantasy' },
  // 可爱
  { value: 'animal', label: '动物', icon: '🐱', category: 'cute' },
  { value: 'food', label: '美食', icon: '🍰', category: 'cute' },
  { value: 'cartoon', label: '卡通', icon: '😺', category: 'cute' },
  { value: 'chibi', label: 'Q版', icon: '😊', category: 'cute' },
  // 抽象
  { value: 'geometric', label: '几何', icon: '🔷', category: 'abstract' },
  { value: 'gradient', label: '渐变', icon: '🌈', category: 'abstract' },
  { value: 'texture', label: '纹理', icon: '📜', category: 'abstract' },
  { value: 'psychedelic', label: '迷幻', icon: '🌀', category: 'abstract' },
]

const filteredScenes = computed(() => 
  sceneOptions.filter(s => s.category === selectedSceneCategory.value)
)

const colorOptions = [
  { value: 'colorful', label: '彩色', preview: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)' },
  { value: 'bw', label: '黑白', preview: 'linear-gradient(45deg, #000, #fff)' },
  { value: 'warm', label: '暖色调', preview: 'linear-gradient(45deg, #ff9a56, #ffad56)' },
  { value: 'cool', label: '冷色调', preview: 'linear-gradient(45deg, #667eea, #764ba2)' },
  { value: 'cyberpunk', label: '赛博霓虹', preview: 'linear-gradient(45deg, #ff00ff, #00ffff)' },
  { value: 'retro', label: '复古怀旧', preview: 'linear-gradient(45deg, #d4a574, #8b7355)' },
]

const pixelDensityOptions = [
  { value: '8bit', label: '8-bit' },
  { value: '16bit', label: '16-bit' },
  { value: '32bit', label: '32-bit' },
]

const pixelStyleOptions = [
  { value: 'fc', label: 'FC红白机' },
  { value: 'sfc', label: 'SFC' },
  { value: 'gb', label: 'GameBoy' },
  { value: 'arcade', label: '街机' },
  { value: 'modern', label: '现代像素' },
]

const perspectiveOptions = [
  { value: 'side_scroll', label: '横版卷轴' },
  { value: 'top_down', label: '俯视角RPG' },
  { value: 'platformer', label: '平台跳跃' },
  { value: 'fighting', label: '格斗游戏' },
  { value: 'shmup', label: '弹幕射击' },
]

const compositionOptions = [
  { value: 'panorama', label: '全景' },
  { value: 'center', label: '居中' },
  { value: 'symmetric', label: '对称' },
  { value: 'rule3', label: '三分法' },
  { value: 'minimal', label: '极简留白' },
]

// ============ 方法 ============
const applyPreset = (preset: PresetTemplate) => {
  selectedPreset.value = preset.id
  if (preset.config.scene) sceneStyle.value = preset.config.scene
  if (preset.config.pixelConfig) {
    pixelDensity.value = preset.config.pixelConfig.density
    pixelStyle.value = preset.config.pixelConfig.styleRef
    perspective.value = preset.config.pixelConfig.perspective
  }
  if (preset.config.colorMode) {
    colorTone.value = preset.config.colorMode.tone
  }
}

// 构建增强后的提示词
const buildEnhancedPrompt = (): string => {
  const parts: string[] = []
  
  // 基础提示词
  if (prompt.value.trim()) {
    parts.push(prompt.value.trim())
  }
  
  // 场景描述
  const sceneMap: Record<string, string> = {
    fc_retro: 'retro FC NES game scene',
    rpg_map: 'top-down RPG game map',
    shooter: 'space shooter arcade game',
    platformer: 'platformer game level',
    mountain: 'mountain landscape',
    ocean: 'ocean seascape',
    forest: 'forest woodland',
    sky: 'starry night sky',
    flower: 'flower field meadow',
    seasons: 'seasonal landscape',
    skyline: 'city skyline',
    street: 'urban street scene',
    neon: 'neon-lit night city',
    cyberpunk: 'cyberpunk cityscape',
    architecture: 'architectural scene',
    chinese: 'traditional Chinese ink style',
    japanese: 'Japanese ukiyo-e style',
    european: 'European classical architecture',
    steampunk: 'steampunk industrial',
    fantasy: 'fantasy adventure landscape',
    scifi: 'sci-fi space scene',
    underwater: 'underwater ocean scene',
    magic: 'magical enchanted forest',
    animal: 'cute animal portrait',
    food: 'delicious food illustration',
    cartoon: 'cartoon character scene',
    chibi: 'chibi cute character',
    geometric: 'geometric abstract pattern',
    gradient: 'gradient abstract art',
    texture: 'textured surface pattern',
    psychedelic: 'psychedelic trippy art',
  }
  parts.push(sceneMap[sceneStyle.value] || '')
  
  // 像素风核心关键词
  const densityMap: Record<string, string> = {
    '8bit': '8-bit pixel art',
    '16bit': '16-bit pixel art',
    '32bit': '32-bit pixel art'
  }
  const styleMap: Record<string, string> = {
    'fc': 'NES Nintendo style',
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
  
  parts.push(`${densityMap[pixelDensity.value]}, ${styleMap[pixelStyle.value]}, ${perspectiveMap[perspective.value]}`)
  
  // 色彩
  const colorMap: Record<string, string> = {
    'colorful': 'vibrant colorful palette',
    'bw': 'black and white monochrome',
    'warm': 'warm color palette orange yellow',
    'cool': 'cool color palette blue purple',
    'cyberpunk': 'neon cyberpunk colors pink cyan',
    'retro': 'retro sepia vintage tones'
  }
  parts.push(colorMap[colorTone.value])
  
  // 构图
  const compositionMap: Record<string, string> = {
    'panorama': 'wide panoramic view',
    'center': 'centered composition',
    'symmetric': 'symmetrical balanced composition',
    'rule3': 'rule of thirds composition',
    'minimal': 'minimalist clean composition'
  }
  parts.push(compositionMap[composition.value])
  
  // 通用像素风增强
  parts.push('pixelated, retro game aesthetic, crisp pixel edges, limited color palette, dithering, scanlines optional')
  
  return parts.filter(p => p).join(', ')
}

const handleGenerate = async () => {
  isGenerating.value = true
  progress.value = 0
  generatedPrompt.value = ''
  
  // 模拟进度
  const progressInterval = setInterval(() => {
    if (progress.value < 90) {
      progress.value += Math.random() * 8
    }
  }, 800)
  
  try {
    const enhancedPrompt = buildEnhancedPrompt()
    generatedPrompt.value = enhancedPrompt
    
    // 构建请求参数
    const request: GenerateRequest = {
      prompt: prompt.value.trim() || enhancedPrompt,
      resolution: resolution.value,
      scene: sceneStyle.value,
      colorMode: { tone: colorTone.value },
      pixelConfig: {
        density: pixelDensity.value,
        styleRef: pixelStyle.value,
        perspective: perspective.value
      },
      composition: composition.value
    }
    
    // 获取当前 AI 配置
    const providerConfig = configService.getCurrentProviderConfig()
    if (!providerConfig || !providerConfig.apiKey) {
      alert('请先在设置中配置 API Key')
      return
    }
    
    // 调用 AI 服务生成图片
    const result = await tongyiService.generate(request, providerConfig)
    
    if (!result.success || !result.wallpaper) {
      alert(result.error || '生成失败，请重试')
      return
    }
    
    // 下载图片到本地
    const filename = `pixel_${Date.now()}.png`
    const localPath = await tauriService.downloadAndSave(result.wallpaper.imageUrl, filename)
    
    // 更新生成的壁纸数据
    const wallpaper: Wallpaper = {
      ...result.wallpaper,
      prompt: enhancedPrompt,
      localPath,
      thumbnailUrl: result.wallpaper.imageUrl,
    }
    
    // 保存到 store
    store.addWallpaper(wallpaper)
    
    // 显示生成的图片
    generatedImage.value = result.wallpaper.imageUrl
    
    // 更新用量统计
    store.incrementCount()
    
    clearInterval(progressInterval)
    progress.value = 100
  } catch (error) {
    console.error('生成失败:', error)
    alert('生成失败，请检查网络连接和 API 配置')
  } finally {
    isGenerating.value = false
  }
}

const handleRegenerate = () => {
  generatedImage.value = ''
  handleGenerate()
}

const handleSave = async () => {
  try {
    if (!generatedImage.value) {
      alert('没有可保存的壁纸')
      return
    }

    // 检查该图片是否已在画廊中（避免重复保存）
    if (store.isWallpaperInGallery(generatedImage.value)) {
      alert('该壁纸已在画廊中，无需重复保存')
      return
    }
    
    // 如果图片已经在本地，直接添加到 store
    const filename = `pixel_${Date.now()}.png`
    const localPath = await tauriService.downloadAndSave(generatedImage.value, filename)
    
    const wallpaper: Wallpaper = {
      id: `save_${Date.now()}`,
      source: 'ai',
      prompt: generatedPrompt.value,
      imageUrl: generatedImage.value,
      thumbnailUrl: generatedImage.value,
      localPath,
      resolution: resolution.value,
      style: 'pixel',
      scene: sceneStyle.value,
      pixelConfig: {
        density: pixelDensity.value,
        styleRef: pixelStyle.value,
        perspective: perspective.value
      },
      colorMode: { tone: colorTone.value },
      composition: composition.value,
      createdAt: new Date().toISOString(),
      isFavorite: false
    }
    
    store.addWallpaper(wallpaper)
    alert('壁纸已保存到画廊！')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败')
  }
}

const handleSetWallpaper = async () => {
  try {
    // 优先使用本地路径，否则先下载
    let imagePath = generatedImage.value
    
    // 尝试下载到本地再设置
    const filename = `wallpaper_current.png`
    imagePath = await tauriService.downloadAndSave(generatedImage.value, filename)
    
    await tauriService.setDesktopWallpaper(imagePath)
    alert('已设置为桌面壁纸！')
  } catch (error) {
    console.error('设置失败:', error)
    alert('设置壁纸失败')
  }
}

/**
 * 复制提示词到剪贴板
 */
const copyPrompt = async () => {
  try {
    await navigator.clipboard.writeText(generatedPrompt.value)
    alert('提示词已复制到剪贴板！')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// ============ 上传相关状态 ============
const activeMode = ref<'generate' | 'upload'>('generate')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const selectedFilePreview = ref('')
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadDescription = ref('')
const uploadAuthor = ref('')

// ============ 上传相关方法 ============
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    setSelectedFile(input.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false
  if (event.dataTransfer?.files[0]) {
    setSelectedFile(event.dataTransfer.files[0])
  }
}

const setSelectedFile = (file: File) => {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp']
  if (!validTypes.includes(file.type)) {
    alert('不支持的文件格式，请上传 JPG、PNG、WebP 或 BMP 格式的图片')
    return
  }
  
  // 验证文件大小（最大 20MB）
  if (file.size > 20 * 1024 * 1024) {
    alert('文件过大，请上传小于 20MB 的图片')
    return
  }
  
  selectedFile.value = file
  
  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedFilePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  
  try {
    // 读取文件为 base64
    const reader = new FileReader()
    reader.readAsDataURL(selectedFile.value)
    
    reader.onload = async () => {
      const base64Data = reader.result as string
      
      try {
        // 调用 Tauri 后端保存图片
        const localPath = await tauriService.saveUploaded(
          base64Data,
          selectedFile.value!.name,
          uploadDescription.value,
          uploadAuthor.value
        )
        
        // 添加到 store
        const wallpaper: Wallpaper = {
          id: `upload_${Date.now()}`,
          source: 'upload',
          prompt: uploadDescription.value || selectedFile.value!.name,
          imageUrl: localPath,
          thumbnailUrl: localPath,
          localPath,
          resolution: '1920x1080', // 上传图片默认分辨率，后续可读取实际尺寸
          style: 'pixel',
          scene: 'fc_retro',
          colorMode: { tone: 'colorful' },
          composition: 'center',
          createdAt: new Date().toISOString(),
          isFavorite: false,
          originalAuthor: uploadAuthor.value || undefined,
          fileSize: selectedFile.value!.size
        }
        
        store.addWallpaper(wallpaper, false)  // 上传图片允许重复添加
        
        // 重置表单
        selectedFile.value = null
        selectedFilePreview.value = ''
        uploadDescription.value = ''
        uploadAuthor.value = ''
        
        alert('图片上传成功！已添加到画廊。')
      } catch (error) {
        console.error('上传失败:', error)
        alert('上传失败，请重试')
      }
    }
  } catch (error) {
    console.error('读取文件失败:', error)
    alert('读取文件失败')
  } finally {
    isUploading.value = false
  }
}

// 监听场景分类变化，自动选择该分类第一个场景
watch(selectedSceneCategory, (newCat) => {
  const firstScene = sceneOptions.find(s => s.category === newCat)
  if (firstScene) {
    sceneStyle.value = firstScene.value as SceneStyle
  }
})
</script>

<style scoped>
.generator-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.generator-layout {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 1.5rem;
}

/* 控制面板 */
.control-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section:last-of-type {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

.icon {
  font-size: 1.1rem;
}

.badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  margin-left: auto;
}

/* 预设模板 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.4rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.preset-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.preset-icon {
  font-size: 1.4rem;
}

.preset-name {
  font-size: 0.75rem;
}

/* 输入框 */
.prompt-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.9rem;
  resize: vertical;
  transition: border-color 0.3s;
}

.prompt-input:focus {
  outline: none;
  border-color: #667eea;
}

.prompt-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.prompt-hint {
  margin-top: 0.4rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* 选择框 */
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

.select-input:focus {
  outline: none;
  border-color: #667eea;
}

.select-input option {
  background: #1a1a2e;
}

/* 场景分类标签 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.category-tab {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* 场景网格 */
.scene-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.scene-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.3rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.scene-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.scene-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.scene-icon {
  font-size: 1.2rem;
}

.scene-name {
  font-size: 0.7rem;
}

/* 色彩选择 */
.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.color-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.color-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.color-btn.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.color-name {
  font-size: 0.75rem;
}

/* 像素风参数 */
.pixel-section {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.pixel-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.pixel-row:last-child {
  margin-bottom: 0;
}

.pixel-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  min-width: 60px;
}

.pixel-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex: 1;
}

.pixel-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.pixel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.pixel-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* 构图 */
.composition-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.composition-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.composition-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.composition-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  padding: 0.9rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
  margin-top: 0.5rem;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.1rem;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 预览面板 */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-container {
  flex: 1;
  min-height: 450px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-container.has-image {
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.1);
}

.empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
  opacity: 0.7;
}

/* 像素动画 */
.generating-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.pixel-animation {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
}

.pixel-block {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  animation: pixelPulse 1.2s ease-in-out infinite;
}

.pixel-block:nth-child(2) { animation-delay: 0.1s; }
.pixel-block:nth-child(3) { animation-delay: 0.2s; }
.pixel-block:nth-child(4) { animation-delay: 0.3s; }
.pixel-block:nth-child(5) { animation-delay: 0.4s; }
.pixel-block:nth-child(6) { animation-delay: 0.5s; }
.pixel-block:nth-child(7) { animation-delay: 0.6s; }
.pixel-block:nth-child(8) { animation-delay: 0.7s; }
.pixel-block:nth-child(9) { animation-delay: 0.8s; }

@keyframes pixelPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.progress-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-top: 0.5rem;
}

.generated-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 提示词展示 */
.prompt-display {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prompt-display label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  display: block;
  margin-bottom: 0.5rem;
}

.copy-btn {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.copy-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.prompt-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  font-style: italic;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.action-btn {
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.primary:hover {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ============================================
   中等屏幕适配（笔记本 125% 缩放 / 窗口较窄）
   Windows 125% 缩放下 1200px 窗口实际可视约 960px
   ============================================ */
@media (max-width: 1100px) {
  .generator-layout {
    grid-template-columns: 360px 1fr;
    gap: 1rem;
  }

  .control-panel {
    max-height: calc(100vh - 180px);
    padding: 1rem;
  }

  .section {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }

  .section-title {
    font-size: 0.9rem;
    margin-bottom: 0.6rem;
  }

  .preset-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .scene-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }

  .color-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .pixel-row {
    flex-direction: column;
    gap: 0.3rem;
  }

  .pixel-label {
    font-size: 0.8rem;
  }

  .pixel-options {
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .pixel-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }

  .composition-grid {
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .composition-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .preview-container {
    min-height: 350px;
  }

  .generated-image {
    max-height: 350px;
  }

  .action-buttons {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1;
    min-width: 100px;
    padding: 0.6rem;
    font-size: 0.85rem;
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .generator-layout {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    max-height: none;
  }
  
  .preview-container {
    min-height: 300px;
  }
}

/* 滚动条美化 */
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.8);
}

/* 模式切换 */
.mode-switch {
  padding-bottom: 0.5rem;
}

.mode-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.3rem;
}

.mode-tab {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s;
}

.mode-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.mode-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 上传区域 */
.upload-dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(0, 0, 0, 0.2);
}

.upload-dropzone:hover {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(102, 126, 234, 0.05);
}

.upload-dropzone.drag-over {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.upload-dropzone.has-file {
  border-style: solid;
  border-color: rgba(102, 126, 234, 0.5);
}

.upload-placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.upload-hint {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.6;
}

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
}

.file-name {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* 上传表单 */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.text-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

.text-input:focus {
  outline: none;
  border-color: #667eea;
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.upload-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
}

.upload-btn:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4) !important;
}
</style>
