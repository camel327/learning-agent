<template>
  <div class="chat-view">
    <div class="messages" ref="messagesRef">
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="empty">
        <div class="empty-icon">📚</div>
        <h3>学习规划 Agent</h3>
        <p>告诉我你想学什么技术，我来帮你规划学习路线并推荐视频。</p>
        <div class="examples">
          <n-button v-for="ex in examples" :key="ex" size="small" quaternary
            @click="sendMessage(ex)">
            {{ ex }}
          </n-button>
        </div>
        <p v-if="!config?.hasApiKey" class="tip">
          ⚠️ 请先点击右上角「⚙️ 模型配置」填写 API Key
        </p>
      </div>

      <!-- 消息列表 -->
      <template v-for="(msg, i) in messages" :key="i">
        <ChatMessage :message="msg" :conversationId="conversationId" :isStreaming="isStreaming" />
      </template>

      <!-- 状态提示 -->
      <div v-if="statusText" class="status">
        <n-spin size="small" /> {{ statusText }}
      </div>
    </div>

    <ChatInput :disabled="isStreaming" @send="sendMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { NSpin } from 'naive-ui'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import { useChat } from '../composables/useChat'
import { useConfig } from '../composables/useConfig'

const {
  messages,
  isStreaming,
  statusText,
  conversationId,
  sendMessage,
  clearMessages,
  loadConversations,
} = useChat()

const { config, fetchConfig } = useConfig()
const messagesRef = ref<HTMLElement>()

const examples = [
  '我想学 Vue 3',
  '我想学 Python 爬虫',
  '我想学 React',
  '我想学 Go 语言',
]

onMounted(() => {
  fetchConfig()
})

// 对话完成后刷新列表（通知 App 更新侧边栏）
watch(statusText, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    loadConversations()
  }
})

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}, { deep: true })

watch(statusText, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})

defineExpose({ clearMessages })
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
}

.empty {
  text-align: center;
  color: #999;
  margin-top: 20vh;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #333;
}

.empty p {
  margin: 4px 0;
  font-size: 14px;
}

.examples {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.tip {
  color: #e6a23c;
  margin-top: 16px;
  font-size: 13px;
}

.status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #18a058;
  font-size: 13px;
  padding: 12px 8px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
