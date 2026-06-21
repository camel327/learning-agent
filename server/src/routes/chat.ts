import { Router } from 'express'
import { getConfigValue } from '../db/index.js'
import { runAgent } from '../agent/index.js'
import type { LLMConfig } from '../llm/adapter.js'

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

  try {
    // TODO: P6 从 SQLite 加载历史对话
    const history: never[] = []

    for await (const event of runAgent(message, history, config)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
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
