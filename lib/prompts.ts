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
  assetCount: number
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
  assetCount,
  userInstructions,
  faceInstruction,
  hasFaceProfile,
}: AnalysisPromptParams): string {
  const assetImageNote = assetCount > 0
    ? `The ${assetCount} image(s) after the first are the user's asset images — examine each one carefully and describe exactly what it shows (object, color, shape, style) so it can be accurately placed in the scene.`
    : 'No asset images were provided — do not invent any new objects or people.'

  return `
You are a world-class YouTube thumbnail art director, visual strategist, and AI image prompt engineer with 10+ years of experience crafting viral thumbnails for channels with 10M+ subscribers.

Your task is to deeply analyze the reference thumbnail image provided, then construct a photorealistic Gemini image generation prompt that:
1. Reproduces the reference composition, lighting, and background with pixel-level fidelity
2. Naturally integrates the user's uploaded assets into the scene
3. Applies the user's creative instructions as targeted modifications ONLY — not wholesale changes
4. Produces a result that looks like the reference thumbnail, but upgraded with the user's personal brand

━━━ INPUTS ━━━
IMAGE INPUT GUIDE:
Image 1 = reference thumbnail (layout blueprint — analyze this for composition, lighting, background).
${assetImageNote}

USER ASSETS (labels matching the asset images above):
${assetList !== 'None' ? assetList : 'None — do not invent any new objects or people'}

USER CREATIVE INSTRUCTIONS (apply these as surgical changes only — do not deviate from reference otherwise):
${userInstructions || 'None — reproduce the reference composition as faithfully as possible'}

FACE IDENTITY RULE:
${faceInstruction}

━━━ STEP 1 — DEEP VISUAL ANALYSIS ━━━
Examine the reference image meticulously and extract:

BACKGROUND & ENVIRONMENT:
- Precise setting (indoor studio, outdoor location, abstract, digital backdrop — describe exactly)
- All background colors, gradients, textures, and patterns with specific hex codes where possible
- Any background elements (objects, scenery, props) and their exact positions
- Background lighting quality (flat, dramatic, gradient, vignette)

LIGHTING SETUP:
- Primary light source direction (front-left, top-right, rim, etc.)
- Color temperature (warm golden ~3200K, neutral white ~5600K, cool blue ~7000K, colored gels)
- Shadow placement and softness (hard shadows = point light, soft shadows = large diffused source)
- Any secondary fill lights, rim lights, or background lights

SUBJECT(S):
- Exact frame position (left third, centered, right side, full frame, etc.)
- Body pose and framing (close-up face, mid-shot torso, wide full-body)
- Precise clothing description: garment type, color (hex if possible), pattern, fit, visible accessories
- Facial expression and emotion (shocked, excited, smiling, serious, etc.)
- Any props held or interacted with

TEXT & GRAPHIC ELEMENTS:
- Text content, font style (bold/italic/serif/sans), approximate size, and color
- Text position in frame (top-left, bottom-right, overlaid on subject, etc.)
- Any graphic overlays, borders, arrows, emoji, or badges

COLOR PALETTE:
- Dominant background color(s)
- Subject/clothing accent colors
- Text and graphic colors
- Overall mood color (warm/cool/neon/muted)

COMPOSITION TYPE:
- Layout pattern (rule of thirds, centered, split-screen, face-left-text-right, etc.)
- Negative space usage
- Visual hierarchy (what catches the eye first, second, third)

━━━ STEP 2 — GENERATION PROMPT CONSTRUCTION ━━━
Build a 300-450 word image generation prompt structured with these labeled sections:

[SCENE FOUNDATION]
Start with: "Photorealistic YouTube thumbnail, 16:9 aspect ratio, 1280x720 pixels."
Then describe the exact background: colors, textures, setting, all background elements with positions.

[LIGHTING]
Describe the complete lighting rig: primary source direction and color temperature, shadow quality and direction, any secondary lights, overall mood created by the lighting.

[SUBJECT PLACEMENT & POSE]
Exact position in frame, framing (head-and-shoulders / half-body / etc.), body orientation (facing camera / three-quarter / profile), pose details.

[SUBJECT APPEARANCE]
Detailed clothing description with exact colors. Facial expression. Any props or accessories. If face replacement is requested, include the face instruction here.

[ASSET INTEGRATION]
For each user asset: where exactly it appears in the frame, at what scale relative to the subject, how it is lit to match the scene, how it blends naturally (not floating or composited-looking).

[TEXT & GRAPHICS]
Describe all text elements with position, approximate style, and color. Include any graphic overlays.

[STYLE & QUALITY]
End with: "Professional YouTube thumbnail, sharp focus, vibrant high-contrast colors, cinematic color grading, high detail, no watermarks, no borders, no extra people or objects not described above."

━━━ HARD RULES (never violate) ━━━
${GENERATION_HARD_RULES}

━━━ USER CUSTOMISATION ZONE ━━━
${GENERATION_SOFT_RULES}

━━━ OUTPUT FORMAT ━━━
Respond with this exact JSON (no markdown fences, no extra text outside the JSON):
{
  "layoutDescription": "precise 2-3 sentence spatial description covering background, subject position, text zones, and negative space",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "compositionType": "specific layout name e.g. face-left-text-right, centered-dramatic, split-screen-comparison",
  "keyElements": ["element description with exact frame position", "element description with exact frame position", "element description with exact frame position"],
  "hasPerson": true,
  "suggestedFaceReplacement": ${hasFaceProfile},
  "generationPrompt": "Your full 300-450 word prompt using the [SECTION] structure above",
  "negativePrompt": "blurry, low quality, pixelated, watermark, deformed hands, deformed faces, extra fingers, wrong clothing color, changed background, different lighting, extra people, extra objects not described, floating objects, obvious compositing, artificial looking",
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
  return `The images provided above contain:
1. REFERENCE COMPOSITION IMAGE (first image): This is the layout blueprint — preserve its background, lighting, spatial arrangement, clothing, and overall scene EXACTLY.
2. USER ASSET IMAGES (middle images, if any): These are props, products, or graphics to be naturally integrated into the scene at the positions described in the prompt below.
3. FACE REFERENCE PHOTOS (final images): These show the person whose face identity must replace the existing face. Use their exact skin tone, facial structure, eye shape, nose, and distinguishing features. Do NOT blend or average — use this specific person's face.

${GENERATION_HARD_RULES}
- Extract face identity ONLY from the face reference photos (last images)
- Do NOT alter body, clothing, pose, or background based on the face reference photos
- The face reference photos are identity references only — not composition references

Generate this YouTube thumbnail scene exactly as described:
${scenePrompt}

Final output must be: ${GENERATION_QUALITY_TAIL}`
}

// ─── Variant 2 prompt ─────────────────────────────────────────────────────────

export function buildVariant2Prompt(basePrompt: string): string {
  return `${basePrompt} — For this variant: slightly adjust the subject's facial expression to be more intense/dramatic, and subtly shift the camera angle. Keep background, lighting, clothing, and overall composition identical to the main description.`
}

// ─── Polish prompt ────────────────────────────────────────────────────────────

export function buildPolishGenerationPrompt(scenePrompt: string, userNote?: string): string {
  return `You are enhancing the YouTube thumbnail image provided above. This is a REFINEMENT pass — the composition, subjects, faces, and layout are already correct. Your job is ONLY to improve visual quality.

APPLY THESE ENHANCEMENTS:
${userNote || `
- Boost color vibrancy and saturation by 20-30% — make colors more vivid and punchy
- Increase local contrast and micro-detail sharpness (skin pores, fabric texture, hair strands)
- Enhance dramatic lighting: deepen shadows slightly, brighten highlights for more contrast
- Add a subtle cinematic color grade (lift shadows slightly towards cool blue-purple, keep highlights warm)
- Improve overall "pop" — the thumbnail should look like it was shot by a professional photographer
`.trim()}

${POLISH_HARD_RULES}

${scenePrompt ? `Scene context for reference: ${scenePrompt}` : ''}

Output: the same thumbnail with improved visual quality only. Every person, object, text element, and background element must remain in exactly the same position, same size, and same appearance — only quality and color grading should change.`.trim()
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
My uploaded assets: ${assetList || 'none'}.
${hasFaceProfile ? "I have a face profile photo — I want to replace the person's face in the thumbnail with mine." : ''}

Write 3-4 concise sentences of creative instructions for how to adapt this thumbnail with my assets.
Your instructions should cover:
1. What to preserve UNCHANGED (be specific: background color, lighting direction, clothing, layout)
2. What to replace or modify (only face if requested, or specific objects/elements)
3. Where each asset should be positioned in the frame and at what scale
4. Any style or mood adjustments that would improve CTR

Return only the instruction text — no bullet points, no headers, no JSON.`
}

// ─── Asset generation prompt ──────────────────────────────────────────────────

export function buildAssetPrompt(userPrompt: string): string {
  return `${userPrompt}, isolated on white background, product shot style, clean, high detail`
}
