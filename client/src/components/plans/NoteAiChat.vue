<template>
  <div class="ai-chat">
    <div class="ai-header">
      <span>🤖 AI 笔记助手</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="ai-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="ai-hint">
        告诉我你想生成什么笔记，如"帮我生成 {{ topic }} 的学习笔记"
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="ai-msg"
        :class="msg.role"
      >
        <div class="msg-content">{{ msg.content }}</div>
        <button
          v-if="msg.role === 'assistant' && msg.content && !msg.streaming"
          class="apply-btn"
          @click="$emit('apply', msg.content)"
        >
          应用到笔记
        </button>
      </div>
      <div v-if="streaming" class="ai-msg assistant">
        <div class="msg-content">{{ streamContent }}▌</div>
      </div>
    </div>
    <div class="ai-input">
      <input
        v-model="input"
        placeholder="输入指令..."
        @keydown.enter.exact="send"
        :disabled="streaming"
      />
      <button class="send-btn" @click="send" :disabled="!input.trim() || streaming">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  topic: string
  stageTitle: string
  itemTitle?: string
  currentNote: string
  planId: string
  stageId: string
  itemId?: string
}>()

const emit = defineEmits<{
  close: []
  apply: [content: string]
}>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const messages = ref<ChatMessage[]>([])
const input = ref('')
const streaming = ref(false)
const streamContent = ref('')
const messagesRef = ref<HTMLElement>()

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

async function send() {
  const text = input.value.trim()
  if (!text || streaming.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  scrollToBottom()

  streaming.value = true
  streamContent.value = ''

  try {
    const res = await fetch('/api/plans/chat-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: props.planId,
        stageId: props.stageId,
        itemId: props.itemId,
        message: text,
        currentNote: props.currentNote,
        stageTitle: props.stageTitle,
        itemTitle: props.itemTitle,
        topic: props.topic
      })
    })

    if (!res.ok || !res.body) {
      throw new Error('请求失败')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              streamContent.value += parsed.content
              scrollToBottom()
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    if (streamContent.value) {
      messages.value.push({ role: 'assistant', content: streamContent.value })
    }
  } catch (err: any) {
    messages.value.push({ role: 'assistant', content: `❌ 错误：${err.message}` })
  } finally {
    streaming.value = false
    streamContent.value = ''
    scrollToBottom()
  }
}
</script>

<style scoped>
.ai-chat {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  animation: slideDown 0.2s ease;
}

.dark .ai-chat {
  border-color: #333;
  background: #1a1a1a;
}

@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 400px; }
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f7f0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 13px;
  font-weight: 600;
}

.dark .ai-header {
  background: #1a2e1a;
  border-bottom-color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.dark .close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ai-messages {
  max-height: 260px;
  overflow-y: auto;
  padding: 12px;
}

.ai-hint {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

.ai-msg {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.ai-msg.user {
  text-align: right;
}

.ai-msg.user .msg-content {
  display: inline-block;
  background: #18a058;
  color: #fff;
  padding: 6px 12px;
  border-radius: 12px 12px 2px 12px;
  max-width: 85%;
  text-align: left;
  white-space: pre-wrap;
}

.ai-msg.assistant .msg-content {
  background: #f0f0f0;
  padding: 8px 12px;
  border-radius: 12px 12px 12px 2px;
  white-space: pre-wrap;
}

.dark .ai-msg.assistant .msg-content {
  background: #2a2a2a;
}

.apply-btn {
  background: none;
  border: 1px solid #18a058;
  color: #18a058;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.15s;
}

.apply-btn:hover {
  background: #18a058;
  color: #fff;
}

.ai-input {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
}

.dark .ai-input {
  border-top-color: #333;
}

.ai-input input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: #333;
}

.dark .ai-input input {
  background: #222;
  border-color: #444;
  color: #e0e0e0;
}

.ai-input input:focus {
  border-color: #18a058;
}

.send-btn {
  background: #18a058;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.send-btn:hover:not(:disabled) {
  background: #15924b;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
