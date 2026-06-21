<template>
  <div class="plans-view">
    <!-- 详情页 -->
    <div v-if="currentPlan" class="plan-detail">
      <div class="detail-header">
        <n-button quaternary size="small" @click="clearCurrentPlan">← 返回列表</n-button>
        <n-button quaternary size="small" type="error" @click="handleDelete(currentPlan.id)">
          🗑️ 删除
        </n-button>
      </div>
      <div class="detail-content markdown-body" v-html="renderedContent" />
    </div>

    <!-- 列表页 -->
    <div v-else class="plan-list">
      <div v-if="plans.length === 0" class="empty">
        <div class="empty-icon">📋</div>
        <p>暂无保存的学习路线</p>
        <p class="sub">在对话中生成路线后点击「💾 保存路线」</p>
      </div>

      <div
        v-for="plan in plans"
        :key="plan.id"
        class="plan-card"
        @click="loadPlan(plan.id)"
      >
        <div class="plan-topic">{{ plan.topic }}</div>
        <div class="plan-time">{{ formatTime(plan.created_at) }}</div>
        <n-button
          size="tiny"
          quaternary
          class="delete-btn"
          @click.stop="handleDelete(plan.id)"
        >
          🗑️
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import { usePlans } from '../composables/usePlans'

const {
  plans,
  currentPlan,
  loadPlans,
  loadPlan,
  deletePlan,
  clearCurrentPlan,
} = usePlans()

const message = useMessage()

const md = new MarkdownIt({ linkify: true, breaks: true })

const renderedContent = computed(() => {
  return md.render(currentPlan.value?.content || '')
})

onMounted(() => {
  loadPlans()
})

function formatTime(dateStr: string): string {
  const date = new Date(dateStr + 'Z')
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleDelete(id: string) {
  try {
    await deletePlan(id)
    message.success('已删除')
  } catch {
    message.error('删除失败')
  }
}
</script>

<style scoped>
.plans-view {
  height: 100%;
  max-width: 860px;
  margin: 0 auto;
  overflow-y: auto;
  padding: 24px 16px;
}

/* 列表页 */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.plan-card:hover {
  border-color: #18a058;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.1);
}

.dark .plan-card {
  background: #2a2a2a;
  border-color: #444;
}

.dark .plan-card:hover {
  border-color: #18a058;
}

.plan-topic {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.plan-time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.plan-card:hover .delete-btn {
  opacity: 1;
}

/* 空状态 */
.empty {
  text-align: center;
  color: #999;
  margin-top: 20vh;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty p {
  margin: 4px 0;
  font-size: 14px;
}

.empty .sub {
  font-size: 12px;
  color: #bbb;
}

/* 详情页 */
.plan-detail {
  animation: fadeIn 0.2s;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.dark .detail-header {
  border-bottom-color: #444;
}

.detail-content {
  line-height: 1.8;
}

/* Markdown 样式 */
.detail-content :deep(h2) {
  font-size: 18px;
  margin: 20px 0 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #18a058;
}

.detail-content :deep(h3) {
  font-size: 16px;
  margin: 16px 0 8px;
  color: #18a058;
}

.detail-content :deep(ul),
.detail-content :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.detail-content :deep(li) {
  margin: 6px 0;
}

.detail-content :deep(a) {
  color: #18a058;
}

.detail-content :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
}

.detail-content :deep(strong) {
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
