# 开发进度

## 📋 待开发

### P1：项目骨架
- [x] 初始化 Vue 3 + Vite 项目
- [x] 初始化 Express + TypeScript 项目
- [x] 前端：聊天界面骨架 + SSE 流式接收
- [x] 后端：聊天接口 + SSE 流式返回
- [x] Vite 代理配置（开发环境转发 /api 到后端）

### P2：LLM 适配层
- [x] LLM 适配器（统一 OpenAI 格式请求）
- [x] 配置管理接口（加密存储 API Key）
- [x] 前端配置弹窗（选择提供商、填 Key、测试连通）
- [x] 支持 DeepSeek / OpenAI / 通义千问

### P3：爬虫模块
- [ ] 阶段 1：知乎搜索学习路线
- [ ] 阶段 1：必应搜索学习路线
- [ ] 阶段 2：B站视频搜索（API 方式）
- [ ] 阶段 2：视频评分排序（播放量 0.5 + 弹幕 0.3 + 评论 0.2）

### P4：Agent 编排
- [ ] 工具定义（search_roadmap / search_videos）
- [ ] Agent 主循环（支持多轮工具调用）
- [ ] System Prompt 设计
- [ ] 前端状态展示（搜索中、整理中、生成中）

### P5：UI 完善
- [ ] 学习路线时间线可视化
- [ ] 视频推荐卡片（封面 + 标题 + 播放量）
- [ ] Markdown 渲染（消息气泡）
- [ ] 对话历史侧边栏
- [ ] 暗黑模式支持

### P6：打磨部署
- [ ] 对话历史持久化（SQLite）
- [ ] 错误处理 + 边界情况
- [ ] README 完善
- [ ] 部署方案

---

## ✅ 已完成

### P1：项目骨架（PR #1）
- [x] 初始化 Vue 3 + Vite 项目
- [x] 初始化 Express + TypeScript 项目
- [x] 前端：ChatView + ChatMessage + ChatInput + useChat composable
- [x] 后端：/api/chat SSE 流式接口 + /api/config + /api/health
- [x] 模块骨架：Agent / LLM 适配器 / 爬虫 / SQLite
- [x] Vite 代理配置

### P2：LLM 适配层（PR #3）
- [x] LLM 适配器完整实现（流式 SSE + 工具调用累积）
- [x] 支持 DeepSeek / OpenAI / 通义千问 / 自定义
- [x] 配置管理：SQLite 存储 API Key
- [x] /api/config CRUD + /api/config/test 连通测试
- [x] /api/chat 接入真实 LLM 流式调用
- [x] 前端 ApiConfig 配置弹窗 + useConfig composable
