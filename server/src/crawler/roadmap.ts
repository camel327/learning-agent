// 阶段 1：学习路线搜索（知乎 + 必应）
// TODO: P3 实现

export interface RoadmapSearchResult {
  title: string
  snippet: string
  source: string
  url: string
}

/**
 * 搜索多个平台的学习路线
 */
export async function searchRoadmap(topic: string): Promise<RoadmapSearchResult[]> {
  const keyword = `${topic} 学习路线`

  const results = await Promise.allSettled([
    searchZhihu(keyword),
    searchBing(keyword),
  ])

  return results
    .filter((r): r is PromiseFulfilledResult<RoadmapSearchResult[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
}

/**
 * 知乎搜索
 */
async function searchZhihu(keyword: string): Promise<RoadmapSearchResult[]> {
  // TODO: P3 实现
  return []
}

/**
 * 必应搜索（国内版）
 */
async function searchBing(keyword: string): Promise<RoadmapSearchResult[]> {
  // TODO: P3 实现
  return []
}
