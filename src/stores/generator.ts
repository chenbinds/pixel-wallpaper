/**
 * generator.ts - 生成器状态管理
 * 管理壁纸生成状态和用量统计
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UsageStats, Wallpaper, GenerateRequest } from '../types/wallpaper'

export const useGeneratorStore = defineStore('generator', () => {
  // ============ State ============
  
  // 生成状态
  const isGenerating = ref(false)
  const generationProgress = ref(0)
  const currentWallpaper = ref<Wallpaper | null>(null)
  
  // 用量统计
  const usageStats = ref<UsageStats>({
    monthlyCount: 0,
    todayCount: 0,
    totalCount: 0,
    totalCost: 0,
    savedCount: 0,
    lastUpdated: new Date().toISOString()
  })
  
  // 生成的壁纸列表
  const wallpapers = ref<Wallpaper[]>([])
  
  // 当前请求配置
  const currentRequest = ref<GenerateRequest | null>(null)

  // ============ Getters ============
  
  const hasWallpapers = computed(() => wallpapers.value.length > 0)
  const favoriteWallpapers = computed(() => 
    wallpapers.value.filter(w => w.isFavorite)
  )
  
  // 按日期分组的壁纸
  const wallpapersByDate = computed(() => {
    const groups: Record<string, Wallpaper[]> = {}
    wallpapers.value.forEach(w => {
      const date = new Date(w.createdAt).toLocaleDateString('zh-CN')
      if (!groups[date]) groups[date] = []
      groups[date].push(w)
    })
    return groups
  })

  // ============ Actions ============
  
  /**
   * 增加生成计数
   * 每次成功生成后调用，更新用量统计
   */
  const incrementCount = () => {
    const now = new Date()
    const lastUpdated = new Date(usageStats.value.lastUpdated)
    
    // 检查是否需要重置今日计数（跨天了）
    if (now.getDate() !== lastUpdated.getDate() || 
        now.getMonth() !== lastUpdated.getMonth()) {
      usageStats.value.todayCount = 0
    }
    
    // 检查是否需要重置本月计数（跨月了）
    if (now.getMonth() !== lastUpdated.getMonth()) {
      usageStats.value.monthlyCount = 0
    }
    
    usageStats.value.monthlyCount++
    usageStats.value.todayCount++
    usageStats.value.totalCount++
    
    // 估算成本（通义万相约 0.1-0.2 元/张）
    usageStats.value.totalCost += 0.15
    
    usageStats.value.lastUpdated = now.toISOString()
    
    // 持久化到本地存储
    saveStatsToStorage()
  }
  
  /**
   * 添加壁纸到列表
   * @param wallpaper 壁纸对象
   * @param checkDuplicate 是否检查重复（默认 true），上传图片可传 false 允许重复
   * @returns true 添加成功，false 因重复跳过
   */
  const addWallpaper = (wallpaper: Wallpaper, checkDuplicate: boolean = true): boolean => {
    // 去重检查：根据 imageUrl 判断是否已存在
    if (checkDuplicate) {
      const exists = wallpapers.value.some(w => w.imageUrl === wallpaper.imageUrl)
      if (exists) {
        console.log('壁纸已存在于画廊中，跳过重复添加')
        return false
      }
    }
    wallpapers.value.unshift(wallpaper)
    usageStats.value.savedCount = wallpapers.value.length
    saveWallpapersToStorage()
    return true
  }

  /**
   * 检查指定 imageUrl 是否已存在于画廊中
   */
  const isWallpaperInGallery = (imageUrl: string): boolean => {
    return wallpapers.value.some(w => w.imageUrl === imageUrl)
  }
  
  /**
   * 删除壁纸
   */
  const removeWallpaper = (id: string) => {
    const index = wallpapers.value.findIndex(w => w.id === id)
    if (index > -1) {
      wallpapers.value.splice(index, 1)
      usageStats.value.savedCount = wallpapers.value.length
      saveWallpapersToStorage()
    }
  }
  
  /**
   * 切换收藏状态
   */
  const toggleFavorite = (id: string) => {
    const wallpaper = wallpapers.value.find(w => w.id === id)
    if (wallpaper) {
      wallpaper.isFavorite = !wallpaper.isFavorite
      saveWallpapersToStorage()
    }
  }
  
  /**
   * 设置当前壁纸
   */
  const setCurrentWallpaper = (wallpaper: Wallpaper | null) => {
    currentWallpaper.value = wallpaper
  }
  
  /**
   * 从本地存储加载数据
   */
  const loadFromStorage = () => {
    try {
      // 加载用量统计
      const statsJson = localStorage.getItem('pixelwallpaper_stats')
      if (statsJson) {
        const savedStats = JSON.parse(statsJson)
        // 检查是否需要重置今日计数
        const now = new Date()
        const lastUpdated = new Date(savedStats.lastUpdated)
        if (now.getDate() !== lastUpdated.getDate() || 
            now.getMonth() !== lastUpdated.getMonth()) {
          savedStats.todayCount = 0
        }
        // 检查是否需要重置本月计数
        if (now.getMonth() !== lastUpdated.getMonth()) {
          savedStats.monthlyCount = 0
        }
        usageStats.value = savedStats
      }
      
      // 加载壁纸列表
      const wallpapersJson = localStorage.getItem('pixelwallpaper_wallpapers')
      if (wallpapersJson) {
        wallpapers.value = JSON.parse(wallpapersJson)
        usageStats.value.savedCount = wallpapers.value.length
      }
    } catch (error) {
      console.error('加载本地数据失败:', error)
    }
  }
  
  /**
   * 保存用量统计到本地存储
   */
  const saveStatsToStorage = () => {
    try {
      localStorage.setItem('pixelwallpaper_stats', JSON.stringify(usageStats.value))
    } catch (error) {
      console.error('保存用量统计失败:', error)
    }
  }
  
  /**
   * 保存壁纸列表到本地存储
   */
  const saveWallpapersToStorage = () => {
    try {
      localStorage.setItem('pixelwallpaper_wallpapers', JSON.stringify(wallpapers.value))
    } catch (error) {
      console.error('保存壁纸列表失败:', error)
    }
  }
  
  /**
   * 重置用量统计
   */
  const resetStats = () => {
    usageStats.value = {
      monthlyCount: 0,
      todayCount: 0,
      totalCount: 0,
      totalCost: 0,
      savedCount: wallpapers.value.length,
      lastUpdated: new Date().toISOString()
    }
    saveStatsToStorage()
  }

  // 初始化时加载数据
  loadFromStorage()

  return {
    // State
    isGenerating,
    generationProgress,
    currentWallpaper,
    usageStats,
    wallpapers,
    currentRequest,
    
    // Getters
    hasWallpapers,
    favoriteWallpapers,
    wallpapersByDate,
    
    // Actions
    incrementCount,
    addWallpaper,
    isWallpaperInGallery,
    removeWallpaper,
    toggleFavorite,
    setCurrentWallpaper,
    loadFromStorage,
    resetStats
  }
})
