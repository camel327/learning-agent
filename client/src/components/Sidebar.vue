<template>
  <div class="sidebar" :class="{ open: show }">
    <div class="sidebar-header">
      <h3>💬 对话历史</h3>
      <n-button size="tiny" quaternary @click="$emit('close')">✕</n-button>
    </div>

    <div class="conversation-list">
      <div v-if="conversations.length === 0" class="empty">
        暂无对话记录
      </div>
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: conv.id === activeId }"
        @click="$emit('select', conv.id)"
      >
        <div class="conv-title">{{ conv.title }}</div>
        <div class="conv-time">{{ formatTime(conv.updated_at) }}</div>
        <n-button
          size="tiny"
          quaternary
          class="delete-btn"
          @click.stop="$emit('delete', conv.id)"
        >
          🗑️
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../composables/useChat'

defineProps<{
  show: boolean
  conversations: Conversation[]
  activeId: string | null
}>()

defineEmits<{
  close: []
  select: [id: string]
  delete: [id: string]
}>()

function formatTime(dateStr: string): string {
  const date = new Date(dateStr + 'Z')
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: -280px;
  top: 0;
  bottom: 0;
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  z-index: 100;
  transition: left 0.3s;
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  left: 0;
}

.dark .sidebar {
  background: #222;
  border-right-color: #333;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.dark .sidebar-header {
  border-bottom-color: #333;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 24px;
  font-size: 13px;
}

.conversation-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
  position: relative;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.dark .conversation-item:hover {
  background: #2a2a2a;
}

.conversation-item.active {
  background: #e8f5e9;
}

.dark .conversation-item.active {
  background: #1a3a1e;
}

.conv-title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 24px;
}

.conv-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.delete-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}
</style>
