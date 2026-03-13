import { GoogleGenAI, Modality } from "@google/genai";
import { buildFaceGenerationPrompt, buildPolishGenerationPrompt, buildAssetPrompt } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-3-pro-image-preview";

export interface GeneratedImage {
  url: string; // data URL (data:image/...;base64,...)
  width: number;
  height: number;
}

// ─── Helper: fetch remote URL → inline data part ──────────────────────────────
async function urlToInlinePart(url: string) {
  if (url.startsWith("data:")) {
    const [meta, data] = url.split(",");
    const mimeType = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    return { inlineData: { data, mimeType } };
  }
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  return { inlineData: { data, mimeType } };
}

// ─── Helper: extract image from response ─────────────────────────────────────
function extractImage(
  response: Awaited<ReturnType<typeof ai.models.generateContent>>,
  width: number,
  height: number,
): GeneratedImage {
  const part = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData,
  );
  if (!part?.inlineData) throw new Error("No image in Gemini response");
  const { data, mimeType } = part.inlineData;
  return { url: `data:${mimeType};base64,${data}`, width, height };
}

// ─── Generate thumbnail at 16:9 (1280×720) ───────────────────────────────────
export async function generateThumbnailVariant(input: {
  prompt: string;
  referenceImageUrl?: string;
  assetImageUrls?: string[];
  seed?: number;
}): Promise<GeneratedImage> {
  // Build image parts: reference composition first, then user assets
  const imageParts: Awaited<ReturnType<typeof urlToInlinePart>>[] = []

  if (input.referenceImageUrl) {
    try {
      imageParts.push(await urlToInlinePart(input.referenceImageUrl))
    } catch {
      // If reference fetch fails, proceed without it
    }
  }

  if (input.assetImageUrls?.length) {
    const assetParts = await Promise.allSettled(
      input.assetImageUrls.slice(0, 3).map(urlToInlinePart)
    )
    assetParts.forEach((r) => {
      if (r.status === "fulfilled") imageParts.push(r.value)
    })
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          ...imageParts,
          { text: input.prompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
    },
  });
  return extractImage(response, 1280, 720);
}

// ─── Generate with face identity using reference images ───────────────────────
export async function generateWithFace(input: {
  prompt: string;
  faceImageUrls: string[];
  referenceImageUrl?: string;
  assetImageUrls?: string[];
  seed?: number;
}): Promise<GeneratedImage> {
  // Order: reference composition → user assets → face photos
  const imageParts: Awaited<ReturnType<typeof urlToInlinePart>>[] = []

  if (input.referenceImageUrl) {
    try {
      imageParts.push(await urlToInlinePart(input.referenceImageUrl))
    } catch {
      // If reference fetch fails, proceed without it
    }
  }

  if (input.assetImageUrls?.length) {
    const assetParts = await Promise.allSettled(
      input.assetImageUrls.slice(0, 3).map(urlToInlinePart)
    )
    assetParts.forEach((r) => {
      if (r.status === "fulfilled") imageParts.push(r.value)
    })
  }

  const faceParts = await Promise.all(
    input.faceImageUrls.slice(0, 3).map(urlToInlinePart),
  )
  imageParts.push(...faceParts)

  const facePrompt = buildFaceGenerationPrompt(input.prompt)

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          ...imageParts,
          { text: facePrompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
    },
  });
  return extractImage(response, 1280, 720);
}

// ─── Polish / enhance existing image ─────────────────────────────────────────
export async function polishThumbnail(input: {
  imageUrl: string;
  prompt: string;
}): Promise<GeneratedImage> {
  const imagePart = await urlToInlinePart(input.imageUrl);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          imagePart,
          {
            text: buildPolishGenerationPrompt(input.prompt),
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
    },
  });
  return extractImage(response, 1280, 720);
}

// ─── Generate standalone asset (square) ──────────────────────────────────────
export async function generateAsset(prompt: string): Promise<GeneratedImage> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildAssetPrompt(prompt),
          },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
    },
  });
  return extractImage(response, 1024, 1024);
}
