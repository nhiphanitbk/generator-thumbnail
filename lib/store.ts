'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FaceProfile,
  ThumbnailAsset,
  CompositionSource,
  ThumbnailVariant,
  SavedThumbnail,
  GenerationConfig,
  GenerationStatus,
} from './types'
import { generateId } from './utils'

// ─── Face Profile ────────────────────────────────────────────────────────────

interface ProfileStore {
  profile: FaceProfile | null
  setProfile: (profile: FaceProfile) => void
  updateProfile: (updates: Partial<FaceProfile>) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() } : null,
        })),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'face-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── Migrations ──────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // Compress oversized face-profile images (stored full-size before compression was added)
  try {
    const raw = localStorage.getItem('face-profile')
    if (raw) {
      const parsed = JSON.parse(raw)
      const images: string[] = parsed?.state?.profile?.images ?? []
      // If any image is larger than ~100KB in base64 chars (~75KB actual), recompress
      const needsRecompress = images.some((img) => img.length > 140_000)
      if (needsRecompress) {
        const compress = (b64: string): Promise<string> =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              const MAX = 512
              const scale = Math.min(MAX / img.width, MAX / img.height, 1)
              const canvas = document.createElement('canvas')
              canvas.width = Math.round(img.width * scale)
              canvas.height = Math.round(img.height * scale)
              canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
              resolve(canvas.toDataURL('image/jpeg', 0.82))
            }
            img.onerror = () => resolve(b64)
            img.src = b64
          })

        Promise.all(images.map(compress)).then((compressed) => {
          parsed.state.profile.images = compressed
          try { localStorage.setItem('face-profile', JSON.stringify(parsed)) } catch { /* ignore */ }
        })
      }
    }
  } catch { /* ignore */ }
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

interface GalleryStore {
  thumbnails: SavedThumbnail[]
  addThumbnail: (thumbnail: Omit<SavedThumbnail, 'id' | 'createdAt'>) => SavedThumbnail
  removeThumbnail: (id: string) => void
  updateThumbnail: (id: string, updates: Partial<SavedThumbnail>) => void
}

export const useGalleryStore = create<GalleryStore>()(
  persist(
    (set, get) => ({
      thumbnails: [],
      addThumbnail: (thumbnail) => {
        const saved: SavedThumbnail = {
          ...thumbnail,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ thumbnails: [saved, ...state.thumbnails] }))
        return saved
      },
      removeThumbnail: (id) =>
        set((state) => ({ thumbnails: state.thumbnails.filter((t) => t.id !== id) })),
      updateThumbnail: (id, updates) =>
        set((state) => ({
          thumbnails: state.thumbnails.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    }),
    {
      name: 'thumbnail-gallery',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── Create Wizard ────────────────────────────────────────────────────────────

interface WizardStore {
  step: number
  config: GenerationConfig
  status: GenerationStatus

  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void

  // Composition
  setComposition: (composition: CompositionSource | null) => void

  // Assets
  addAsset: (asset: Omit<ThumbnailAsset, 'id' | 'createdAt'>) => void
  removeAsset: (id: string) => void
  updateAssetLabel: (id: string, label: string) => void

  // Instructions
  setInstructions: (instructions: string) => void
  setUseFaceProfile: (use: boolean) => void
  setFaceImageIndices: (indices: number[]) => void

  // Generation
  setVariants: (variants: ThumbnailVariant[]) => void
  selectVariant: (variant: ThumbnailVariant) => void
  setPolishedUrl: (url: string) => void

  // Status
  setStatus: (status: GenerationStatus) => void
}

const defaultConfig: GenerationConfig = {
  composition: null,
  assets: [],
  instructions: '',
  useFaceProfile: true,
  faceImageIndices: [0],
  variants: [],
  selectedVariant: null,
  polishedUrl: null,
}

const defaultStatus: GenerationStatus = {
  step: 'idle',
  progress: 0,
  message: '',
}

export const useWizardStore = create<WizardStore>()((set, get) => ({
  step: 0,
  config: defaultConfig,
  status: defaultStatus,

  goToStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),
  reset: () => set({ step: 0, config: defaultConfig, status: defaultStatus }),

  setComposition: (composition) =>
    set((state) => ({ config: { ...state.config, composition } })),

  addAsset: (asset) =>
    set((state) => ({
      config: {
        ...state.config,
        assets: [
          ...state.config.assets,
          { ...asset, id: generateId(), createdAt: new Date().toISOString() },
        ],
      },
    })),

  removeAsset: (id) =>
    set((state) => ({
      config: { ...state.config, assets: state.config.assets.filter((a) => a.id !== id) },
    })),

  updateAssetLabel: (id, label) =>
    set((state) => ({
      config: {
        ...state.config,
        assets: state.config.assets.map((a) => (a.id === id ? { ...a, label } : a)),
      },
    })),

  setInstructions: (instructions) =>
    set((state) => ({ config: { ...state.config, instructions } })),

  setUseFaceProfile: (useFaceProfile) =>
    set((state) => ({ config: { ...state.config, useFaceProfile } })),

  setFaceImageIndices: (faceImageIndices) =>
    set((state) => ({ config: { ...state.config, faceImageIndices } })),

  setVariants: (variants) =>
    set((state) => ({ config: { ...state.config, variants } })),

  selectVariant: (selectedVariant) =>
    set((state) => ({ config: { ...state.config, selectedVariant } })),

  setPolishedUrl: (polishedUrl) =>
    set((state) => ({ config: { ...state.config, polishedUrl } })),

  setStatus: (status) => set({ status }),
}))
