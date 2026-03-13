import { NextRequest, NextResponse } from 'next/server'
import { generateThumbnailVariant, generateWithFace } from '@/lib/gemini-image'
import type { AnalysisResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const {
      analysis,
      faceImageUrls,
      referenceImageUrl,
      assetImageUrls,
      variantIndex,
    }: {
      analysis: AnalysisResult
      faceImageUrls?: string[]
      referenceImageUrl?: string
      assetImageUrls?: string[]
      variantIndex: 0 | 1
    } = await req.json()

    if (!analysis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let imageUrl: string

    if (faceImageUrls && faceImageUrls.length > 0 && analysis.suggestedFaceReplacement) {
      const image = await generateWithFace({
        prompt: analysis.generationPrompt,
        faceImageUrls,
        referenceImageUrl,
        assetImageUrls,
      })
      imageUrl = image.url
    } else {
      const prompt = variantIndex === 0
        ? analysis.generationPrompt
        : `${analysis.generationPrompt} — For this variant: slightly adjust the subject's facial expression to be more intense/dramatic, and subtly shift the camera angle. Keep background, lighting, clothing, and overall composition identical to the main description.`

      const image = await generateThumbnailVariant({
        prompt,
        referenceImageUrl,
        assetImageUrls,
      })
      imageUrl = image.url
    }

    return NextResponse.json({ url: imageUrl, variantIndex })
  } catch (error) {
    console.error('Generation error:', error)
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
