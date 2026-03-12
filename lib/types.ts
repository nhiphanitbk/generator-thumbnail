export interface FaceProfile {
  id: string
  images: string[] // base64 data URLs
  note: string
  createdAt: string
  updatedAt: string
}

export interface ThumbnailAsset {
  id: string
  url: string // base64 or remote URL
  type: 'uploaded' | 'generated'
  label: string
  prompt?: string
  createdAt: string
}

export type CompositionSource =
  | {
      type: 'youtube'
      videoId: string
      thumbnailUrl: string
      title?: string
    }
  | {
      type: 'library'
      templateId: string
      templateName: string
      thumbnailUrl: string
      category: string
    }

export interface ThumbnailVariant {
  id: string
  url: string
  index: 0 | 1
  prompt?: string
}

export interface SavedThumbnail {
  id: string
  title: string
  url: string
  composition: CompositionSource
  assets: ThumbnailAsset[]
  instructions: string
  variants: ThumbnailVariant[]
  createdAt: string
}

export interface LibraryTemplate {
  id: string
  name: string
  description: string
  previewUrl: string // SVG data URI or image URL
  category: 'reaction' | 'split' | 'dramatic' | 'minimal' | 'comparison' | 'cinematic' | 'text-heavy' | 'product'
  tags: string[]
  promptHint: string
  layoutDescription: string
}

export interface GenerationConfig {
  composition: CompositionSource | null
  assets: ThumbnailAsset[]
  instructions: string
  useFaceProfile: boolean
  faceImageIndices: number[] // which profile photos to use
  variants: ThumbnailVariant[]
  selectedVariant: ThumbnailVariant | null
  polishedUrl: string | null
}

export interface GenerationStatus {
  step: 'idle' | 'analyzing' | 'generating-1' | 'generating-2' | 'face-applying' | 'done' | 'error'
  progress: number
  message: string
  error?: string
}

export interface AnalysisResult {
  layoutDescription: string
  colorPalette: string[]
  compositionType: string
  keyElements: string[]
  hasPerson: boolean
  suggestedFaceReplacement: boolean
  generationPrompt: string
  negativePrompt: string
  strength: number
}
