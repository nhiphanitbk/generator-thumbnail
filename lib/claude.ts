import type { AnalysisResult } from "./types";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface ClaudeMessage {
  content: Array<{ type: string; text?: string }>;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
// Uses ANTHROPIC_API_KEY (direct) if set, otherwise falls back to proxy

function getEndpointAndHeaders(): { url: string; headers: Record<string, string> } {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    };
  }

  const proxyBase = process.env.PROXY_BASE!;
  const proxyKey = process.env.PROXY_KEY!;
  return {
    url: `${proxyBase}/messages`,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": proxyKey,
      "anthropic-version": "2023-06-01",
    },
  };
}

async function post(body: Record<string, unknown>): Promise<ClaudeMessage> {
  const { url, headers } = getEndpointAndHeaders();
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Claude API error ${res.status}: ${msg}`);
  }

  return res.json() as Promise<ClaudeMessage>;
}

async function callClaude(
  model: string,
  maxTokens: number,
  system: string | undefined,
  userContent: unknown
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userContent }],
  };
  if (system) body.system = system;

  const response = await post(body);
  return response.content[0]?.type === "text"
    ? (response.content[0].text ?? "")
    : "";
}

// ─── Image helpers ────────────────────────────────────────────────────────────

async function tryImageUrlToBase64(
  url: string
): Promise<{ data: string; media_type: MediaType } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const media_type: MediaType = ct.includes("png")
      ? "image/png"
      : ct.includes("gif")
        ? "image/gif"
        : ct.includes("webp")
          ? "image/webp"
          : "image/jpeg";
    return { data, media_type };
  } catch {
    return null;
  }
}

function buildTextOnlyContext(referenceImageUrl: string): string {
  const ytMatch = referenceImageUrl.match(/vi\/([a-zA-Z0-9_-]{11})\//);
  return ytMatch
    ? `Reference: YouTube thumbnail (video ID: ${ytMatch[1]}). Assume a typical high-performing YouTube thumbnail layout with strong visual hierarchy.`
    : `Reference image: ${referenceImageUrl}. Infer a compelling YouTube thumbnail layout.`;
}

// ─── Exported functions ───────────────────────────────────────────────────────

export async function analyzeReferenceAndBuildPrompt({
  referenceImageUrl,
  assetDescriptions,
  userInstructions,
  hasFaceProfile,
  faceProfileNote,
}: {
  referenceImageUrl: string;
  assetDescriptions: string[];
  userInstructions: string;
  hasFaceProfile: boolean;
  faceProfileNote?: string;
}): Promise<AnalysisResult> {
  const system = `You are an expert YouTube thumbnail designer and AI image generation specialist.
Analyze reference thumbnails and craft precise generation prompts that produce stunning, click-worthy results.
Always respond with valid JSON matching the exact schema requested.`;

  const schema = `
USER ASSETS: ${assetDescriptions.length > 0 ? assetDescriptions.join(", ") : "None"}
USER INSTRUCTIONS: ${userInstructions || "Use your best judgment to create an eye-catching thumbnail"}
FACE PROFILE: ${hasFaceProfile ? `Yes — ${faceProfileNote || "Replace any person with the uploaded face"}` : "No face profile"}

Respond with this exact JSON (no markdown fences):
{
  "layoutDescription": "layout and element positions",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "compositionType": "e.g. reaction face left + text right",
  "keyElements": ["element1", "element2"],
  "hasPerson": true,
  "suggestedFaceReplacement": ${hasFaceProfile},
  "generationPrompt": "150-300 word FLUX prompt covering: subject position, expression, clothing, background, lighting (dramatic/bright/cinematic), colors (vivid/high-contrast), 'professional YouTube thumbnail 16:9 1280x720', 'sharp focus professional photography high detail'. Integrate all user assets.",
  "negativePrompt": "blurry, low quality, pixelated, watermark, deformed faces",
  "strength": 0.75
}`;

  const imageSource = await tryImageUrlToBase64(referenceImageUrl);

  let text: string;

  if (imageSource) {
    try {
      // Attempt vision call
      text = await callClaude("claude-opus-4-5-20251101", 1024, system, [
        {
          type: "image",
          source: { type: "base64", media_type: imageSource.media_type, data: imageSource.data },
        },
        { type: "text", text: `Analyze this reference thumbnail.\n${schema}` },
      ]);
    } catch {
      // Vision unsupported — fall back to text-only with context hint
      text = await callClaude(
        "claude-opus-4-5-20251101",
        1024,
        system,
        `${buildTextOnlyContext(referenceImageUrl)}\n${schema}`
      );
    }
  } else {
    text = await callClaude(
      "claude-opus-4-5-20251101",
      1024,
      system,
      `${buildTextOnlyContext(referenceImageUrl)}\n${schema}`
    );
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude response did not contain valid JSON");

  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}

export async function generatePolishPrompt({
  userPolishNote,
}: {
  imageUrl?: string;
  userPolishNote?: string;
}): Promise<{ prompt: string; creativity: number; resemblance: number }> {
  const text = await callClaude(
    "claude-haiku-4-5-20251001",
    256,
    undefined,
    `Generate a polish/enhancement prompt for a YouTube thumbnail.
User notes: ${userPolishNote || "Improve overall quality, lighting, and visual appeal"}

Respond with JSON only (no markdown): {"prompt": "enhancement prompt", "creativity": 0.2, "resemblance": 0.85}
creativity: 0.1-0.4, resemblance: 0.7-0.95
Focus: ${userPolishNote || "sharpness, lighting, color vibrancy, professional look"}`
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch)
    return { prompt: "professional YouTube thumbnail, sharp, vibrant, high quality", creativity: 0.2, resemblance: 0.85 };

  return JSON.parse(jsonMatch[0]);
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
  const imageSource = await tryImageUrlToBase64(imageUrl)
  if (!imageSource) throw new Error('Could not load image for CTR analysis')

  const prompt = `Analyze this YouTube thumbnail for click-through rate (CTR) potential.
Rate it 1-10 and give concise, specific feedback.
verdict: "Excellent" (9-10), "Good" (7-8), "Average" (5-6), "Weak" (1-4)
Respond with JSON only (no markdown):
{"score":7,"verdict":"Good","strengths":["point 1","point 2"],"improvements":["point 1","point 2"],"tip":"single most impactful change"}`

  const text = await callClaude('claude-haiku-4-5-20251001', 512, undefined, [
    { type: 'image', source: { type: 'base64', media_type: imageSource.media_type, data: imageSource.data } },
    { type: 'text', text: prompt },
  ])

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid CTR response')
  return JSON.parse(match[0]) as CTRAnalysis
}

// ─────────────────────────────────────────────────────────────────────────────

export async function generateAutoInstructions({
  referenceImageUrl,
  assetDescriptions,
  hasFaceProfile,
}: {
  referenceImageUrl: string;
  assetDescriptions: string[];
  hasFaceProfile: boolean;
}): Promise<string> {
  const userMsg = `${buildTextOnlyContext(referenceImageUrl)}
My assets: ${assetDescriptions.join(", ") || "none"}.
${hasFaceProfile ? "I have a face profile to use as replacement." : ""}

Write 2-3 sentences describing how to blend my assets into this composition.
Be specific: what to replace, keep, and where things go. Return only the instruction text.`;

  const imageSource = await tryImageUrlToBase64(referenceImageUrl);

  if (imageSource) {
    try {
      return await callClaude("claude-haiku-4-5-20251001", 256, undefined, [
        {
          type: "image",
          source: { type: "base64", media_type: imageSource.media_type, data: imageSource.data },
        },
        { type: "text", text: userMsg },
      ]);
    } catch {
      // fall through
    }
  }

  return callClaude("claude-haiku-4-5-20251001", 256, undefined, userMsg);
}
