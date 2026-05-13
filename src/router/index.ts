import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Generator',
    component: () => import('../components/Generator.vue'),
    meta: {
      title: '生成壁纸'
    }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: () => import('../components/Gallery.vue'),
    meta: {
      title: '我的画廊'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../components/Settings.vue'),
    meta: {
      title: '设置'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - PixelWallpaper AI`
  }
  next()
})

export default router
