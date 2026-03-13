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

    // Cascade from highest to lowest resolution
    // maxresdefault (1280×720) → sddefault (640×480) → hqdefault (480×360)
    const candidates = [urls.maxres, urls.sd, urls.hq]
    let thumbnailUrl = urls.hq // safe fallback — always exists
    for (const candidate of candidates) {
      try {
        const res = await fetch(candidate, { method: 'HEAD' })
        if (res.ok) { thumbnailUrl = candidate; break }
      } catch {
        // try next
      }
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
