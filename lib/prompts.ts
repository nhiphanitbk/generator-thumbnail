/**
 * Centralized prompt definitions for all AI operations.
 * Edit this file to tune generation quality, rules, and behavior.
 */

// ─── Shared constraint blocks ─────────────────────────────────────────────────

/** Hard rules injected into every generation prompt to prevent unwanted changes */
export const GENERATION_HARD_RULES = `
HARD RULES (never violate — these preserve identity and consistency):
- Reproduce background scene and environment EXACTLY as described
- Reproduce lighting direction and color temperature EXACTLY as described
- Reproduce overall spatial layout (subject position, text zones, negative space) EXACTLY
- Reproduce clothing and accessories color/style EXACTLY unless user explicitly says to change them
- If face replacement requested: swap ONLY the face identity; body/clothing/pose remain identical
- Do NOT add new people, objects, or background elements not described in the scene
`.trim()

/** Soft rules — where user customisation is applied */
export const GENERATION_SOFT_RULES = `
SOFT RULES (apply user instructions here only):
- Integrate user assets naturally into the preserved composition
- Apply any style/color/mood/text changes the user explicitly requested
`.trim()

/** Standard quality tail appended to every generation prompt */
export const GENERATION_QUALITY_TAIL =
  'professional YouTube thumbnail, 16:9 aspect ratio, 1280x720 pixels, photorealistic, sharp focus, vibrant high-contrast colors, high detail, no watermarks, no borders'

/** Hard rules for polish/enhance operations */
export const POLISH_HARD_RULES = `
HARD RULES (never violate):
- Preserve exact composition and spatial layout of all elements
- Preserve all faces and their identities exactly — do not alter facial features
- Preserve background scene exactly — do not add or remove background elements
- Preserve clothing and accessories exactly
- Do NOT reposition any subjects, objects, or text elements
- Keep the same 16:9 aspect ratio
`.trim()

// ─── Analysis prompt ──────────────────────────────────────────────────────────

export interface AnalysisPromptParams {
  assetList: string
  userInstructions: string
  faceInstruction: string
  hasFaceProfile: boolean
}

export function buildFaceInstruction(hasFaceProfile: boolean, faceProfileNote?: string): string {
  if (!hasFaceProfile) {
    return 'No face profile — keep any existing person as-is, do not change their appearance.'
  }
  return `FACE REPLACEMENT (HARD RULE — mandatory): Replace ONLY the face/person identity with the user's uploaded face profile. ${faceProfileNote ? `Face note: ${faceProfileNote}.` : ''} Preserve clothing color/style, body pose, hair (unless profile shows different), and everything else exactly.`
}

export function buildAnalysisPrompt({
  assetList,
  userInstructions,
  faceInstruction,
  hasFaceProfile,
}: AnalysisPromptParams): string {
  return `
You are a world-class YouTube thumbnail art director and AI image prompt engineer.
Analyze the reference thumbnail and produce a HIGHLY SPECIFIC generation prompt that preserves
the reference's background, lighting, and spatial layout EXACTLY — only applying the user's changes.

━━━ INPUTS ━━━
USER ASSETS: ${assetList}
USER INSTRUCTIONS: ${userInstructions || '(none — preserve reference composition faithfully, only swap face if profile provided)'}
${faceInstruction}

━━━ ANALYSIS TASK ━━━
Carefully extract from the reference image:
1. Exact background scene (indoor/outdoor, specific setting, colors, textures, environment details)
2. Lighting setup (direction, color temperature, intensity, shadow placement)
3. Subject: exact position in frame, body pose, expression, clothing (describe colors and style precisely)
4. Text elements (location on frame, approximate style/color)
5. Color palette — extract dominant + accent colors as hex codes
6. Overall mood and visual style

━━━ GENERATION PROMPT RULES ━━━
${GENERATION_HARD_RULES}

${GENERATION_SOFT_RULES}

Respond with this exact JSON (no markdown fences, no extra text):
{
  "layoutDescription": "precise spatial description: background scene, subject position, text zones, negative space",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "compositionType": "e.g. face-left text-right, centered-dramatic, split-screen",
  "keyElements": ["element with exact position", "element with exact position"],
  "hasPerson": true,
  "suggestedFaceReplacement": ${hasFaceProfile},
  "generationPrompt": "Comprehensive 200-350 word prompt structured as: [BACKGROUND] exact scene with colors and textures — [LIGHTING] direction, color temperature, shadows — [SUBJECT] exact frame position, body pose, clothing colors and fabric style, facial expression — [FACE] face identity instruction if applicable — [ASSETS] how user assets integrate into scene — [TEXT] text elements and placement — [STYLE] overall visual style and quality. End with: '${GENERATION_QUALITY_TAIL}'",
  "negativePrompt": "blurry, low quality, pixelated, watermark, deformed hands, deformed faces, wrong clothing color, changed background scene, different lighting setup, extra limbs",
  "strength": 0.78
}`.trim()
}

export function buildTextOnlyContext(referenceImageUrl: string): string {
  const ytMatch = referenceImageUrl.match(/vi\/([a-zA-Z0-9_-]{11})\//)
  return ytMatch
    ? `Reference: YouTube thumbnail (video ID: ${ytMatch[1]}). Assume a typical high-performing YouTube thumbnail layout with strong visual hierarchy.`
    : `Reference image: ${referenceImageUrl}. Infer a compelling YouTube thumbnail layout.`
}

// ─── Face generation prompt ───────────────────────────────────────────────────

export function buildFaceGenerationPrompt(scenePrompt: string): string {
  return `The image(s) above are FACE REFERENCE PHOTOS showing the person's identity to use.

${GENERATION_HARD_RULES}
- Use ONLY the face identity from the reference photos (skin tone, facial structure, distinguishing features)

Generate this YouTube thumbnail scene:
${scenePrompt}

Final output must be: ${GENERATION_QUALITY_TAIL}`
}

// ─── Variant 2 prompt ─────────────────────────────────────────────────────────

export function buildVariant2Prompt(basePrompt: string): string {
  return `${basePrompt} — For this variant: slightly adjust the subject's facial expression to be more intense/dramatic, and subtly shift the camera angle. Keep background, lighting, clothing, and overall composition identical to the main description.`
}

// ─── Polish prompt ────────────────────────────────────────────────────────────

export function buildPolishGenerationPrompt(scenePrompt: string, userNote?: string): string {
  return `You are enhancing this YouTube thumbnail. Apply ONLY these improvements: ${userNote || 'boost color vibrancy and saturation, improve sharpness and edge definition, enhance dramatic lighting contrast'}

${POLISH_HARD_RULES}

${scenePrompt ? `Additional context: ${scenePrompt}` : ''}

Output: improved version with better visual quality only, everything else identical.`.trim()
}

export function buildPolishAnalysisPrompt(userPolishNote?: string): string {
  return `Generate a polish/enhancement prompt for a YouTube thumbnail image.

${POLISH_HARD_RULES}

SOFT ENHANCEMENTS to apply:
${userPolishNote || 'Boost color vibrancy and saturation, improve sharpness and edge definition, enhance dramatic lighting contrast, make colors more vivid and eye-catching, improve overall professional quality'}

Respond with JSON only (no markdown):
{"prompt": "specific enhancement instructions that improve quality while keeping all elements, faces, positions, and composition completely identical", "creativity": 0.15, "resemblance": 0.92}`
}

// ─── CTR analysis prompt ──────────────────────────────────────────────────────

export const CTR_ANALYSIS_PROMPT = `Analyze this YouTube thumbnail for click-through rate (CTR) potential.
Rate it 1-10 and give concise, specific feedback.
verdict: "Excellent" (9-10), "Good" (7-8), "Average" (5-6), "Weak" (1-4)
Respond with JSON only (no markdown):
{"score":7,"verdict":"Good","strengths":["point 1","point 2"],"improvements":["point 1","point 2"],"tip":"single most impactful change"}`

// ─── Auto-instructions prompt ─────────────────────────────────────────────────

export function buildAutoInstructionsPrompt(
  context: string,
  assetList: string,
  hasFaceProfile: boolean,
): string {
  return `${context}
My assets: ${assetList || 'none'}.
${hasFaceProfile ? "I have a face profile — I want to replace the person's face in the thumbnail." : ''}

Write 2-3 sentences of instructions for how to blend my assets into this composition.
Emphasize: what to preserve unchanged (background, lighting, clothing, layout), what to replace (only the face if requested, or specific elements I asked to swap), and where things should be positioned. Return only the instruction text.`
}

// ─── Asset generation prompt ──────────────────────────────────────────────────

export function buildAssetPrompt(userPrompt: string): string {
  return `${userPrompt}, isolated on white background, product shot style, clean, high detail`
}
