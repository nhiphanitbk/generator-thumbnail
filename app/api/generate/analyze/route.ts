import { NextRequest, NextResponse } from 'next/server'
import { analyzeReferenceAndBuildPrompt, generateAutoInstructions } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const {
      referenceImageUrl,
      assetDescriptions,
      userInstructions,
      hasFaceProfile,
      faceProfileNote,
      autoInstructions,
    } = await req.json()

    if (!referenceImageUrl) {
      return NextResponse.json({ error: 'Reference image URL is required' }, { status: 400 })
    }

    if (autoInstructions) {
      // Just generate suggested instructions, don't do full analysis
      const instructions = await generateAutoInstructions({
        referenceImageUrl,
        assetDescriptions: assetDescriptions ?? [],
        hasFaceProfile: hasFaceProfile ?? false,
      })
      return NextResponse.json({ instructions })
    }

    const analysis = await analyzeReferenceAndBuildPrompt({
      referenceImageUrl,
      assetDescriptions: assetDescriptions ?? [],
      userInstructions: userInstructions ?? '',
      hasFaceProfile: hasFaceProfile ?? false,
      faceProfileNote,
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
