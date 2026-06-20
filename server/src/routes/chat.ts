import { Router } from 'express'

export const chatRouter = Router()

// POST /api/chat — 聊天（SSE 流式返回）
chatRouter.post('/', async (req, res) => {
  const { message, conversationId } = req.body

  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // TODO: 接入 Agent 编排，暂时返回模拟数据
  const mockResponse = `收到你的消息：${message}\n\n这是开发阶段的模拟回复，后续会接入真实的 Agent。`

  for (const char of mockResponse) {
    res.write(`data: ${JSON.stringify({ type: 'content', content: char })}\n\n`)
    await new Promise(r => setTimeout(r, 20))
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

// GET /api/chat/history — 获取对话历史
chatRouter.get('/history', (_req, res) => {
  // TODO: 从 SQLite 读取
  res.json([])
})
