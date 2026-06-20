<template>
  <div class="chat-message" :class="[message.role]">
    <div class="avatar">
      {{ message.role === 'user' ? '👤' : '🤖' }}
    </div>
    <div class="bubble">
      <div class="content" v-html="renderedContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '../composables/useChat'

const props = defineProps<{ message: Message }>()

const renderedContent = computed(() => {
  // 简单的 Markdown 渲染：换行、加粗、链接
  let text = props.message.content
  text = text.replace(/\n/g, '<br>')
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
  return text
})
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
}

.user .bubble {
  background: #18a058;
  color: white;
}

.assistant .bubble {
  background: #f5f5f5;
  color: #333;
}

.content :deep(a) {
  color: #18a058;
  text-decoration: underline;
}
</style>
