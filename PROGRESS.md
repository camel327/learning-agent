# 开发进度

## 📋 待开发

_（暂无）_

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

### P3：爬虫模块（PR #5）
- [x] 阶段 1：知乎 + 必应搜索学习路线
- [x] 阶段 2：B站视频搜索（API 方式）
- [x] 视频评分排序（播放量 0.5 + 弹幕 0.3 + 评论 0.2）
- [x] 工具定义 + 执行器（search_roadmap / search_videos）

### P4：Agent 编排（PR #6）
- [x] 工具定义（search_roadmap / search_videos）
- [x] Agent 主循环（支持多轮工具调用）
- [x] System Prompt 设计
- [x] /api/chat 接入 Agent 编排
- [x] 前端状态展示（搜索中、整理中）

### P5：UI 完善（PR #7）
- [x] Markdown 渲染（markdown-it，支持标题/列表/代码/链接/引用）
- [x] 视频推荐卡片组件（封面+标题+播放量+弹幕）
- [x] 暗黑模式支持（切换按钮+全局样式）
- [x] 示例问题快捷按钮
- [x] 状态加载动画

### P6：打磨部署（PR #8）
- [x] 对话历史持久化（SQLite）
- [x] 对话列表 CRUD 接口（/api/chat/conversations）
- [x] 前端对话历史侧边栏
- [x] 错误处理（API Key 未配置提示）
