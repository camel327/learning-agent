<template>
  <!-- 遮罩层 -->
  <div v-if="show" class="sidebar-overlay" @click="$emit('close')" />

  <div class="sidebar" :class="{ open: show }">
    <!-- 导航菜单 -->
    <nav class="nav-section">
      <div
        class="nav-item"
        :class="{ active: currentView === 'chat' }"
        @click="$emit('newChat')"
      >
        <span class="nav-icon">➕</span>
        <span>新对话</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: currentView === 'chat' }"
        @click="$emit('switchView', 'chat')"
      >
        <span class="nav-icon">💬</span>
        <span>对话</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: currentView === 'plans' }"
        @click="$emit('switchView', 'plans')"
      >
        <span class="nav-icon">📚</span>
        <span>路线库</span>
      </div>
    </nav>

    <div class="divider" />

    <!-- 对话历史 -->
    <div class="history-section">
      <div class="section-title">历史对话</div>
      <div class="conversation-list">
        <div v-if="conversations.length === 0" class="empty">
          暂无对话记录
        </div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: conv.id === activeId && currentView === 'chat' }"
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
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../composables/useChat'

defineProps<{
  show: boolean
  currentView: 'chat' | 'plans'
  conversations: Conversation[]
  activeId: string | null
}>()

defineEmits<{
  close: []
  newChat: []
  switchView: [view: 'chat' | 'plans']
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
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

.sidebar {
  position: fixed;
  left: -260px;
  top: 0;
  bottom: 0;
  width: 260px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  z-index: 100;
  transition: left 0.25s ease;
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  left: 0;
}

.dark .sidebar {
  background: #1e1e1e;
  border-right-color: #333;
}

/* 导航区域 */
.nav-section {
  padding: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.nav-item:hover {
  background: #f5f5f5;
}

.dark .nav-item:hover {
  background: #2a2a2a;
}

.nav-item.active {
  background: #e8f5e9;
  color: #18a058;
  font-weight: 500;
}

.dark .nav-item.active {
  background: #1a3a1e;
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

/* 分割线 */
.divider {
  height: 1px;
  background: #e8e8e8;
  margin: 4px 12px;
}

.dark .divider {
  background: #333;
}

/* 历史区域 */
.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-title {
  padding: 8px 16px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
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
  transition: background 0.15s;
  margin-bottom: 2px;
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
  transition: opacity 0.15s;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}
</style>
