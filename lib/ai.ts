/**
 * AI analysis helpers — powered by Gemini (text + vision).
 */

import { GoogleGenAI, Modality } from '@google/genai'
import type { AnalysisResult } from './types'

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

/** Extract JSON object from a model response that may include prose */
function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Model response did not contain valid JSON')
  return JSON.parse(match[0]) as T
}

function buildTextOnlyContext(referenceImageUrl: string): string {
  const ytMatch = referenceImageUrl.match(/vi\/([a-zA-Z0-9_-]{11})\//)
  return ytMatch
    ? `Reference: YouTube thumbnail (video ID: ${ytMatch[1]}). Assume a typical high-performing YouTube thumbnail layout with strong visual hierarchy.`
    : `Reference image: ${referenceImageUrl}. Infer a compelling YouTube thumbnail layout.`
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function analyzeReferenceAndBuildPrompt({
  referenceImageUrl,
  assetDescriptions,
  userInstructions,
  hasFaceProfile,
  faceProfileNote,
}: {
  referenceImageUrl: string
  assetDescriptions: string[]
  userInstructions: string
  hasFaceProfile: boolean
  faceProfileNote?: string
}): Promise<AnalysisResult> {
  const schema = `USER ASSETS: ${assetDescriptions.length > 0 ? assetDescriptions.join(', ') : 'None'}
USER INSTRUCTIONS: ${userInstructions || 'Use your best judgment to create an eye-catching thumbnail'}
FACE PROFILE: ${hasFaceProfile ? `Yes — ${faceProfileNote || 'Replace any person with the uploaded face'}` : 'No face profile'}

You are an expert YouTube thumbnail designer and AI image generation specialist.
Analyze the reference thumbnail and craft a precise generation prompt.
Respond with this exact JSON (no markdown fences):
{
  "layoutDescription": "layout and element positions",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "compositionType": "e.g. reaction face left + text right",
  "keyElements": ["element1", "element2"],
  "hasPerson": true,
  "suggestedFaceReplacement": ${hasFaceProfile},
  "generationPrompt": "150-300 word Gemini image prompt covering: subject position, expression, clothing, background, lighting (dramatic/bright/cinematic), colors (vivid/high-contrast), 'professional YouTube thumbnail 16:9 1280x720', 'sharp focus professional photography high detail'. Integrate all user assets.",
  "negativePrompt": "blurry, low quality, pixelated, watermark, deformed faces",
  "strength": 0.75
}`

  let text: string

  try {
    text = await generateTextWithImage(referenceImageUrl, `Analyze this reference thumbnail.\n${schema}`)
  } catch {
    // Vision failed (e.g. image fetch failed) — fall back to text-only
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
  const prompt = `Generate a polish/enhancement prompt for a YouTube thumbnail.
User notes: ${userPolishNote || 'Improve overall quality, lighting, and visual appeal'}

Respond with JSON only (no markdown): {"prompt": "enhancement prompt", "creativity": 0.2, "resemblance": 0.85}
creativity: 0.1-0.4, resemblance: 0.7-0.95
Focus: ${userPolishNote || 'sharpness, lighting, color vibrancy, professional look'}`

  const text = await generateText(prompt)

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { prompt: 'professional YouTube thumbnail, sharp, vibrant, high quality', creativity: 0.2, resemblance: 0.85 }
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
  const prompt = `Analyze this YouTube thumbnail for click-through rate (CTR) potential.
Rate it 1-10 and give concise, specific feedback.
verdict: "Excellent" (9-10), "Good" (7-8), "Average" (5-6), "Weak" (1-4)
Respond with JSON only (no markdown):
{"score":7,"verdict":"Good","strengths":["point 1","point 2"],"improvements":["point 1","point 2"],"tip":"single most impactful change"}`

  const text = await generateTextWithImage(imageUrl, prompt)
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
  const userMsg = `${buildTextOnlyContext(referenceImageUrl)}
My assets: ${assetDescriptions.join(', ') || 'none'}.
${hasFaceProfile ? 'I have a face profile to use as replacement.' : ''}

Write 2-3 sentences describing how to blend my assets into this composition.
Be specific: what to replace, keep, and where things go. Return only the instruction text.`

  try {
    return await generateTextWithImage(referenceImageUrl, userMsg)
  } catch {
    return generateText(userMsg)
  }
}
