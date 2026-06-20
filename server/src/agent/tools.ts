// Agent 工具定义 + 执行器
// TODO: P4 实现

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_roadmap',
      description: '搜索某个技术的学习路线资料，返回搜索引擎和知乎的搜索结果摘要',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '技术主题，如 "Vue3"、"Python"' },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_videos',
      description: '搜索B站学习视频，按播放量和互动量排序推荐',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
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
    case 'search_roadmap':
      // TODO: P3 实现爬虫
      return { message: '爬虫待实现（P3 阶段）' }
    case 'search_videos':
      // TODO: P3 实现爬虫
      return { message: '爬虫待实现（P3 阶段）' }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
