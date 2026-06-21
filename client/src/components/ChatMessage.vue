<template>
  <div class="chat-message" :class="[message.role]">
    <div class="avatar">
      {{ message.role === 'user' ? '👤' : '🤖' }}
    </div>
    <div class="bubble">
      <div class="content markdown-body" v-html="renderedContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import type { Message } from '../composables/useChat'

const props = defineProps<{ message: Message }>()

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
})

const renderedContent = computed(() => {
  return md.render(props.message.content || '')
})
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: #f0f0f0;
}

.bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  overflow-wrap: break-word;
}

.user .bubble {
  background: #18a058;
  color: white;
}

.assistant .bubble {
  background: #f5f5f5;
  color: #333;
}

/* Markdown 样式 */
.content :deep(h2) {
  font-size: 16px;
  margin: 12px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.content :deep(h3) {
  font-size: 15px;
  margin: 10px 0 6px;
}

.content :deep(ul),
.content :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.content :deep(li) {
  margin: 4px 0;
}

.content :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.content :deep(a:hover) {
  text-decoration: underline;
}

.content :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.content :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.content :deep(pre code) {
  background: none;
  padding: 0;
}

.content :deep(blockquote) {
  border-left: 3px solid #18a058;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
}

.content :deep(hr) {
  border: none;
  border-top: 1px solid #eee;
  margin: 12px 0;
}

.content :deep(strong) {
  font-weight: 600;
}

/* 用户消息中的 Markdown 保持白色 */
.user .content :deep(a) {
  color: #a0e8c0;
}

.user .content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
}

.user .content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.8);
}
</style>
