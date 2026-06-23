// 学习路线 Markdown 解析器
// 将 AI 生成的 markdown 解析为结构化的 stages + items + videos

export interface VideoInfo {
  title: string
  url: string
  up: string
  views: string
}

export interface ParsedItem {
  title: string
  videos: VideoInfo[]
}

export interface ParsedStage {
  title: string
  items: ParsedItem[]
  videos: VideoInfo[]
}

/**
 * 解析 AI 生成的学习路线 markdown，提取阶段、知识点和视频
 *
 * AI 输出格式示例：
 * ### 阶段 1：基础入门（预计 7 天）
 * **知识点：**
 * - HTML/CSS 基础
 * - JavaScript 基础
 * **推荐视频：**
 * - 🎬 [视频标题](https://www.bilibili.com/video/BVxxx) — UP: xxx | ▶️ xx万播放
 */
export function parsePlanMarkdown(content: string): ParsedStage[] {
  const lines = content.split('\n')
  const stages: ParsedStage[] = []
  let currentStage: ParsedStage | null = null
  let currentKnowledgeItem: ParsedItem | null = null
  let inKnowledgeSection = false
  let inVideoSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 检测阶段标题：### 阶段 或 ## 阶段
    const stageMatch = trimmed.match(/^#{2,3}\s+阶段\s*\d*[：:]\s*(.+)/)
    if (stageMatch) {
      currentStage = {
        title: stageMatch[1].replace(/[（(].*?[）)]/, '').trim(),
        items: [],
        videos: []
      }
      stages.push(currentStage)
      inKnowledgeSection = false
      inVideoSection = false
      currentKnowledgeItem = null
      continue
    }

    // 检测知识点区域
    if (currentStage && (trimmed.includes('知识点') || trimmed.includes('学习内容') || trimmed.includes('核心内容'))) {
      inKnowledgeSection = true
      inVideoSection = false
      currentKnowledgeItem = null
      continue
    }

    // 检测视频推荐区域
    if (trimmed.includes('推荐视频') || trimmed.includes('视频推荐') || trimmed.includes('学习资源')) {
      inKnowledgeSection = false
      inVideoSection = true
      currentKnowledgeItem = null
      continue
    }

    // 检测其他标题区域（重置状态）
    if (trimmed.match(/^#{1,3}\s/) && !stageMatch) {
      if (!trimmed.includes('知识点') && !trimmed.includes('视频')) {
        inKnowledgeSection = false
        inVideoSection = false
        currentKnowledgeItem = null
      }
    }

    // 在知识点区域中，提取列表项
    if (currentStage && inKnowledgeSection && !inVideoSection) {
      const itemMatch = trimmed.match(/^[-*+]\s+(.+)/)
      if (itemMatch) {
        let itemTitle = itemMatch[1]
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim()

        if (!itemTitle.includes('🎬') && !itemTitle.includes('UP:') && !itemTitle.includes('播放')) {
          currentKnowledgeItem = { title: itemTitle, videos: [] }
          currentStage.items.push(currentKnowledgeItem)
        }
      }
    }

    // 在视频区域中，提取视频链接
    if (currentStage && inVideoSection) {
      const video = parseVideoLine(trimmed)
      if (video) {
        currentStage.videos.push(video)
        // 也关联到最近一个知识点
        if (currentKnowledgeItem) {
          currentKnowledgeItem.videos.push(video)
        }
      }
    }
  }

  // 如果没有解析到阶段，尝试兜底解析
  if (stages.length === 0) {
    return fallbackParse(content)
  }

  return stages
}

/**
 * 解析单行视频信息
 * 格式：- 🎬 [视频标题](https://www.bilibili.com/video/BVxxx) — UP: xxx | ▶️ xx万播放
 */
function parseVideoLine(line: string): VideoInfo | null {
  // 匹配 markdown 链接格式
  const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
  if (!linkMatch) return null

  const title = linkMatch[1].trim()
  const url = linkMatch[2].trim()

  // 提取 UP 主
  const upMatch = line.match(/UP[：:]\s*([^|]+)/)
  const up = upMatch ? upMatch[1].trim() : ''

  // 提取播放量
  const viewsMatch = line.match(/▶️?\s*([\d.]+万?)/)
  const views = viewsMatch ? viewsMatch[1].trim() : ''

  return { title, url, up, views }
}

/**
 * 兜底解析：用 ## 标题作为阶段，列表项作为知识点
 */
function fallbackParse(content: string): ParsedStage[] {
  const lines = content.split('\n')
  const stages: ParsedStage[] = []
  let currentStage: ParsedStage | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    const h2Match = trimmed.match(/^##\s+(.+)/)
    if (h2Match && !h2Match[1].includes('注意') && !h2Match[1].includes('总结')) {
      currentStage = {
        title: h2Match[1].replace(/[📚🎓🎯]/g, '').trim(),
        items: [],
        videos: []
      }
      stages.push(currentStage)
      continue
    }

    if (currentStage) {
      const itemMatch = trimmed.match(/^[-*+]\s+(.+)/)
      if (itemMatch) {
        let itemTitle = itemMatch[1]
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim()

        if (!itemTitle.includes('🎬') && !itemTitle.includes('UP:') && !itemTitle.includes('播放')) {
          currentStage.items.push({ title: itemTitle, videos: [] })
        }
      }

      // 视频链接
      const video = parseVideoLine(trimmed)
      if (video) {
        currentStage.videos.push(video)
        if (currentStage.items.length > 0) {
          currentStage.items[currentStage.items.length - 1].videos.push(video)
        }
      }
    }
  }

  return stages
}
