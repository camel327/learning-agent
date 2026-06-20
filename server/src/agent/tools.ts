// Agent 工具定义 + 执行器

import { searchRoadmap } from '../crawler/roadmap.js'
import { searchBilibiliVideos } from '../crawler/bilibili.js'

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_roadmap',
      description: '搜索某个技术的学习路线资料，返回搜索引擎和知乎的搜索结果摘要。用于了解一个技术的学习路径和阶段划分。',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '技术主题，如 "Vue3"、"Python"、"React"' },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_videos',
      description: '搜索B站学习视频，按播放量和互动量排序推荐。用于为某个具体知识点找到优质教学视频。',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词，如 "Vue3 组件 通信教程"' },
          count: { type: 'number', description: '返回数量，默认3', default: 3 },
        },
        required: ['keyword'],
      },
    },
  },
]

/**
 * 执行工具调用
 */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_roadmap': {
      const topic = args.topic as string
      const results = await searchRoadmap(topic)
      return results
    }
    case 'search_videos': {
      const keyword = args.keyword as string
      const count = (args.count as number) || 3
      const results = await searchBilibiliVideos(keyword, count)
      return results
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
