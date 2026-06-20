# Learning Agent

一个基于大模型的学习规划 Agent。用户输入想学的技术，Agent 自动搜索学习路线、推荐 B站优质视频，生成结构化的学习计划。

## 核心功能

- **对话式交互**：通过自然语言描述学习需求
- **学习路线调研**：爬取知乎、必应等平台的学习路线文章
- **视频推荐**：搜索 B站相关视频，按播放量、弹幕、评论综合排序推荐
- **多模型支持**：用户自带 API Key，支持 DeepSeek / OpenAI / 通义千问等 OpenAI 兼容格式的模型

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 | Vue 3 + TypeScript + Vite | 用户主技术栈 |
| UI 库 | Naive UI | 组件丰富，内置暗黑模式 |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| 后端 | Express + TypeScript | 轻量、生态成熟 |
| 数据库 | SQLite (better-sqlite3) | 零配置，单文件 |
| 爬虫 | fetch + cheerio | 轻量 HTML 解析 |
| 流式输出 | SSE (Server-Sent Events) | 比 WebSocket 简单 |

## 项目结构

```
learning-agent/
├── client/                            # Vue 3 前端
│   ├── src/
│   │   ├── views/
│   │   │   └── ChatView.vue           # 主对话页面
│   │   ├── components/
│   │   │   ├── ApiConfig.vue           # API Key 配置弹窗
│   │   │   ├── ChatMessage.vue         # 消息气泡（Markdown 渲染）
│   │   │   ├── ChatInput.vue           # 输入框
│   │   │   ├── LearningRoadmap.vue     # 学习路线时间线
│   │   │   ├── VideoCard.vue           # 视频推荐卡片
│   │   │   ├── VideoList.vue           # 视频列表容器
│   │   │   └── Sidebar.vue             # 对话历史列表
│   │   ├── composables/
│   │   │   ├── useChat.ts              # 聊天 + SSE 逻辑
│   │   │   └── useConfig.ts            # 配置管理
│   │   ├── stores/
│   │   │   └── chat.ts                 # Pinia 状态管理
│   │   ├── api/
│   │   │   └── index.ts                # axios 封装
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                            # Node.js 后端
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.ts                # POST /api/chat（SSE 流式）
│   │   │   └── config.ts              # 配置 CRUD
│   │   ├── agent/
│   │   │   ├── index.ts               # Agent 主循环（多轮工具调用）
│   │   │   ├── prompt.ts              # System Prompt
│   │   │   └── tools.ts               # 工具定义 + 执行器
│   │   ├── llm/
│   │   │   └── adapter.ts             # 多模型统一适配（OpenAI 格式）
│   │   ├── crawler/
│   │   │   ├── roadmap.ts             # 阶段1：知乎 + 必应搜学习路线
│   │   │   └── bilibili.ts            # 阶段2：B站视频搜索 + 评分排序
│   │   ├── db/
│   │   │   └── index.ts               # SQLite 初始化 + 操作
│   │   └── app.ts                     # Express 入口
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## 开发流程

采用 PR 驱动开发，每个阶段一个 feature 分支 + PR：

```
main（稳定分支）
  │
  ├── feat/P1-skeleton        # 项目骨架 + 前后端联通
  ├── feat/P2-llm-adapter     # 多模型适配 + API Key 管理
  ├── feat/P3-crawler         # 爬虫模块（知乎/必应/B站）
  ├── feat/P4-agent           # Agent 编排 + Function Calling
  ├── feat/P5-ui              # 完整 UI + 学习路线可视化
  └── feat/P6-polish          # 对话历史 + 错误处理 + 部署
```

### 分支命名规范

- `feat/P{N}-{功能名}` — 新功能
- `fix/{问题描述}` — Bug 修复
- `refactor/{描述}` — 重构

### PR 规范

- PR 标题：`feat: 简要描述` / `fix: 简要描述`
- PR 正文：说明做了什么、如何测试
- 每个 PR 合并到 main 后，下一个 PR 基于最新的 main 创建

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 前端
cd client && npm install

# 后端
cd server && npm install
```

### 启动开发

```bash
# 启动后端（端口 3000）
cd server && npm run dev

# 启动前端（端口 5173，自动代理到后端）
cd client && npm run dev
```

## API 设计

### 聊天接口

```
POST /api/chat
Content-Type: application/json

请求体：
{
  "message": "我想学 Vue 3",
  "conversationId": "xxx"    // 可选，续接对话
}

响应：SSE 流式
data: {"type":"status","content":"正在搜索学习路线..."}
data: {"type":"content","content":"## 📚 Vue 3 学习路线\n\n"}
data: {"type":"content","content":"### 阶段 1：基础入门\n"}
data: [DONE]
```

### 配置接口

```
GET  /api/config          获取当前配置（脱敏）
POST /api/config          保存配置
POST /api/config/test     测试 API 连通性
```

## Agent 工作流程

```
用户输入 "我想学 Vue 3"
        │
        ▼
  ┌─────────────────┐
  │  LLM 分析意图    │
  └────────┬────────┘
           │ 调用 search_roadmap 工具
           ▼
  ┌─────────────────┐
  │ 爬虫搜索学习路线  │  知乎 + 必应
  └────────┬────────┘
           │ 结果返回 LLM
           ▼
  ┌─────────────────┐
  │ LLM 整理学习阶段  │  提取每阶段关键词
  └────────┬────────┘
           │ 对每个阶段调用 search_videos
           ▼
  ┌─────────────────┐
  │ 爬虫搜索 B站视频  │  按播放量+弹幕+评论排序
  └────────┬────────┘
           │ 结果返回 LLM
           ▼
  ┌─────────────────┐
  │ LLM 生成最终回答  │  学习路线 + 视频推荐
  └─────────────────┘
```

## 开发阶段详情

### P1：项目骨架（2 天）

**目标**：前后端联通，能跑通基础对话流

- [x] 初始化 Vue 3 + Vite 项目
- [ ] 初始化 Express + TypeScript 项目
- [ ] 前端：聊天界面骨架 + SSE 流式接收
- [ ] 后端：聊天接口 + SSE 流式返回
- [ ] Vite 代理配置（开发环境转发 /api 到后端）

### P2：LLM 适配层（1 天）

**目标**：支持用户配置自己的 API Key 和模型

- [ ] LLM 适配器（统一 OpenAI 格式请求）
- [ ] 配置管理接口（加密存储 API Key）
- [ ] 前端配置弹窗（选择提供商、填 Key、测试连通）
- [ ] 支持 DeepSeek / OpenAI / 通义千问

### P3：爬虫模块（2 天）

**目标**：两阶段爬虫流程可用

- [ ] 阶段 1：知乎搜索学习路线
- [ ] 阶段 1：必应搜索学习路线
- [ ] 阶段 2：B站视频搜索（API 方式）
- [ ] 阶段 2：视频评分排序（播放量 0.5 + 弹幕 0.3 + 评论 0.2）

### P4：Agent 编排（2 天）

**目标**：输入"我想学 XX"自动跑完全流程

- [ ] 工具定义（search_roadmap / search_videos）
- [ ] Agent 主循环（支持多轮工具调用）
- [ ] System Prompt 设计
- [ ] 前端状态展示（搜索中、整理中、生成中）

### P5：UI 完善（2 天）

**目标**：完整交互体验

- [ ] 学习路线时间线可视化
- [ ] 视频推荐卡片（封面 + 标题 + 播放量）
- [ ] Markdown 渲染（消息气泡）
- [ ] 对话历史侧边栏
- [ ] 暗黑模式支持

### P6：打磨部署（1 天）

**目标**：可展示的作品

- [ ] 对话历史持久化（SQLite）
- [ ] 错误处理 + 边界情况
- [ ] README 完善
- [ ] 部署方案

## 注意事项

- API Key 存储在后端 SQLite，前端不暴露
- 爬虫请求需要设置 User-Agent，避免被封
- B站 API 可能需要 Cookie 才能稳定访问
- LLM 调用设置最大轮次（10 轮），防止死循环
