import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export { fal };

export interface GenerateThumbnailInput {
  prompt: string;
  seed?: number;
}

export interface FaceIntegrationInput {
  prompt: string;
  faceImageUrls: string[];
  seed?: number;
}

export interface PolishInput {
  imageUrl: string;
  prompt: string;
  creativity: number;
  resemblance: number;
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

// ─── Upload image URL or base64 to fal storage ───────────────────────────────
export async function uploadImageToFal(
  imageDataOrUrl: string,
): Promise<string> {
  // If it's already a remote URL (not base64), return as-is
  if (
    imageDataOrUrl.startsWith("http://") ||
    imageDataOrUrl.startsWith("https://")
  ) {
    return imageDataOrUrl;
  }

  // Convert base64 to blob and upload
  const [meta, data] = imageDataOrUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(data, "base64");
  const blob = new Blob([bytes], { type: mime });
  const file = new File([blob], "image.jpg", { type: mime });

  const url = await fal.storage.upload(file);
  return url;
}

// ─── Generate thumbnail variants using FLUX text-to-image at 1280×720 ────────
export async function generateThumbnailVariant(
  input: GenerateThumbnailInput,
): Promise<GeneratedImage> {
  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt: input.prompt,
      image_size: { width: 1280, height: 720 },
      num_images: 1,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      seed: input.seed,
      enable_safety_checker: false,
    },
  });

  const images = (result.data as { images: GeneratedImage[] }).images;
  if (!images?.length) throw new Error("No images generated");
  return images[0];
}

// ─── Generate with face identity using PuLID ─────────────────────────────────
export async function generateWithFace(
  input: FaceIntegrationInput,
): Promise<GeneratedImage> {
  const result = await fal.subscribe("fal-ai/pulid", {
    input: {
      prompt: input.prompt,
      reference_images: input.faceImageUrls
        .slice(0, 4)
        .map((url) => ({ image_url: url })),
      num_images: 1,
      image_size: { width: 1280, height: 720 },
      num_inference_steps: 4,
      guidance_scale: 1.2,
      seed: input.seed,
    },
  });

  const images = (result.data as { images: GeneratedImage[] }).images;
  if (!images?.length) throw new Error("No face-integrated image generated");
  return images[0];
}

// ─── Polish / upscale with Clarity Upscaler ──────────────────────────────────
export async function polishThumbnail(
  input: PolishInput,
): Promise<GeneratedImage> {
  const result = await fal.subscribe("fal-ai/clarity-upscaler", {
    input: {
      image_url: input.imageUrl,
      prompt: input.prompt,
      upscale_factor: 1,
      creativity: input.creativity,
      resemblance: input.resemblance,
      num_inference_steps: 20,
    },
  });

  const image = (result.data as { image: GeneratedImage }).image;
  if (!image) throw new Error("No image returned from polish step");
  return image;
}

// ─── Generate a standalone asset with FLUX ───────────────────────────────────
export async function generateAsset(prompt: string): Promise<GeneratedImage> {
  const result = await fal.subscribe("fal-ai/flux/dev", {
    input: {
      prompt: `${prompt}, isolated on transparent/white background, product shot style, clean, high detail`,
      num_images: 1,
      image_size: "square_hd" as const,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: false,
    },
  });

  const images = (result.data as { images: GeneratedImage[] }).images;
  if (!images?.length) throw new Error("No asset image generated");
  return images[0];
}
