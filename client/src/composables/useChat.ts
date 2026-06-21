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

export function useChat() {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const statusText = ref('')
  const conversationId = ref<string | null>(null)
  const conversations = ref<Conversation[]>([])

  async function sendMessage(content: string) {
    console.log('[Chat] 发送消息:', content)

    // 添加用户消息
    messages.value.push({ role: 'user', content })

    // 添加空的 assistant 消息，流式填充
    const assistantMsg: Message = { role: 'assistant', content: '' }
    messages.value.push(assistantMsg)

    isStreaming.value = true
    statusText.value = '思考中...'

    try {
      console.log('[Chat] 请求 /api/chat...')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: conversationId.value,
        }),
      })

      console.log('[Chat] 响应状态:', response.status)

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('[Chat] 流结束，共收到', chunkCount, '个 chunk')
          break
        }

        chunkCount++
        const chunk = decoder.decode(value, { stream: true })
        console.log(`[Chat] chunk ${chunkCount}:`, chunk.slice(0, 200))

        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            console.log('[Chat] 收到 [DONE]')
            break
          }

          try {
            const event: StreamEvent = JSON.parse(data)
            console.log('[Chat] 事件:', event.type, event.content?.slice(0, 50))
            switch (event.type) {
              case 'content':
                assistantMsg.content += event.content
                break
              case 'status':
                statusText.value = event.content
                break
              case 'error':
                assistantMsg.content += `\n\n❌ 错误：${event.content}`
                break
              case 'conversation_id':
                conversationId.value = event.content
                break
            }
          } catch (e) {
            console.warn('[Chat] 解析失败:', data)
          }
        }
      }

      // 处理 buffer 中剩余的数据
      if (buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6)
        if (data !== '[DONE]') {
          try {
            const event: StreamEvent = JSON.parse(data)
            console.log('[Chat] 剩余事件:', event.type)
            if (event.type === 'content') {
              assistantMsg.content += event.content
            }
          } catch {}
        }
      }

      console.log('[Chat] 最终回复长度:', assistantMsg.content.length)
    } catch (err: any) {
      console.error('[Chat] 异常:', err)
      assistantMsg.content = `❌ 请求失败：${err.message}`
    } finally {
      isStreaming.value = false
      statusText.value = ''
    }
  }

  async function loadConversations() {
    try {
      const res = await fetch('/api/chat/conversations')
      conversations.value = await res.json()
    } catch {
      // 忽略
    }
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
    } catch {
      // 忽略
    }
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' })
      conversations.value = conversations.value.filter(c => c.id !== id)
      if (conversationId.value === id) {
        clearMessages()
      }
    } catch {
      // 忽略
    }
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
}
