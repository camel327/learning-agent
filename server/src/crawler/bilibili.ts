// 阶段 2：B站视频搜索 + 评分排序
// TODO: P3 实现

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
 * 搜索 B站视频，按综合评分排序
 */
export async function searchBilibiliVideos(
  keyword: string,
  count: number = 5
): Promise<VideoResult[]> {
  // TODO: P3 实现
  return []
}
