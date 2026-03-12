import { extractYouTubeVideoId, getYouTubeThumbnailUrls } from './utils'

export interface YouTubeInfo {
  videoId: string
  thumbnailUrl: string
  title?: string
}

export async function fetchYouTubeInfo(url: string): Promise<YouTubeInfo> {
  const videoId = extractYouTubeVideoId(url.trim())
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please enter a valid YouTube video link.')
  }

  const urls = getYouTubeThumbnailUrls(videoId)

  // Try maxresdefault first, fall back to hqdefault
  let thumbnailUrl = urls.maxres
  try {
    const response = await fetch(urls.maxres, { method: 'HEAD' })
    if (!response.ok) {
      thumbnailUrl = urls.hq
    }
  } catch {
    thumbnailUrl = urls.hq
  }

  return { videoId, thumbnailUrl }
}
