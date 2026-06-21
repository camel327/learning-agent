import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface StreamEvent {
  type: 'content' | 'status' | 'error' | 'conversation_id'
  content: string
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const statusText = ref('')
  const conversationId = ref<string | null>(null)
  const conversations = ref<Conversation[]>([])

  async function sendMessage(content: string) {
    messages.value.push({ role: 'user', content })
    messages.value.push({ role: 'assistant', content: '' })
    const assistantIndex = messages.value.length - 1

    isStreaming.value = true
    statusText.value = '思考中...'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: conversationId.value,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') break

          try {
            const event: StreamEvent = JSON.parse(data)
            const msg = messages.value[assistantIndex]
            if (!msg) continue

            switch (event.type) {
              case 'content':
                msg.content += event.content
                break
              case 'status':
                statusText.value = event.content
                break
              case 'error':
                msg.content += `\n\n❌ 错误：${event.content}`
                break
              case 'conversation_id':
                conversationId.value = event.content
                break
            }
          } catch {}
        }
      }

      // 处理 buffer 中剩余数据
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6)
        if (data !== '[DONE]') {
          try {
            const event: StreamEvent = JSON.parse(data)
            if (event.type === 'content') {
              messages.value[assistantIndex].content += event.content
            }
          } catch {}
        }
      }
    } catch (err: any) {
      messages.value[assistantIndex].content = `❌ 请求失败：${err.message}`
    } finally {
      isStreaming.value = false
      statusText.value = ''
    }
  }

  async function loadConversations() {
    try {
      const res = await fetch('/api/chat/conversations')
      conversations.value = await res.json()
    } catch {}
  }

  async function loadConversation(id: string) {
    try {
      const res = await fetch(`/api/chat/conversations/${id}`)
      const data = await res.json()
      conversationId.value = data.id
      messages.value = data.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }))
    } catch {}
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' })
      conversations.value = conversations.value.filter(c => c.id !== id)
      if (conversationId.value === id) {
        clearMessages()
      }
    } catch {}
  }

  function clearMessages() {
    messages.value = []
    conversationId.value = null
  }

  return {
    messages,
    isStreaming,
    statusText,
    conversationId,
    conversations,
    sendMessage,
    clearMessages,
    loadConversations,
    loadConversation,
    deleteConversation,
  }
})
