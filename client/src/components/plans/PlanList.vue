<template>
  <div class="plan-list">
    <div v-if="plans.length === 0" class="empty">
      <p>📭 暂无保存的学习路线</p>
      <p class="hint">在对话中保存的学习路线会出现在这里</p>
    </div>
    <div v-else class="cards">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        @click="$emit('select', plan.id)"
      >
        <div class="card-header">
          <span class="topic">📚 {{ plan.topic }}</span>
          <button class="delete-btn" @click.stop="$emit('delete', plan.id)">🗑</button>
        </div>
        <div class="card-time">{{ formatTime(plan.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LearningPlan } from '../../stores/plans'

defineProps<{
  plans: LearningPlan[]
}>()

defineEmits<{
  select: [id: string]
  delete: [id: string]
}>()

function formatTime(time: string) {
  if (!time) return ''
  const d = new Date(time + 'Z')
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.plan-list {
  padding: 24px;
  max-width: 860px;
  margin: 0 auto;
}

.empty {
  text-align: center;
  padding: 80px 0;
  color: #999;
}

.empty p {
  margin: 8px 0;
}

.hint {
  font-size: 13px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.plan-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-card:hover {
  border-color: #18a058;
  box-shadow: 0 2px 12px rgba(24, 160, 88, 0.12);
}

.dark .plan-card {
  background: #1a1a1a;
  border-color: #333;
}

.dark .plan-card:hover {
  border-color: #18a058;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.topic {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 14px;
  padding: 2px;
}

.plan-card:hover .delete-btn {
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1 !important;
}

.card-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
