import { NextRequest, NextResponse } from 'next/server'
import { polishThumbnail } from '@/lib/gemini-image'
import { generatePolishPrompt } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, userNote }: { imageUrl: string; userNote?: string } = await req.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Get AI polish guidance (prompt only; Gemini doesn't need creativity/resemblance)
    const { prompt } = await generatePolishPrompt({
      imageUrl,
      userPolishNote: userNote,
    })

    const result = await polishThumbnail({ imageUrl, prompt })

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error('Polish error:', error)
    const message = error instanceof Error ? error.message : 'Polish step failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
