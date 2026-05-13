<template>
  <div class="usage-stats">
    <div class="stats-grid">
      <!-- 本月生成 -->
      <div class="stat-item">
        <span class="stat-icon">📊</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.monthlyCount }}</span>
          <span class="stat-label">本月生成</span>
        </div>
      </div>
      
      <!-- 今日生成 -->
      <div class="stat-item">
        <span class="stat-icon">📅</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayCount }}</span>
          <span class="stat-label">今日生成</span>
        </div>
      </div>
      
      <!-- 累计消耗 -->
      <div class="stat-item">
        <span class="stat-icon">💰</span>
        <div class="stat-info">
          <span class="stat-value">¥{{ stats.totalCost.toFixed(2) }}</span>
          <span class="stat-label">累计消耗</span>
        </div>
      </div>
      
      <!-- 已保存 -->
      <div class="stat-item">
        <span class="stat-icon">🖼️</span>
        <div class="stat-info">
          <span class="stat-value">{{ stats.savedCount }}</span>
          <span class="stat-label">已保存</span>
        </div>
      </div>
    </div>
    
    <!-- 查看额度按钮 -->
    <button class="quota-btn" @click="openQuotaPage">
      <span>🔗</span>
      查看阿里云额度
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * UsageStats.vue - 用量统计组件
 * 显示生成次数、消耗估算，提供阿里云额度查询入口
 */
import { computed } from 'vue'
import { useGeneratorStore } from '../stores/generator'

const store = useGeneratorStore()

// 用量统计
const stats = computed(() => store.usageStats)

// 打开阿里云百炼控制台
const openQuotaPage = () => {
  window.open('https://bailian.console.aliyun.com/?tab=model#/model-usage/free-quota', '_blank')
}
</script>

<style scoped>
.usage-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.stats-grid {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.quota-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
}

.quota-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.8);
}

@media (max-width: 768px) {
  .usage-stats {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .stats-grid {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
}
</style>
