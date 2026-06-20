import express from 'express'
import cors from 'cors'
import { chatRouter } from './routes/chat.js'
import { configRouter } from './routes/config.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 路由
app.use('/api/chat', chatRouter)
app.use('/api/config', configRouter)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
