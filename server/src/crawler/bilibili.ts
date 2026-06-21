// 阶段 2：B站视频搜索 + 评分排序

export interface VideoResult {
  title: string
  bvid: string
  url: string
  author: string
  playCount: number
  danmakuCount: number
  reviewCount: number
  duration: string
  cover: string
  pubDate: number
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 综合评分：播放量 0.5 + 弹幕 0.3 + 评论 0.2
 */
function scoreVideo(video: VideoResult): number {
  return (
    video.playCount * 0.5 +
    video.danmakuCount * 0.3 +
    video.reviewCount * 0.2
  )
}

/**
 * B站播放量格式转换
 */
function parsePlayCount(play: string | number): number {
  if (typeof play === 'number') return play
  const str = play.toString().trim()
  if (!str || str === '-') return 0
  if (str.includes('亿')) return parseFloat(str) * 100000000
  if (str.includes('万')) return parseFloat(str) * 10000
  return parseInt(str) || 0
}

/**
 * 获取 B站 Cookie（用于绕过 412 反爬）
 */
async function getBilibiliCookie(): Promise<string> {
  try {
    const res = await fetch('https://www.bilibili.com/', {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
    })
    const cookies = res.headers.getSetCookie?.() || []
    return cookies.map(c => c.split(';')[0]).join('; ')
  } catch {
    return ''
  }
}

/**
 * 搜索 B站视频，按综合评分排序
 */
export async function searchBilibiliVideos(
  keyword: string,
  count: number = 5
): Promise<VideoResult[]> {
  try {
    // 先获取 cookie 绕过 412
    const cookie = await getBilibiliCookie()

    const apiUrl = 'https://api.bilibili.com/x/web-interface/search/type'
    const params = new URLSearchParams({
      search_type: 'video',
      keyword,
      page: '1',
      page_size: String(Math.max(count * 2, 10)),
      order: 'totalrank',
    })

    const res = await fetch(`${apiUrl}?${params}`, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://search.bilibili.com',
        'Accept': 'application/json',
        'Cookie': cookie,
      },
    })

    if (!res.ok) {
      console.error(`B站搜索失败: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()

    if (!data.data?.result || !Array.isArray(data.data.result)) {
      console.error('B站搜索返回异常:', data.message || '无结果')
      return []
    }

    const videos: VideoResult[] = data.data.result
      .filter((item: any) => item.bvid && item.title)
      .map((item: any) => ({
        title: stripHtml(item.title),
        bvid: item.bvid,
        url: `https://www.bilibili.com/video/${item.bvid}`,
        author: item.author || '未知',
        playCount: parsePlayCount(item.play),
        danmakuCount: item.video_review || 0,
        reviewCount: item.review || 0,
        duration: item.duration || '',
        cover: item.pic ? `https:${item.pic}` : '',
        pubDate: item.pubdate || 0,
      }))

    videos.sort((a, b) => scoreVideo(b) - scoreVideo(a))

    console.log(`[B站] 搜索 "${keyword}" 返回 ${videos.length} 条视频`)
    return videos.slice(0, count)
  } catch (err) {
    console.error('B站搜索异常:', err)
    return []
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}
