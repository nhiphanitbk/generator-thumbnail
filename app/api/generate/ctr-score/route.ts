import { NextRequest, NextResponse } from 'next/server'
import { analyzeThumbnailCTR } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })
    const analysis = await analyzeThumbnailCTR(imageUrl)
    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CTR analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
