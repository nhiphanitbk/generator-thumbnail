import { NextRequest, NextResponse } from 'next/server'
import { generateAsset } from '@/lib/gemini-image'

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const image = await generateAsset(prompt.trim())

    return NextResponse.json({ url: image.url })
  } catch (error) {
    console.error('Asset generation error:', error)
    const message = error instanceof Error ? error.message : 'Asset generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
