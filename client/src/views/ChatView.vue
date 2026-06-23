<template>
  <div class="chat-view">
    <div class="messages" ref="messagesRef">
      <!-- 空状态 -->
      <div v-if="chatStore.messages.length === 0" class="empty">
        <div class="empty-icon"><IconLibrary style="font-size: 48px" /></div>
        <h3>学习规划 Agent</h3>
        <p>告诉我你想学什么技术，我来帮你规划学习路线并推荐视频。</p>
        <div class="examples">
          <n-button v-for="ex in examples" :key="ex" size="small" quaternary
            @click="chatStore.sendMessage(ex)">
            {{ ex }}
          </n-button>
        </div>
        <p v-if="!config?.hasApiKey" class="tip">
          <IconWarning /> 请先点击右上角「<IconSettings /> 模型配置」填写 API Key
        </p>
      </div>

      <!-- 消息列表 -->
      <template v-for="(msg, i) in chatStore.messages" :key="i">
        <ChatMessage
          :message="msg"
          :conversationId="chatStore.conversationId"
          :isStreaming="chatStore.isStreaming"
          :alreadySaved="isConversationSaved"
        />
      </template>

      <!-- 状态提示 -->
      <div v-if="chatStore.statusText" class="status">
        <n-spin size="small" /> {{ chatStore.statusText }}
      </div>
    </div>

    <ChatInput :disabled="chatStore.isStreaming" @send="chatStore.sendMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { NSpin } from 'naive-ui'
import IconLibrary from '~icons/ic/baseline-library-books'
import IconWarning from '~icons/ic/baseline-warning'
import IconSettings from '~icons/ic/baseline-settings'
import ChatMessage from '../components/ChatMessage.vue'
import ChatInput from '../components/ChatInput.vue'
import { useChatStore } from '../stores/chat'
import { useConfig } from '../composables/useConfig'
import { usePlans } from '../composables/usePlans'

const chatStore = useChatStore()
const { config, fetchConfig } = useConfig()
const { plans, loadPlans } = usePlans()
const messagesRef = ref<HTMLElement>()

const examples = [
  '我想学 Vue 3',
  '我想学 Python 爬虫',
  '我想学 React',
  '我想学 Go 语言',
]

// 检查当前对话是否已保存过路线
const isConversationSaved = computed(() => {
  if (!chatStore.conversationId) return false
  return plans.value.some(p => p.conversation_id === chatStore.conversationId)
})

onMounted(() => {
  fetchConfig()
  loadPlans()
})

// 切换对话时重新加载路线列表
watch(() => chatStore.conversationId, () => {
  loadPlans()
})

// 对话完成后刷新列表
watch(() => chatStore.statusText, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    chatStore.loadConversations()
    loadPlans() // 保存路线后也刷新
  }
})

// 自动滚动到底部
watch(() => chatStore.messages, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}, { deep: true })

watch(() => chatStore.statusText, async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
})
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
