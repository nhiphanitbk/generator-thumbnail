'use client'

import { useState } from 'react'
import { useWizardStore, useGalleryStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { ThumbnailOverlay } from '@/components/thumbnail-overlay'
import { ExportMenu } from '@/components/ui/export-menu'
import {
  ArrowLeft,
  Sparkles,
  Save,
  RefreshCw,
  SplitSquareHorizontal,
  Check,
  Zap,
  AlertCircle,
} from 'lucide-react'

const POLISH_PRESETS = [
  { label: 'Enhance lighting', note: 'Improve lighting quality and add depth with dramatic shadows' },
  { label: 'Boost vibrancy', note: 'Make colors more vibrant and saturated, increase contrast' },
  { label: 'Fix blending', note: 'Improve how different elements blend together naturally' },
  { label: 'Add sharpness', note: 'Enhance overall sharpness and fine details throughout' },
  { label: 'Cinematic grade', note: 'Apply a cinematic color grade with warm tones and film look' },
]

export function StepPolish() {
  const { config, setPolishedUrl, prevStep, reset } = useWizardStore()
  const { addThumbnail } = useGalleryStore()
  const router = useRouter()

  const [polishNote, setPolishNote] = useState('')
  const [polishing, setPolishing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [showComparison, setShowComparison] = useState(false)

  const currentUrl = config.polishedUrl ?? config.selectedVariant?.url ?? ''
  const originalUrl = config.selectedVariant?.url ?? ''
  const isPolished = !!config.polishedUrl

  const handlePolish = async () => {
    if (!currentUrl) return
    setPolishing(true)
    setError('')
    try {
      const res = await fetch('/api/generate/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: currentUrl, userNote: polishNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPolishedUrl(data.url)
      toast('Polish complete! Quality enhanced.', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Polish failed'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setPolishing(false)
    }
  }

  const handleSave = async () => {
    if (!currentUrl || !config.composition) return
    setSaving(true)
    try {
      addThumbnail({
        title: title || `Thumbnail ${new Date().toLocaleDateString()}`,
        url: currentUrl,
        composition: config.composition,
        assets: config.assets,
        instructions: config.instructions,
        variants: config.variants,
      })
      toast('Saved to gallery!', 'success')
      setTimeout(() => {
        reset()
        router.push('/gallery')
      }, 1000)
    } finally {
      setSaving(false)
    }
  }

  const handleStartNew = () => {
    reset()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-1">Polish & Save</h2>
        <p className="text-sm text-secondary">
          Enhance your selected thumbnail with one-click polish, then save to your gallery or download.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main image preview */}
        <div className="col-span-2 space-y-4">
          {/* Comparison toggle */}
          {isPolished && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showComparison ? 'border-accent bg-accent/10 text-accent' : 'border-border text-secondary hover:border-border-bright'
                }`}
              >
                <SplitSquareHorizontal size={12} />
                {showComparison ? 'Hide comparison' : 'Compare with original'}
              </button>
              <Badge variant="success"><Check size={10} /> Polish applied</Badge>
            </div>
          )}

          {showComparison && isPolished ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted mb-1.5">Before</p>
                <div className="aspect-video rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl} alt="Original" className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <p className="text-xs text-accent mb-1.5">After Polish</p>
                <div className="aspect-video rounded-xl overflow-hidden border border-accent/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.polishedUrl!} alt="Polished" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          ) : currentUrl ? (
            <ThumbnailOverlay imageUrl={currentUrl}>
              {polishing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 rounded-xl">
                  <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                  <p className="text-sm text-white">Enhancing with Clarity…</p>
                </div>
              )}
              <div className="absolute bottom-2 right-2">
                <Badge variant="default" className="text-[9px]">1280×720</Badge>
              </div>
            </ThumbnailOverlay>
          ) : (
            <div className="aspect-video rounded-xl overflow-hidden border border-border-bright bg-surface-2 flex items-center justify-center">
              <p className="text-muted text-sm">No thumbnail selected</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 rounded-xl p-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="space-y-4">
          {/* Polish controls */}
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Zap size={14} className="text-accent" />
              Polish
            </h4>

            <div>
              <Label className="mb-2">Presets</Label>
              <div className="space-y-1.5">
                {POLISH_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPolishNote(preset.note)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                      polishNote === preset.note
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-secondary hover:border-border-bright hover:text-primary'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Custom note</Label>
              <Textarea
                value={polishNote}
                onChange={(e) => setPolishNote(e.target.value)}
                placeholder="or describe specific improvements..."
                rows={2}
                className="text-xs"
              />
            </div>

            <Button
              onClick={handlePolish}
              loading={polishing}
              disabled={!currentUrl || polishing}
              className="w-full"
            >
              <Sparkles size={14} />
              {isPolished ? 'Polish again' : 'Apply polish'}
            </Button>
          </div>

          {/* Save controls */}
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary">Save</h4>

            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My thumbnail title..."
                className="text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={!currentUrl || saving}
                className="flex-1"
              >
                <Save size={14} />
                Save to Gallery
              </Button>
              <ExportMenu url={currentUrl} disabled={!currentUrl} />
            </div>
          </div>

          {/* Start new */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleStartNew}
          >
            <RefreshCw size={14} />
            Start New Thumbnail
          </Button>
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-6 flex justify-start">
        <Button variant="secondary" onClick={prevStep}>
          <ArrowLeft size={16} />
          Back to variants
        </Button>
      </div>
    </div>
  )
}
