import { Router } from 'express'
import { getConfigValue } from '../db/index.js'
import { chatStream } from '../llm/adapter.js'
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
  const { message } = req.body

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

  const messages: ChatMessage[] = [
    { role: 'system', content: '你是一个有帮助的助手。' },
    { role: 'user', content: message },
  ]

  try {
    for await (const chunk of chatStream(config, messages)) {
      if (chunk.type === 'content' && chunk.content) {
        res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`)
      } else if (chunk.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', content: chunk.error })}\n\n`)
      } else if (chunk.type === 'done') {
        break
      }
    }
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

// GET /api/chat/history — 获取对话历史
chatRouter.get('/history', (_req, res) => {
  // TODO: P6 实现
  res.json([])
})
