<template>
  <div class="app-container">
    <!-- 像素风装饰边框 -->
    <div class="pixel-border">
      <!-- 四角像素装饰 -->
      <span class="pixel-corner pixel-corner-tl"></span>
      <span class="pixel-corner pixel-corner-tr"></span>
      <span class="pixel-corner pixel-corner-bl"></span>
      <span class="pixel-corner pixel-corner-br"></span>
    </div>

    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="logo">
        <!-- 像素风动画 Logo -->
        <div class="pixel-logo" aria-label="PixelWallpaper AI Logo">
          <div class="pixel-logo-grid">
            <span v-for="(pixel, index) in logoPixels" :key="index"
                  class="pixel-block"
                  :class="{ active: pixel.active }"
                  :style="{ animationDelay: pixel.delay + 'ms' }">
            </span>
          </div>
        </div>
        <span class="logo-text">PixelWallpaper AI</span>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link" active-class="active">
          <span class="icon">✨</span>
          <span>生成壁纸</span>
        </router-link>
        <router-link to="/gallery" class="nav-link" active-class="active">
          <span class="icon">🖼️</span>
          <span>我的画廊</span>
        </router-link>
        <router-link to="/settings" class="nav-link" active-class="active">
          <span class="icon">⚙️</span>
          <span>设置</span>
        </router-link>
      </div>
      <!-- 快捷操作按钮区域 -->
      <div class="quick-actions">
        <button class="quick-btn" @click="handleRandomWallpaper" title="随机切换壁纸">
          🎲
        </button>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部区域 -->
    <footer class="footer">
      <UsageStats />
      <div class="footer-right">
        <span class="footer-text">PixelWallpaper AI v1.0 | 致敬 FC 时代</span>
        <span class="footer-text">&copy; {{ currentYear }} PixelWallpaper AI</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * PixelWallpaper AI - 主应用组件
 * 包含导航栏、路由视图、底部统计信息和像素风装饰
 */
import { ref, computed, onMounted } from 'vue'
import UsageStats from './components/UsageStats.vue'

/** 当前年份（用于版权信息） */
const currentYear = computed(() => new Date().getFullYear())

/**
 * 处理随机切换壁纸
 */
const handleRandomWallpaper = async () => {
  try {
    // 动态导入 tauri-service
    const { randomWallpaper } = await import('./services/tauri-service')
    const path = await randomWallpaper()
    console.log('已切换壁纸:', path)
  } catch (error) {
    console.error('随机切换失败:', error)
    // 如果没有壁纸，给出提示
    if (String(error).includes('没有可用的壁纸')) {
      alert('请先生成或上传一些壁纸！')
    }
  }
}

// 监听托盘发来的壁纸变化事件
onMounted(async () => {
  try {
    const { onWallpaperChanged } = await import('./services/tauri-service')
    onWallpaperChanged((path) => {
      console.log('壁纸已被托盘切换:', path)
      // 可以在这里刷新画廊或其他UI
    })
  } catch (error) {
    console.warn('无法监听壁纸变化事件:', error)
  }
})

/**
 * 像素风 Logo 的网格数据
 * 8x8 网格，每个像素块有 active 状态和动画延迟
 * 模拟一个简单的像素画图标
 */
const logoPixels = ref(
  (() => {
    // 定义一个 8x8 的像素画图案（1 = 激活, 0 = 未激活）
    const pattern = [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 0, 1],
    ]

    const pixels: Array<{ active: boolean; delay: number }> = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        pixels.push({
          active: pattern[row][col] === 1,
          delay: (row * 8 + col) * 50, // 每个像素块延迟 50ms 出现
        })
      }
    }
    return pixels
  })()
)
</script>

<style scoped>
/* ============================================
   应用容器
   ============================================ */
.app-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

/* ============================================
   像素风装饰边框
   ============================================ */
.pixel-border {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
  border: 3px solid rgba(102, 126, 234, 0.15);
  box-shadow:
    inset 0 0 0 1px rgba(102, 126, 234, 0.08),
    inset 0 0 0 3px rgba(102, 126, 234, 0.04);
}

/* 像素风四角装饰 */
.pixel-corner {
  position: fixed;
  width: 12px;
  height: 12px;
  z-index: 1001;
  pointer-events: none;
}

/* 四角使用像素化的 L 形装饰 */
.pixel-corner::before,
.pixel-corner::after {
  content: '';
  position: absolute;
  background: #667eea;
  image-rendering: pixelated;
}

.pixel-corner-tl {
  top: 0;
  left: 0;
}
.pixel-corner-tl::before {
  top: 0;
  left: 0;
  width: 12px;
  height: 3px;
}
.pixel-corner-tl::after {
  top: 0;
  left: 0;
  width: 3px;
  height: 12px;
}

.pixel-corner-tr {
  top: 0;
  right: 0;
}
.pixel-corner-tr::before {
  top: 0;
  right: 0;
  width: 12px;
  height: 3px;
}
.pixel-corner-tr::after {
  top: 0;
  right: 0;
  width: 3px;
  height: 12px;
}

.pixel-corner-bl {
  bottom: 0;
  left: 0;
}
.pixel-corner-bl::before {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 3px;
}
.pixel-corner-bl::after {
  bottom: 0;
  left: 0;
  width: 3px;
  height: 12px;
}

.pixel-corner-br {
  bottom: 0;
  right: 0;
}
.pixel-corner-br::before {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 3px;
}
.pixel-corner-br::after {
  bottom: 0;
  right: 0;
  width: 3px;
  height: 12px;
}

/* ============================================
   导航栏样式
   ============================================ */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: bold;
}

/* ============================================
   像素风动画 Logo
   ============================================ */
.pixel-logo {
  flex-shrink: 0;
}

.pixel-logo-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 1px;
  width: 32px;
  height: 32px;
}

.pixel-block {
  width: 3px;
  height: 3px;
  background: transparent;
  transition: background 0.1s ease;
}

.pixel-block.active {
  background: #667eea;
  animation: pixelPulse 2s ease-in-out infinite;
}

/* 像素块呼吸动画 */
@keyframes pixelPulse {
  0%, 100% {
    background: #667eea;
    opacity: 1;
  }
  50% {
    background: #764ba2;
    opacity: 0.8;
  }
}

.logo-text {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ============================================
   导航链接
   ============================================ */
.nav-links {
  display: flex;
  gap: 1rem;
}

/* 快捷操作按钮 */
.quick-actions {
  display: flex;
  gap: 0.5rem;
}

.quick-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  transform: rotate(180deg);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-link.active {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 导航链接激活时的像素风下划线 */
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  background: #fff;
  image-rendering: pixelated;
}

.icon {
  font-size: 1.2rem;
}

/* ============================================
   主内容区域
   ============================================ */
.main-content {
  flex: 1;
  padding: 1rem 2rem;
  overflow-y: auto;
  min-height: 0;
}

/* ============================================
   底部区域 - 单行水平布局
   ============================================ */
.footer {
  padding: 0.5rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ============================================
   像素风动画增强
   ============================================ */
.pixel-logo-grid {
  animation: pixelBounce 2s ease-in-out infinite;
}

@keyframes pixelBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* ============================================
   页面过渡动画
   ============================================ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
