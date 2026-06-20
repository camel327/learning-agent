<template>
  <div class="chat-view">
    <div class="header">
      <h2>📚 学习规划 Agent</h2>
      <n-button size="small" @click="clearMessages">清空对话</n-button>
    </div>

    <div class="messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty">
        <p>👋 你好！告诉我你想学什么技术，我来帮你规划学习路线。</p>
        <p>例如：我想学 Vue 3、我想学 Python 爬虫</p>
      </div>
      <ChatMessage v-for="(msg, i) in messages" :key="i" :message="msg" />
      <div v-if="statusText" class="status">{{ statusText }}</div>
    </div>

    <ChatInput :disabled="isStreaming" @send="sendMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import { useChat } from '../composables/useChat'

const { messages, isStreaming, statusText, sendMessage, clearMessages } = useChat()
const messagesRef = ref<HTMLElement>()

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}, { deep: true })
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.header h2 {
  margin: 0;
  font-size: 18px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty {
  text-align: center;
  color: #999;
  margin-top: 40%;
}

.status {
  text-align: center;
  color: #18a058;
  font-size: 13px;
  padding: 8px;
}
</style>
