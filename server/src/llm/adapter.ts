// 多模型统一适配层（OpenAI 兼容格式）

export interface LLMConfig {
  provider: 'deepseek' | 'openai' | 'qwen' | 'custom'
  apiKey: string
  baseUrl: string
  model?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface StreamChunk {
  type: 'content' | 'tool_calls' | 'done' | 'error'
  content?: string
  tool_calls?: ToolCall[]
  error?: string
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

export const PROVIDER_OPTIONS = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: '通义千问', value: 'qwen' },
  { label: '自定义', value: 'custom' },
]

/**
 * 获取提供商默认配置
 */
export function getProviderDefaults(provider: string) {
  return PROVIDER_DEFAULTS[provider] || null
}

/**
 * 测试 API 连通性
 */
export async function testConnection(config: LLMConfig): Promise<{ success: boolean; message: string }> {
  try {
    const defaults = PROVIDER_DEFAULTS[config.provider] || PROVIDER_DEFAULTS.deepseek
    const baseUrl = config.baseUrl || defaults.baseUrl
    const model = config.model || defaults.model

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      return { success: false, message: `HTTP ${res.status}: ${error.slice(0, 200)}` }
    }

    return { success: true, message: '连接成功' }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

/**
 * 统一调用 LLM（流式 SSE）
 * 返回一个 AsyncGenerator，逐块 yield 内容
 */
export async function* chatStream(
  config: LLMConfig,
  messages: ChatMessage[],
  tools?: unknown[]
): AsyncGenerator<StreamChunk> {
  const defaults = PROVIDER_DEFAULTS[config.provider] || PROVIDER_DEFAULTS.deepseek
  const baseUrl = config.baseUrl || defaults.baseUrl
  const model = config.model || defaults.model

  console.log(`[LLM] 调用 ${config.provider} | model=${model} | baseUrl=${baseUrl}`)

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  }

  if (tools && tools.length > 0) {
    body.tools = tools
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err: any) {
    console.error(`[LLM] 网络错误:`, err.message)
    yield { type: 'error', error: `LLM 网络错误: ${err.message}` }
    return
  }

  if (!res.ok) {
    const error = await res.text()
    console.error(`[LLM] API 错误 (${res.status}):`, error.slice(0, 200))
    yield { type: 'error', error: `LLM API error (${res.status}): ${error.slice(0, 200)}` }
    return
  }

  console.log(`[LLM] 响应成功，开始流式读取`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  // 累积 tool_calls
  const toolCallsMap: Map<number, { id: string; name: string; arguments: string }> = new Map()

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
      if (data === '[DONE]') {
        // 如果有累积的 tool_calls，yield 出去
        if (toolCallsMap.size > 0) {
          const toolCalls: ToolCall[] = []
          for (const [, tc] of toolCallsMap) {
            toolCalls.push({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: tc.arguments },
            })
          }
          yield { type: 'tool_calls', tool_calls: toolCalls }
        }
        yield { type: 'done' }
        return
      }

      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta
        if (!delta) continue

        // 普通文本内容
        if (delta.content) {
          yield { type: 'content', content: delta.content }
        }

        // 工具调用（流式累积）
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0
            if (!toolCallsMap.has(idx)) {
              toolCallsMap.set(idx, {
                id: tc.id || '',
                name: tc.function?.name || '',
                arguments: '',
              })
            }
            const existing = toolCallsMap.get(idx)!
            if (tc.id) existing.id = tc.id
            if (tc.function?.name) existing.name = tc.function.name
            if (tc.function?.arguments) existing.arguments += tc.function.arguments
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 流结束但没收到 [DONE]
  if (toolCallsMap.size > 0) {
    const toolCalls: ToolCall[] = []
    for (const [, tc] of toolCallsMap) {
      toolCalls.push({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments },
      })
    }
    yield { type: 'tool_calls', tool_calls: toolCalls }
  }
  yield { type: 'done' }
}
