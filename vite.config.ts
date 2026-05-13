import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Vite 配置选项
  clearScreen: false,
  // Tauri 开发服务器配置
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 监听所有文件变更
      ignored: ['**/src-tauri/**']
    }
  },
  // 构建配置
  build: {
    // Tauri 使用 ES2021 特性
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // 不压缩以加快构建速度（仅在调试时使用）
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // 生成 sourcemap
    sourcemap: !!process.env.TAURI_DEBUG
  }
}))
