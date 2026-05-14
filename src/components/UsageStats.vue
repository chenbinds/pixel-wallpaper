<template>
  <div class="usage-stats">
    <div class="stats-row">
      <span class="stat-compact">📊 {{ stats.monthlyCount }}</span>
      <span class="stat-compact">📅 {{ stats.todayCount }}</span>
      <span class="stat-compact">💰 ¥{{ stats.totalCost.toFixed(2) }}</span>
      <span class="stat-compact">🖼️ {{ stats.savedCount }}</span>
    </div>
    
    <!-- 查看额度按钮 -->
    <button class="quota-btn" @click="openQuotaPage">
      <span>🔗</span>
      查看额度
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
  gap: 1rem;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-compact {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.quota-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.quota-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.8);
}

@media (max-width: 768px) {
  .usage-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stats-row {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }
}
</style>
