import { Router } from 'express'
import { getConfigValue, setConfigValue } from '../db/index.js'
import { testConnection, getProviderDefaults, PROVIDER_OPTIONS } from '../llm/adapter.js'
import type { LLMConfig } from '../llm/adapter.js'

export const configRouter = Router()

/**
 * 从 DB 读取完整 LLM 配置
 */
function loadLLMConfig(): LLMConfig | null {
  const provider = getConfigValue('provider')
  const apiKey = getConfigValue('api_key')
  if (!provider || !apiKey) return null

  const baseUrl = getConfigValue('base_url') || ''
  const model = getConfigValue('model') || ''

  return { provider: provider as LLMConfig['provider'], apiKey, baseUrl, model }
}

// GET /api/config — 获取当前配置（脱敏）
configRouter.get('/', (_req, res) => {
  const provider = getConfigValue('provider')
  const apiKey = getConfigValue('api_key')
  const baseUrl = getConfigValue('base_url')
  const model = getConfigValue('model')

  res.json({
    provider: provider || null,
    apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
    hasApiKey: !!apiKey,
    baseUrl: baseUrl || null,
    model: model || null,
    providers: PROVIDER_OPTIONS,
    defaults: provider ? getProviderDefaults(provider) : null,
  })
})

// POST /api/config — 保存配置
configRouter.post('/', (req, res) => {
  const { provider, apiKey, baseUrl, model } = req.body

  if (!provider) {
    return res.status(400).json({ error: 'provider is required' })
  }

  setConfigValue('provider', provider)

  if (apiKey) setConfigValue('api_key', apiKey)
  if (baseUrl) setConfigValue('base_url', baseUrl)
  else setConfigValue('base_url', '')
  if (model) setConfigValue('model', model)
  else setConfigValue('model', '')

  res.json({ success: true })
})

// POST /api/config/test — 测试连通性
configRouter.post('/test', async (req, res) => {
  const { provider, apiKey, baseUrl, model } = req.body

  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'provider and apiKey are required' })
  }

  const result = await testConnection({
    provider,
    apiKey,
    baseUrl: baseUrl || '',
    model: model || '',
  })

  res.json(result)
})

// GET /api/config/llm — 获取完整 LLM 配置（供内部使用，不暴露给前端）
configRouter.get('/llm', (_req, res) => {
  const config = loadLLMConfig()
  if (!config) {
    return res.status(404).json({ error: '未配置 API Key' })
  }
  res.json(config)
})
