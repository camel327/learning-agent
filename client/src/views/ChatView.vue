<template>
  <div class="chat-view">
    <div class="header">
      <h2>📚 学习规划 Agent</h2>
      <n-space>
        <n-button size="small" @click="showConfig = true">
          ⚙️ 模型配置
        </n-button>
        <n-button size="small" @click="clearMessages">清空对话</n-button>
      </n-space>
    </div>

    <div class="messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty">
        <p>👋 你好！告诉我你想学什么技术，我来帮你规划学习路线。</p>
        <p>例如：我想学 Vue 3、我想学 Python 爬虫</p>
        <p v-if="!config?.hasApiKey" class="tip">
          ⚠️ 请先点击右上角「模型配置」填写 API Key
        </p>
      </div>
      <ChatMessage v-for="(msg, i) in messages" :key="i" :message="msg" />
      <div v-if="statusText" class="status">{{ statusText }}</div>
    </div>

    <ChatInput :disabled="isStreaming" @send="sendMessage" />

    <ApiConfig v-model:show="showConfig" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import ApiConfig from '../components/ApiConfig.vue'
import { useChat } from '../composables/useChat'
import { useConfig } from '../composables/useConfig'

const { messages, isStreaming, statusText, sendMessage, clearMessages } = useChat()
const { config, fetchConfig } = useConfig()
const messagesRef = ref<HTMLElement>()
const showConfig = ref(false)

onMounted(() => {
  fetchConfig()
})

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

.tip {
  color: #e6a23c;
  margin-top: 12px;
}

.status {
  text-align: center;
  color: #18a058;
  font-size: 13px;
  padding: 8px;
}
</style>
