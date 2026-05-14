<template>
  <div class="gallery-container">
    <h1 class="page-title">🖼️ 我的画廊</h1>
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- 第一行：筛选按钮 -->
      <div class="toolbar-row">
        <div class="filter-section">
          <button
            v-for="filter in sourceFilters"
            :key="filter.value"
            class="filter-btn source-filter"
            :class="{ active: currentSourceFilter === filter.value }"
            @click="currentSourceFilter = filter.value"
          >
            <span class="filter-icon">{{ filter.icon }}</span>
            {{ filter.label }}
            <span class="filter-count">{{ getSourceCount(filter.value) }}</span>
          </button>
        </div>
        
        <div class="filter-section">
          <button
            v-for="filter in timeFilters"
            :key="filter.value"
            class="filter-btn"
            :class="{ active: currentTimeFilter === filter.value }"
            @click="currentTimeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- 第二行：搜索 + 视图切换 -->
      <div class="toolbar-row toolbar-bottom">
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索壁纸..."
          />
          <span class="search-icon">🔍</span>
        </div>

        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            ⊞ 网格
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
          >
            ☰ 列表
          </button>
        </div>
      </div>
    </div>

    <!-- 壁纸列表 -->
    <div v-if="filteredWallpapers.length > 0" :class="['wallpapers-container', viewMode]">
      <div
        v-for="wallpaper in filteredWallpapers"
        :key="wallpaper.id"
        class="wallpaper-item"
        :class="{ 'is-upload': wallpaper.source === 'upload' }"
        @click="openPreview(wallpaper)"
      >
        <div class="wallpaper-image-wrapper">
          <img
            :src="wallpaper.thumbnailUrl"
            :alt="wallpaper.prompt"
            class="wallpaper-image"
            loading="lazy"
          />
          <!-- 来源标签 -->
          <div class="source-badge" :class="wallpaper.source">
            <span v-if="wallpaper.source === 'ai'">✨ AI</span>
            <span v-else>📤 上传</span>
          </div>
          <div class="wallpaper-overlay">
            <button
              class="overlay-btn"
              @click.stop="handleSetWallpaper(wallpaper)"
              title="设为桌面壁纸"
            >
              🖥️
            </button>
            <button
              class="overlay-btn"
              @click.stop="handleDownload(wallpaper)"
              title="下载"
            >
              💾
            </button>
            <button
              class="overlay-btn delete"
              @click.stop="handleDelete(wallpaper)"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div class="wallpaper-info">
          <p class="wallpaper-prompt" :title="wallpaper.prompt">
            {{ truncatePrompt(wallpaper.prompt) }}
          </p>
          <div class="wallpaper-meta">
            <span class="meta-item">
              <span class="meta-icon">📐</span>
              {{ wallpaper.resolution }}
            </span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              {{ formatDate(wallpaper.createdAt) }}
            </span>
            <span v-if="wallpaper.originalAuthor" class="meta-item author">
              <span class="meta-icon">👤</span>
              {{ wallpaper.originalAuthor }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon">🎨</span>
      <h3>还没有壁纸</h3>
      <p v-if="currentSourceFilter === 'upload'">
        还没有上传任何图片，去上传一些喜欢的壁纸吧！
      </p>
      <p v-else-if="currentSourceFilter === 'ai'">
        还没有生成任何 AI 壁纸，去创作你的第一张吧！
      </p>
      <p v-else>
        画廊是空的，去生成 AI 壁纸或上传喜欢的图片吧！
      </p>
      <router-link to="/" class="create-btn">
        {{ currentSourceFilter === 'upload' ? '去上传' : '开始创作' }}
      </router-link>
    </div>

    <!-- 预览模态框 -->
    <div v-if="previewWallpaper" class="preview-modal" @click.self="closePreview">
      <div class="preview-content">
        <button class="close-btn" @click="closePreview">✕</button>
        <img
          :src="previewWallpaper.imageUrl"
          :alt="previewWallpaper.prompt"
          class="preview-image"
        />
        <div class="preview-info">
          <!-- 来源标签 -->
          <div class="preview-source-badge" :class="previewWallpaper.source">
            <span v-if="previewWallpaper.source === 'ai'">✨ AI 生成</span>
            <span v-else>📤 手动上传</span>
          </div>
          <p class="preview-prompt">{{ previewWallpaper.prompt }}</p>
          <div class="preview-meta">
            <span>📐 {{ previewWallpaper.resolution }}</span>
            <span>📅 {{ formatFullDate(previewWallpaper.createdAt) }}</span>
            <span v-if="previewWallpaper.originalAuthor">
              👤 原作者: {{ previewWallpaper.originalAuthor }}
            </span>
          </div>
          <div class="preview-actions">
            <button class="action-btn primary" @click="handleSetWallpaper(previewWallpaper)">
              🖥️ 设为桌面壁纸
            </button>
            <button class="action-btn secondary" @click="handleDownload(previewWallpaper)">
              💾 下载
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Gallery.vue - 壁纸画廊组件
 * 展示用户生成的所有壁纸，支持按来源、时间筛选，搜索、预览和管理功能
 */
import { ref, computed } from 'vue'
import { useGeneratorStore } from '../stores/generator'
import { tauriService } from '../services/tauri-service'
import type { Wallpaper, WallpaperSource } from '../types/wallpaper'

const store = useGeneratorStore()

// 视图模式
const viewMode = ref<'grid' | 'list'>('grid')

// 来源筛选
const currentSourceFilter = ref<WallpaperSource | 'all'>('all')
const sourceFilters = [
  { value: 'all', label: '全部', icon: '🖼️' },
  { value: 'ai', label: 'AI生成', icon: '✨' },
  { value: 'upload', label: '手动上传', icon: '📤' },
]

// 时间筛选
const currentTimeFilter = ref('all')
const timeFilters = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
]

// 搜索关键词
const searchQuery = ref('')

// 预览状态
const previewWallpaper = ref<Wallpaper | null>(null)

// 从 store 获取壁纸列表
const wallpapers = computed(() => store.wallpapers)

// 获取各来源的壁纸数量
const getSourceCount = (source: WallpaperSource | 'all'): number => {
  if (source === 'all') return wallpapers.value.length
  return wallpapers.value.filter(w => w.source === source).length
}

// 筛选后的壁纸列表
const filteredWallpapers = computed(() => {
  let result = wallpapers.value

  // 按来源筛选
  if (currentSourceFilter.value !== 'all') {
    result = result.filter(w => w.source === currentSourceFilter.value)
  }

  // 按时间筛选
  const now = new Date()
  if (currentTimeFilter.value === 'today') {
    result = result.filter(w => {
      const date = new Date(w.createdAt)
      return date.toDateString() === now.toDateString()
    })
  } else if (currentTimeFilter.value === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 86400000)
    result = result.filter(w => new Date(w.createdAt) >= weekAgo)
  } else if (currentTimeFilter.value === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 86400000)
    result = result.filter(w => new Date(w.createdAt) >= monthAgo)
  }

  // 按关键词搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(w =>
      w.prompt.toLowerCase().includes(query) ||
      (w.originalAuthor?.toLowerCase().includes(query))
    )
  }

  // 按时间倒序排列
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// 截断提示词显示
const truncatePrompt = (prompt: string, maxLength: number = 50) => {
  if (!prompt || prompt.length <= maxLength) return prompt || '无描述'
  return prompt.slice(0, maxLength) + '...'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 格式化完整日期
const formatFullDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 打开预览
const openPreview = (wallpaper: Wallpaper) => {
  previewWallpaper.value = wallpaper
}

// 关闭预览
const closePreview = () => {
  previewWallpaper.value = null
}

// 设为桌面壁纸
const handleSetWallpaper = async (wallpaper: Wallpaper) => {
  try {
    let imagePath = wallpaper.localPath || wallpaper.imageUrl
    
    // 如果图片是远程 URL，先下载到本地
    if (imagePath.startsWith('http')) {
      const filename = `wallpaper_current.png`
      imagePath = await tauriService.downloadAndSave(imagePath, filename)
    }
    
    await tauriService.setDesktopWallpaper(imagePath)
    alert('已设置为桌面壁纸！')
  } catch (error) {
    console.error('设置壁纸失败:', error)
    alert('设置壁纸失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

// 下载壁纸（保存到用户选择的位置）
const handleDownload = async (wallpaper: Wallpaper) => {
  try {
    const imagePath = wallpaper.localPath || wallpaper.imageUrl
    
    // 如果是远程 URL，先下载到本地
    let localPath = imagePath
    if (imagePath.startsWith('http')) {
      const filename = `wallpaper_${wallpaper.id}.png`
      localPath = await tauriService.downloadAndSave(imagePath, filename)
    }
    
    // 提示已保存
    alert('壁纸已保存到本地：' + localPath)
  } catch (error) {
    console.error('下载失败:', error)
    alert('下载失败: ' + (error instanceof Error ? error.message : String(error)))
  }
}

// 删除壁纸
const handleDelete = async (wallpaper: Wallpaper) => {
  const sourceText = wallpaper.source === 'ai' ? 'AI 生成的' : '上传的'
  if (confirm(`确定要删除这张${sourceText}壁纸吗？`)) {
    try {
      // 如果有本地文件，同时删除文件
      if (wallpaper.localPath) {
        await tauriService.deleteWallpaper(wallpaper.localPath)
      }
      store.removeWallpaper(wallpaper.id)
    } catch (error) {
      console.error('删除失败:', error)
      // 即使文件删除失败，也从列表中移除
      store.removeWallpaper(wallpaper.id)
    }
  }
}
</script>

<style scoped>
.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  text-align: center;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.toolbar-bottom {
  justify-content: space-between;
}

.filter-section {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.source-filter {
  padding: 0.5rem 0.75rem;
}

.filter-icon {
  font-size: 1rem;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.75rem;
  min-width: 20px;
  text-align: center;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

.search-section {
  position: relative;
  flex: 1;
  min-width: 120px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.view-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn.active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 壁纸容器样式 */
.wallpapers-container {
  display: grid;
  gap: 1rem;
  flex: 1;
  overflow-y: auto;
  align-content: start;
  min-height: 0;
}

.wallpapers-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.wallpapers-container.list {
  grid-template-columns: 1fr;
}

.wallpapers-container.list .wallpaper-item {
  display: flex;
  gap: 1rem;
}

.wallpapers-container.list .wallpaper-image-wrapper {
  width: 200px;
  height: 120px;
  flex-shrink: 0;
}

/* 壁纸项样式 */
.wallpaper-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.wallpaper-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.wallpaper-item.is-upload {
  border-left: 3px solid #10b981;
}

.wallpaper-image-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.wallpaper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.wallpaper-item:hover .wallpaper-image {
  transform: scale(1.05);
}

/* 来源标签 */
.source-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 2;
}

.source-badge.ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.source-badge.upload {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.wallpaper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
  pointer-events: none;
}

.wallpaper-item:hover .wallpaper-overlay {
  pointer-events: auto;
}

.wallpaper-item:hover .wallpaper-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  pointer-events: auto;
  z-index: 11;
  align-items: center;
  justify-content: center;
}

.overlay-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.overlay-btn.delete:hover {
  background: rgba(239, 68, 68, 0.8);
}

.wallpaper-info {
  padding: 1rem;
}

.wallpaper-prompt {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wallpaper-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-item.author {
  color: #10b981;
}

.meta-icon {
  font-size: 0.9rem;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.create-btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.3s, box-shadow 0.3s;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 预览模态框样式 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  object-fit: contain;
}

.preview-info {
  text-align: center;
}

.preview-source-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.preview-source-badge.ai {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.preview-source-badge.upload {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
}

.preview-prompt {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
}

.preview-meta {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  flex-wrap: wrap;
}

.preview-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* 响应式布局 */
/* ============================================
   中等屏幕适配（笔记本 125% 缩放）
   ============================================ */
@media (max-width: 1100px) {
  .toolbar {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .filter-section {
    gap: 0.3rem;
  }

  .filter-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.85rem;
  }

  .search-section {
    width: 150px;
  }

  .search-input {
    padding: 0.4rem 2rem 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .view-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.85rem;
  }

  .wallpapers-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .wallpapers-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .preview-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
