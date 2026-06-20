// 阶段 1：学习路线搜索（知乎 + 必应）

import * as cheerio from 'cheerio'

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
 * 使用知乎搜索 API 获取学习路线相关文章
 */
async function searchZhihu(keyword: string): Promise<RoadmapSearchResult[]> {
  try {
    const url = `https://www.zhihu.com/api/v4/search_v3?t=general&q=${encodeURIComponent(keyword)}&correction=1&offset=0&limit=5`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.zhihu.com/search',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(`知乎搜索失败: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()

    if (!data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data
      .filter((item: any) => item.type === 'search_result' && item.object)
      .map((item: any) => ({
        title: stripHtml(item.object.title || item.highlight?.title || ''),
        snippet: stripHtml(item.object.excerpt || item.highlight?.content || ''),
        source: '知乎',
        url: item.object.url ? `https://www.zhihu.com/question/${item.object.id}` : '',
      }))
      .filter((item: RoadmapSearchResult) => item.title && item.snippet)
  } catch (err) {
    console.error('知乎搜索异常:', err)
    return []
  }
}

/**
 * 必应搜索（国内版）
 * 抓取搜索结果页面
 */
async function searchBing(keyword: string): Promise<RoadmapSearchResult[]> {
  try {
    const url = `https://cn.bing.com/search?q=${encodeURIComponent(keyword)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })

    if (!res.ok) {
      console.error(`必应搜索失败: HTTP ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const results: RoadmapSearchResult[] = []

    $('#b_results .b_algo').slice(0, 5).each((_, el) => {
      const title = $(el).find('h2 a').text().trim()
      const snippet = $(el).find('.b_caption p').text().trim()
      const href = $(el).find('h2 a').attr('href') || ''

      if (title && snippet) {
        results.push({
          title,
          snippet,
          source: '必应',
          url: href,
        })
      }
    })

    return results
  } catch (err) {
    console.error('必应搜索异常:', err)
    return []
  }
}

/**
 * 去除 HTML 标签
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
