import { Router } from 'express'

export const configRouter = Router()

// GET /api/config — 获取当前配置（脱敏）
configRouter.get('/', (_req, res) => {
  // TODO: 从 SQLite 读取
  res.json({
    provider: null,
    baseUrl: null,
    hasApiKey: false,
  })
})

// POST /api/config — 保存配置
configRouter.post('/', (req, res) => {
  const { provider, apiKey, baseUrl } = req.body

  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'provider and apiKey are required' })
  }

  // TODO: 加密存储到 SQLite
  res.json({ success: true })
})

// POST /api/config/test — 测试连通性
configRouter.post('/test', async (req, res) => {
  const { provider, apiKey, baseUrl } = req.body

  // TODO: 发一个简单请求测试 API 是否可用
  res.json({ success: true, message: '连接测试待实现' })
})
