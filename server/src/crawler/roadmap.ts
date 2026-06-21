// 阶段 1：学习路线搜索（知乎 + 必应）

import * as cheerio from 'cheerio'

export interface RoadmapSearchResult {
  title: string
  snippet: string
  source: string
  url: string
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 搜索多个平台的学习路线
 */
export async function searchRoadmap(topic: string): Promise<RoadmapSearchResult[]> {
  const keyword = `${topic} 学习路线`

  const results = await Promise.allSettled([
    searchZhihu(keyword),
    searchBing(keyword),
  ])

  const all = results
    .filter((r): r is PromiseFulfilledResult<RoadmapSearchResult[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  console.log(`[Roadmap] 搜索 "${keyword}" 共 ${all.length} 条结果`)
  return all
}

/**
 * 知乎搜索 — 抓取网页搜索结果
 */
async function searchZhihu(keyword: string): Promise<RoadmapSearchResult[]> {
  try {
    const url = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(keyword)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': '',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      console.error(`知乎搜索失败: HTTP ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const results: RoadmapSearchResult[] = []

    // 知乎搜索结果的常见结构
    $('.SearchResult-Card, .List-item').slice(0, 5).each((_, el) => {
      const titleEl = $(el).find('h2 a, .ContentItem-title a').first()
      const title = titleEl.text().trim()
      const href = titleEl.attr('href') || ''
      const snippet = $(el).find('.RichContent-inner, .content, p').first().text().trim().slice(0, 200)

      if (title && snippet) {
        const fullUrl = href.startsWith('http') ? href : `https://www.zhihu.com${href}`
        results.push({
          title,
          snippet,
          source: '知乎',
          url: fullUrl,
        })
      }
    })

    // 如果网页抓取没结果，尝试用搜索引擎搜知乎内容
    if (results.length === 0) {
      return await searchViaBing(`site:zhihu.com ${keyword}`)
    }

    return results
  } catch (err) {
    console.error('知乎搜索异常:', err)
    // fallback: 用必应搜知乎内容
    return await searchViaBing(`site:zhihu.com ${keyword}`)
  }
}

/**
 * 必应搜索（国内版）
 */
async function searchBing(keyword: string): Promise<RoadmapSearchResult[]> {
  return searchViaBing(keyword)
}

async function searchViaBing(keyword: string): Promise<RoadmapSearchResult[]> {
  try {
    const url = `https://cn.bing.com/search?q=${encodeURIComponent(keyword)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
