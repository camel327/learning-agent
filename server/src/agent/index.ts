// Agent 编排主逻辑
// TODO: P4 实现

import type { LLMConfig } from '../llm/adapter.js'

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_call_id?: string
}

/**
 * 运行 Agent 主循环
 * 支持多轮工具调用，直到 LLM 给出最终回答
 */
export async function* runAgent(
  userMessage: string,
  history: Message[],
  config: LLMConfig
): AsyncGenerator<{ type: 'content' | 'status' | 'error'; content: string }> {
  // TODO: P4 实现
  yield { type: 'content', content: 'Agent 编排待实现（P4 阶段）' }
}
