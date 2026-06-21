import { Router } from 'express'
import { randomUUID } from 'crypto'
import {
  getConfigValue,
  createConversation,
  getConversation,
  getConversations,
  deleteConversation,
  saveMessage,
  getMessages,
  updateConversationTitle,
} from '../db/index.js'
import { runAgent } from '../agent/index.js'
import type { LLMConfig, ChatMessage } from '../llm/adapter.js'

export const chatRouter = Router()

/**
 * 从 DB 读取 LLM 配置
 */
function loadLLMConfig(): LLMConfig | null {
  const provider = getConfigValue('provider')
  const apiKey = getConfigValue('api_key')
  if (!provider || !apiKey) return null

  return {
    provider: provider as LLMConfig['provider'],
    apiKey,
    baseUrl: getConfigValue('base_url') || '',
    model: getConfigValue('model') || '',
  }
}

// POST /api/chat — 聊天（SSE 流式返回）
chatRouter.post('/', async (req, res) => {
  const { message, conversationId } = req.body

  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  const config = loadLLMConfig()
  if (!config) {
    return res.status(400).json({ error: '请先配置 API Key' })
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // 处理对话
  let convId = conversationId

  try {
    // 如果没有 conversationId，创建新对话
    if (!convId) {
      convId = randomUUID()
      const title = message.length > 20 ? message.slice(0, 20) + '...' : message
      createConversation(convId, title)
      // 通知前端新的 conversationId
      res.write(`data: ${JSON.stringify({ type: 'conversation_id', content: convId })}\n\n`)
    }

    // 保存用户消息
    saveMessage(convId, 'user', message)

    // 加载历史消息作为上下文
    const historyRows = getMessages(convId)
    const history: ChatMessage[] = historyRows
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(0, -1) // 排除最后一条（刚保存的用户消息）
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // 收集 assistant 回复
    let assistantContent = ''

    for await (const event of runAgent(message, history, config)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)

      if (event.type === 'content') {
        assistantContent += event.content
      }
    }

    // 保存 assistant 回复
    if (assistantContent) {
      saveMessage(convId, 'assistant', assistantContent)
    }
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

// GET /api/chat/conversations — 获取对话列表
chatRouter.get('/conversations', (_req, res) => {
  const conversations = getConversations()
  res.json(conversations)
})

// GET /api/chat/conversations/:id — 获取单个对话详情（含消息）
chatRouter.get('/conversations/:id', (req, res) => {
  const { id } = req.params
  const conversation = getConversation(id)

  if (!conversation) {
    return res.status(404).json({ error: '对话不存在' })
  }

  const messages = getMessages(id)
  res.json({ ...conversation, messages })
})

// DELETE /api/chat/conversations/:id — 删除对话
chatRouter.delete('/conversations/:id', (req, res) => {
  const { id } = req.params
  deleteConversation(id)
  res.json({ success: true })
})
