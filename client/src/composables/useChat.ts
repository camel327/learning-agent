import { ref } from 'vue'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamEvent {
  type: 'content' | 'status' | 'error'
  content: string
}

export function useChat() {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const statusText = ref('')

  async function sendMessage(content: string) {
    // 添加用户消息
    messages.value.push({ role: 'user', content })

    // 添加空的 assistant 消息，流式填充
    const assistantMsg: Message = { role: 'assistant', content: '' }
    messages.value.push(assistantMsg)

    isStreaming.value = true
    statusText.value = '思考中...'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const event: StreamEvent = JSON.parse(data)
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
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (err: any) {
      assistantMsg.content = `❌ 请求失败：${err.message}`
    } finally {
      isStreaming.value = false
      statusText.value = ''
    }
  }

  function clearMessages() {
    messages.value = []
  }

  return { messages, isStreaming, statusText, sendMessage, clearMessages }
}
