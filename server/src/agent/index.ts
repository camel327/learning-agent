// Agent 编排主逻辑 — 支持多轮工具调用

import { chatStream } from '../llm/adapter.js'
import type { LLMConfig, ChatMessage, ToolCall } from '../llm/adapter.js'
import { tools, executeTool } from './tools.js'
import { SYSTEM_PROMPT } from './prompt.js'

export interface AgentEvent {
  type: 'content' | 'status' | 'error'
  content: string
}

/**
 * 运行 Agent 主循环
 *
 * 流程：
 * 1. 用户消息 + 历史 → LLM（带 tools 定义）
 * 2. 如果 LLM 返回 tool_calls → 执行工具 → 把结果喂回 LLM
 * 3. 重复步骤 2，直到 LLM 给出纯文本回答（最多 maxRounds 轮）
 * 4. 流式输出最终回答
 */
export async function* runAgent(
  userMessage: string,
  history: ChatMessage[],
  config: LLMConfig,
  maxRounds: number = 10
): AsyncGenerator<AgentEvent> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userMessage },
  ]

  let rounds = 0

  while (rounds < maxRounds) {
    rounds++

    // 收集本轮 LLM 的所有输出
    let assistantContent = ''
    let toolCalls: ToolCall[] = []
    let hasError = false

    for await (const chunk of chatStream(config, messages, tools)) {
      if (chunk.type === 'content' && chunk.content) {
        assistantContent += chunk.content
        yield { type: 'content', content: chunk.content }
      } else if (chunk.type === 'tool_calls' && chunk.tool_calls) {
        toolCalls = chunk.tool_calls
      } else if (chunk.type === 'error' && chunk.error) {
        yield { type: 'error', content: chunk.error }
        hasError = true
        break
      } else if (chunk.type === 'done') {
        break
      }
    }

    if (hasError) return

    // 没有工具调用 → LLM 已给出最终回答，结束循环
    if (toolCalls.length === 0) {
      return
    }

    // 有工具调用 → 逐个执行
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: assistantContent || '',
      tool_calls: toolCalls,
    }
    messages.push(assistantMsg)

    for (const call of toolCalls) {
      const toolName = call.function.name
      let args: Record<string, unknown> = {}

      try {
        args = JSON.parse(call.function.arguments)
      } catch {
        // arguments 解析失败
      }

      // 通知前端当前状态
      if (toolName === 'search_roadmap') {
        yield { type: 'status', content: `正在搜索 "${args.topic}" 的学习路线...` }
      } else if (toolName === 'search_videos') {
        yield { type: 'status', content: `正在搜索 "${args.keyword}" 相关视频...` }
      }

      // 执行工具
      let result: unknown
      try {
        result = await executeTool(toolName, args)
      } catch (err: any) {
        result = { error: err.message }
      }

      // 把工具结果作为 tool message 加入对话
      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        tool_call_id: call.id,
      })
    }

    // 继续循环，让 LLM 处理工具结果
  }

  // 超过最大轮次
  yield { type: 'error', content: `Agent 超过最大轮次（${maxRounds}），已停止` }
}
