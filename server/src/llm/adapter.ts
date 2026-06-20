// 多模型统一适配层（OpenAI 兼容格式）
// TODO: P2 实现

export interface LLMConfig {
  provider: 'deepseek' | 'openai' | 'qwen' | 'custom'
  apiKey: string
  baseUrl: string
  model?: string
}

// 各提供商默认配置
const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
}

/**
 * 统一调用 LLM（OpenAI 兼容格式）
 * 所有支持 OpenAI 格式的提供商都可以直接适配
 */
export async function chat(
  config: LLMConfig,
  messages: Array<{ role: string; content: string; tool_call_id?: string }>,
  tools?: unknown[]
): Promise<Response> {
  const defaults = PROVIDER_DEFAULTS[config.provider] || PROVIDER_DEFAULTS.deepseek
  const baseUrl = config.baseUrl || defaults.baseUrl
  const model = config.model || defaults.model

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`LLM API error (${res.status}): ${error}`)
  }

  return res
}
