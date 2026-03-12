import { NextRequest, NextResponse } from 'next/server'
import { extractYouTubeVideoId, getYouTubeThumbnailUrls } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const videoId = extractYouTubeVideoId(url.trim())
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const urls = getYouTubeThumbnailUrls(videoId)

    // Try maxresdefault first
    let thumbnailUrl = urls.hq // fallback
    try {
      const res = await fetch(urls.maxres, { method: 'HEAD' })
      if (res.ok) thumbnailUrl = urls.maxres
    } catch {
      // fall through to hq
    }

    // Try to get title via oEmbed (no API key needed)
    let title: string | undefined
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { next: { revalidate: 3600 } }
      )
      if (oembedRes.ok) {
        const data = await oembedRes.json()
        title = data.title
      }
    } catch {
      // title is optional
    }

    return NextResponse.json({ videoId, thumbnailUrl, title })
  } catch (error) {
    console.error('YouTube extract error:', error)
    return NextResponse.json({ error: 'Failed to extract YouTube thumbnail' }, { status: 500 })
  }
}
