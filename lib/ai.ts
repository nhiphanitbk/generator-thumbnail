/**
 * AI analysis helpers — powered by Gemini (text + vision).
 */

import { GoogleGenAI, Modality } from '@google/genai'
import type { AnalysisResult } from './types'
import {
  buildFaceInstruction,
  buildAnalysisPrompt,
  buildTextOnlyContext,
  buildPolishAnalysisPrompt,
  buildAutoInstructionsPrompt,
  CTR_ANALYSIS_PROMPT,
} from './prompts'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const TEXT_MODEL = 'gemini-2.5-flash'

// ─── Core helpers ─────────────────────────────────────────────────────────────

/** Fetch a remote URL or parse a data URL into inline Gemini part */
async function urlToInlinePart(url: string) {
  if (url.startsWith('data:')) {
    const [meta, data] = url.split(',')
    const mimeType = (meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg') as string
    return { inlineData: { data, mimeType } }
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const data = Buffer.from(buffer).toString('base64')
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg'
  return { inlineData: { data, mimeType } }
}

/** Call Gemini with text-only input, return response text */
async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: [Modality.TEXT] },
  })
  return response.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('') ?? ''
}

/** Call Gemini with image + text input, return response text */
async function generateTextWithImage(imageUrl: string, prompt: string): Promise<string> {
  const imagePart = await urlToInlinePart(imageUrl)
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
    config: { responseModalities: [Modality.TEXT] },
  })
  return response.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('') ?? ''
}

/**
 * Call Gemini with multiple images + text input, return response text.
 * Images are passed in order: [referenceImage, ...assetImages]
 * so the model sees them as visual context before reading the prompt.
 */
async function generateTextWithImages(imageUrls: string[], prompt: string): Promise<string> {
  const imageParts = await Promise.all(imageUrls.map(urlToInlinePart))
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ role: 'user', parts: [...imageParts, { text: prompt }] }],
    config: { responseModalities: [Modality.TEXT] },
  })
  return response.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('') ?? ''
}

/** Extract JSON object from a model response that may include prose */
function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Model response did not contain valid JSON')
  return JSON.parse(match[0]) as T
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function analyzeReferenceAndBuildPrompt({
  referenceImageUrl,
  assetImageUrls,
  assetDescriptions,
  userInstructions,
  hasFaceProfile,
  faceProfileNote,
}: {
  referenceImageUrl: string
  assetImageUrls?: string[]
  assetDescriptions: string[]
  userInstructions: string
  hasFaceProfile: boolean
  faceProfileNote?: string
}): Promise<AnalysisResult> {
  const assetList = assetDescriptions.length > 0 ? assetDescriptions.join(', ') : 'None'
  const faceInstruction = buildFaceInstruction(hasFaceProfile, faceProfileNote)
  const schema = buildAnalysisPrompt({
    assetList,
    assetCount: assetImageUrls?.length ?? 0,
    userInstructions,
    faceInstruction,
    hasFaceProfile,
  })

  // Build ordered image list: [reference, ...assets (max 3)]
  const allImageUrls = [
    referenceImageUrl,
    ...(assetImageUrls ?? []).slice(0, 3),
  ]

  let text: string
  try {
    text = await generateTextWithImages(
      allImageUrls,
      `Analyze these images — the first is the reference YouTube thumbnail, the rest are user assets to integrate.\n${schema}`
    )
  } catch {
    // Vision failed — fall back to text-only
    text = await generateText(`${buildTextOnlyContext(referenceImageUrl)}\n${schema}`)
  }

  return extractJson<AnalysisResult>(text)
}

export async function generatePolishPrompt({
  userPolishNote,
}: {
  imageUrl?: string
  userPolishNote?: string
}): Promise<{ prompt: string; creativity: number; resemblance: number }> {
  const text = await generateText(buildPolishAnalysisPrompt(userPolishNote))

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return {
    prompt: 'Enhance sharpness, boost color vibrancy and saturation, improve lighting contrast. Keep all faces, positions, and background identical.',
    creativity: 0.15,
    resemblance: 0.92,
  }
  return JSON.parse(match[0])
}

// ─── CTR Analysis ─────────────────────────────────────────────────────────────

export interface CTRAnalysis {
  score: number
  verdict: 'Excellent' | 'Good' | 'Average' | 'Weak'
  strengths: string[]
  improvements: string[]
  tip: string
}

export async function analyzeThumbnailCTR(imageUrl: string): Promise<CTRAnalysis> {
  const text = await generateTextWithImage(imageUrl, CTR_ANALYSIS_PROMPT)
  return extractJson<CTRAnalysis>(text)
}

// ─────────────────────────────────────────────────────────────────────────────

export async function generateAutoInstructions({
  referenceImageUrl,
  assetDescriptions,
  hasFaceProfile,
}: {
  referenceImageUrl: string
  assetDescriptions: string[]
  hasFaceProfile: boolean
}): Promise<string> {
  const context = buildTextOnlyContext(referenceImageUrl)
  const assetList = assetDescriptions.join(', ')
  const userMsg = buildAutoInstructionsPrompt(context, assetList, hasFaceProfile)

  try {
    return await generateTextWithImage(referenceImageUrl, userMsg)
  } catch {
    return generateText(userMsg)
  }
}
