import { Router } from 'express'
import { randomUUID } from 'crypto'
import {
  savePlan, getPlans, getPlan, deletePlan,
  savePlanWithStructure, getPlanDetail,
  updateStageCompletion, updateItemCompletion,
  updateStageNote, updateItemNote,
  getStageById, getItemById,
  getConfigValue
} from '../db/index.js'
import { parsePlanMarkdown } from '../utils/planParser.js'
import { chatStream } from '../llm/adapter.js'
import type { LLMConfig, ChatMessage } from '../llm/adapter.js'

export const plansRouter = Router()

// GET /api/plans — 获取所有保存的学习路线
plansRouter.get('/', (_req, res) => {
  const plans = getPlans()
  res.json(plans)
})

// GET /api/plans/:id — 获取单条路线（原始数据）
plansRouter.get('/:id', (req, res) => {
  const plan = getPlan(req.params.id)
  if (!plan) {
    return res.status(404).json({ error: '路线不存在' })
  }
  res.json(plan)
})

// GET /api/plans/:id/detail — 获取路线详情（含阶段和知识点）
plansRouter.get('/:id/detail', (req, res) => {
  const detail = getPlanDetail(req.params.id)
  if (!detail) {
    return res.status(404).json({ error: '路线不存在' })
  }
  res.json(detail)
})

// POST /api/plans — 保存学习路线（自动解析结构）
plansRouter.post('/', (req, res) => {
  const { topic, content, conversationId } = req.body

  if (!topic || !content) {
    return res.status(400).json({ error: 'topic and content are required' })
  }

  const id = randomUUID()
  const stages = parsePlanMarkdown(content)

  if (stages.length > 0 && stages.some(s => s.items.length > 0)) {
    // 有结构化数据，保存到三张表
    savePlanWithStructure(id, topic, content, stages, conversationId)
  } else {
    // 解析失败，只保存原始内容
    savePlan(id, topic, content, conversationId)
  }

  res.json({ id, success: true })
})

// PATCH /api/plans/stages/:id — 更新阶段（完成状态/笔记）
plansRouter.patch('/stages/:id', (req, res) => {
  const stage = getStageById(req.params.id)
  if (!stage) {
    return res.status(404).json({ error: '阶段不存在' })
  }

  if (req.body.completed !== undefined) {
    updateStageCompletion(req.params.id, req.body.completed ? 1 : 0)
  }
  if (req.body.note !== undefined) {
    updateStageNote(req.params.id, req.body.note)
  }

  res.json({ success: true })
})

// PATCH /api/plans/items/:id — 更新知识点（完成状态/笔记）
plansRouter.patch('/items/:id', (req, res) => {
  const item = getItemById(req.params.id)
  if (!item) {
    return res.status(404).json({ error: '知识点不存在' })
  }

  if (req.body.completed !== undefined) {
    updateItemCompletion(req.params.id, req.body.completed ? 1 : 0)
  }
  if (req.body.note !== undefined) {
    updateItemNote(req.params.id, req.body.note)
  }

  res.json({ success: true })
})

// DELETE /api/plans/:id — 删除路线
plansRouter.delete('/:id', (req, res) => {
  deletePlan(req.params.id)
  res.json({ success: true })
})

// POST /api/plans/chat-note — AI 笔记对话（SSE 流式）
plansRouter.post('/chat-note', async (req, res) => {
  const { planId, stageId, itemId, message, currentNote, stageTitle, itemTitle, topic } = req.body

  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  // 加载 LLM 配置
  const provider = getConfigValue('provider')
  const apiKey = getConfigValue('api_key')
  if (!provider || !apiKey) {
    return res.status(400).json({ error: '请先配置 API Key' })
  }

  const config: LLMConfig = {
    provider: provider as LLMConfig['provider'],
    apiKey,
    baseUrl: getConfigValue('base_url') || '',
    model: getConfigValue('model') || '',
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // 构建 system prompt
  const targetName = itemTitle || stageTitle
  const systemPrompt = `你是一个学习笔记助手。用户正在学习「${topic}」，当前正在为「${targetName}」编写学习笔记。

你的任务：
1. 根据用户的要求生成或修改 Markdown 格式的学习笔记
2. 笔记应包含：核心概念、要点总结、示例代码（如适用）、常见用法
3. 语言简洁清晰，适合学习者复习使用
4. 直接输出 Markdown 内容，不要加额外的说明文字

${currentNote ? `当前已有笔记内容：\n\`\`\`\n${currentNote}\n\`\`\`` : '当前还没有笔记内容。'}`

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ]

  try {
    console.log(`[NoteChat] 开始生成笔记: topic=${topic}, target=${targetName}`)

    for await (const chunk of chatStream(config, messages)) {
      if (chunk.type === 'content' && chunk.content) {
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
      } else if (chunk.type === 'error') {
        res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
      } else if (chunk.type === 'done') {
        break
      }
    }

    console.log(`[NoteChat] 笔记生成完成`)
  } catch (err: any) {
    console.error(`[NoteChat] 异常:`, err)
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
  }

  res.write('data: [DONE]\n\n')
  res.end()
})
