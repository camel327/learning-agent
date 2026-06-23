// 学习路线 Markdown 解析器
// 将 AI 生成的 markdown 解析为结构化的 stages + items

export interface ParsedStage {
  title: string
  items: { title: string }[]
}

/**
 * 解析 AI 生成的学习路线 markdown，提取阶段和知识点
 *
 * 支持的格式：
 * ### 阶段 1：基础入门（预计 7 天）
 * **知识点：**
 * - HTML/CSS 基础
 * - JavaScript 基础
 */
export function parsePlanMarkdown(content: string): ParsedStage[] {
  const lines = content.split('\n')
  const stages: ParsedStage[] = []
  let currentStage: ParsedStage | null = null
  let inKnowledgeSection = false
  let inVideoSection = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 检测阶段标题：### 阶段 或 ## 阶段
    const stageMatch = trimmed.match(/^#{2,3}\s+阶段\s*\d*[：:]\s*(.+)/)
    if (stageMatch) {
      currentStage = {
        title: stageMatch[1].replace(/[（(].*?[）)]/, '').trim(),
        items: []
      }
      stages.push(currentStage)
      inKnowledgeSection = false
      inVideoSection = false
      continue
    }

    // 检测知识点区域
    if (currentStage && (trimmed.includes('知识点') || trimmed.includes('学习内容') || trimmed.includes('核心内容'))) {
      inKnowledgeSection = true
      inVideoSection = false
      continue
    }

    // 检测视频推荐区域（跳过）
    if (trimmed.includes('推荐视频') || trimmed.includes('视频推荐') || trimmed.includes('学习资源')) {
      inKnowledgeSection = false
      inVideoSection = true
      continue
    }

    // 检测其他标题区域（重置状态）
    if (trimmed.match(/^#{1,3}\s/) && !stageMatch) {
      if (!trimmed.includes('知识点') && !trimmed.includes('视频')) {
        inKnowledgeSection = false
        inVideoSection = false
      }
    }

    // 在知识点区域中，提取列表项
    if (currentStage && inKnowledgeSection && !inVideoSection) {
      const itemMatch = trimmed.match(/^[-*+]\s+(.+)/)
      if (itemMatch) {
        // 清理 markdown 格式
        let itemTitle = itemMatch[1]
          .replace(/\*\*/g, '')     // 去掉加粗
          .replace(/`/g, '')        // 去掉代码标记
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接只保留文字
          .trim()

        // 过滤掉视频相关条目
        if (!itemTitle.includes('🎬') && !itemTitle.includes('UP:') && !itemTitle.includes('播放')) {
          currentStage.items.push({ title: itemTitle })
        }
      }
    }
  }

  // 如果没有解析到阶段，尝试用二级标题作为阶段
  if (stages.length === 0) {
    return fallbackParse(content)
  }

  return stages
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

    // 二级标题作为阶段
    const h2Match = trimmed.match(/^##\s+(.+)/)
    if (h2Match && !h2Match[1].includes('注意') && !h2Match[1].includes('总结')) {
      currentStage = {
        title: h2Match[1].replace(/[📚🎓🎯]/g, '').trim(),
        items: []
      }
      stages.push(currentStage)
      continue
    }

    // 列表项作为知识点
    if (currentStage) {
      const itemMatch = trimmed.match(/^[-*+]\s+(.+)/)
      if (itemMatch) {
        let itemTitle = itemMatch[1]
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim()

        if (!itemTitle.includes('🎬') && !itemTitle.includes('UP:') && !itemTitle.includes('播放')) {
          currentStage.items.push({ title: itemTitle })
        }
      }
    }
  }

  return stages
}
