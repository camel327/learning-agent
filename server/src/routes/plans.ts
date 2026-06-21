import { Router } from 'express'
import { randomUUID } from 'crypto'
import { savePlan, getPlans, getPlan, deletePlan } from '../db/index.js'

export const plansRouter = Router()

// GET /api/plans — 获取所有保存的学习路线
plansRouter.get('/', (_req, res) => {
  const plans = getPlans()
  res.json(plans)
})

// GET /api/plans/:id — 获取单条路线
plansRouter.get('/:id', (req, res) => {
  const plan = getPlan(req.params.id)
  if (!plan) {
    return res.status(404).json({ error: '路线不存在' })
  }
  res.json(plan)
})

// POST /api/plans — 保存学习路线
plansRouter.post('/', (req, res) => {
  const { topic, content, conversationId } = req.body

  if (!topic || !content) {
    return res.status(400).json({ error: 'topic and content are required' })
  }

  const id = randomUUID()
  savePlan(id, topic, content, conversationId)

  res.json({ id, success: true })
})

// DELETE /api/plans/:id — 删除路线
plansRouter.delete('/:id', (req, res) => {
  deletePlan(req.params.id)
  res.json({ success: true })
})
