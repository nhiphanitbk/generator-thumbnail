'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useWizardStore, useProfileStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { fileToBase64 } from '@/lib/utils'
import { Upload, X, Sparkles, ArrowRight, ArrowLeft, ImageIcon, Pencil, User, ToggleLeft, ToggleRight, RefreshCw, Check } from 'lucide-react'

export function StepAssets() {
  const { config, addAsset, removeAsset, updateAssetLabel, nextStep, prevStep, setUseFaceProfile, setFaceImageIndices } = useWizardStore()
  const { profile, updateProfile } = useProfileStore()
  const faceInputRef = useRef<HTMLInputElement>(null)

  const toggleFaceIndex = (i: number) => {
    const current = config.faceImageIndices
    if (current.includes(i)) {
      // Must keep at least 1 selected
      if (current.length === 1) return
      setFaceImageIndices(current.filter((x) => x !== i))
    } else {
      setFaceImageIndices([...current, i].sort((a, b) => a - b))
    }
  }
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted.slice(0, 8 - config.assets.length)) {
      if (file.size > 8 * 1024 * 1024) {
        toast(`"${file.name}" is too large (max 8MB)`, 'error')
        continue
      }
      try {
        const url = await fileToBase64(file)
        addAsset({
          url,
          type: 'uploaded',
          label: file.name.replace(/\.[^.]+$/, ''),
        })
      } catch {
        toast(`Failed to process "${file.name}"`, 'error')
      }
    }
  }, [config.assets.length, addAsset])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    disabled: config.assets.length >= 8,
  })

  const handleFaceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !profile) return
    try {
      const newImages = await Promise.all(files.slice(0, 4).map(fileToBase64))
      updateProfile({ images: newImages })
      toast('Face profile photos updated', 'success')
    } catch {
      toast('Failed to update photos', 'error')
    }
    e.target.value = ''
  }

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast('Enter a description for the asset', 'error')
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      addAsset({
        url: data.url,
        type: 'generated',
        label: generatePrompt.slice(0, 40),
        prompt: generatePrompt,
      })
      setGeneratePrompt('')
      toast('Asset generated!', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-1">Add Image Assets</h2>
        <p className="text-sm text-secondary">
          Upload images to include in the thumbnail, or generate elements with AI. These are the ingredients the AI will blend in.
        </p>
      </div>

      {/* ── Face Profile section ── */}
      <div className={`mb-6 rounded-xl border p-4 transition-colors ${
        profile
          ? config.useFaceProfile
            ? 'border-accent/40 bg-accent/5'
            : 'border-border bg-surface-2'
          : 'border-border bg-surface-2 opacity-60'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={14} className={profile && config.useFaceProfile ? 'text-accent' : 'text-muted'} />
            <span className="text-sm font-semibold text-primary">Face Profile</span>
            {profile && config.useFaceProfile && (
              <Badge variant="accent" className="text-[10px] py-0 px-1.5">Active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <>
                <button
                  onClick={() => faceInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
                  title="Replace photos"
                >
                  <RefreshCw size={11} />
                  Change photos
                </button>
                <input
                  ref={faceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFaceImageChange}
                />
              </>
            )}
            <button
              onClick={() => profile && setUseFaceProfile(!config.useFaceProfile)}
              disabled={!profile}
              className={`transition-opacity ${!profile ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={config.useFaceProfile ? 'Disable face profile' : 'Enable face profile'}
            >
              {config.useFaceProfile && profile
                ? <ToggleRight size={26} className="text-accent" />
                : <ToggleLeft size={26} className="text-muted" />}
            </button>
          </div>
        </div>

        {profile ? (
          <div>
            <div className="flex gap-2 flex-wrap">
              {profile.images.map((img, i) => {
                const selected = config.faceImageIndices.includes(i)
                const disabled = !config.useFaceProfile
                return (
                  <button
                    key={i}
                    onClick={() => config.useFaceProfile && toggleFaceIndex(i)}
                    disabled={disabled}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      disabled
                        ? 'border-border opacity-40 cursor-not-allowed'
                        : selected
                        ? 'border-accent shadow-sm shadow-accent/30'
                        : 'border-border hover:border-border-bright'
                    }`}
                    title={disabled ? '' : selected ? 'Click to deselect' : 'Click to select'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Face ${i + 1}`}
                      className={`w-14 h-14 object-cover transition-all ${
                        disabled || !selected ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    {selected && !disabled && (
                      <div className="absolute inset-0 bg-accent/20 flex items-end justify-end p-0.5">
                        <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                          <Check size={9} className="text-white" />
                        </div>
                      </div>
                    )}
                    {i === 0 && (
                      <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center py-0.5 leading-none">
                        Primary
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted mt-2">
              {config.useFaceProfile
                ? `${config.faceImageIndices.length} of ${profile.images.length} photo${profile.images.length > 1 ? 's' : ''} selected · Click to toggle`
                : 'Toggle on to include your face in the generated thumbnail'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted">
            No face profile set up.{' '}
            <a href="/profile" className="text-accent hover:underline">Go to Profile</a>{' '}
            to add your photos.
          </p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Upload + Generate */}
        <div className="col-span-3 space-y-5">
          {/* Upload dropzone */}
          <div>
            <Label>Upload Images</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
                isDragActive
                  ? 'border-accent bg-accent/5'
                  : config.assets.length >= 8
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-border-bright hover:bg-surface-2'
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={20} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-secondary">
                {isDragActive ? 'Drop images here…' : 'Drop images or click to browse'}
              </p>
              <p className="text-xs text-muted mt-1">Logos, products, backgrounds, objects — anything to include</p>
            </div>
          </div>

          {/* AI generate */}
          <div>
            <Label className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-accent" />
              Generate with AI
            </Label>
            <div className="flex gap-2">
              <Input
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. red sports car, glowing crystal ball, stack of money..."
                className="flex-1"
                disabled={generating || config.assets.length >= 8}
              />
              <Button
                onClick={handleGenerate}
                loading={generating}
                disabled={!generatePrompt.trim() || config.assets.length >= 8}
                variant="secondary"
              >
                <Sparkles size={14} />
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted mt-1">Creates a standalone element using FLUX AI</p>
          </div>
        </div>

        {/* Tips */}
        <div className="col-span-2">
          <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-secondary">What to add</h4>
            {[
              { icon: '🎭', tip: 'Your face/brand logo' },
              { icon: '📦', tip: 'Products being reviewed' },
              { icon: '🖼️', tip: 'Background scenes' },
              { icon: '✨', tip: 'Props or objects' },
              { icon: '📝', tip: 'Text or overlays' },
            ].map(({ icon, tip }) => (
              <div key={tip} className="flex items-center gap-2 text-xs text-muted">
                <span>{icon}</span>
                {tip}
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted">Assets are optional — the AI can work with just the composition reference.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset grid */}
      {config.assets.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="mb-0">{config.assets.length} asset{config.assets.length > 1 ? 's' : ''} added</Label>
            <span className="text-xs text-muted">{8 - config.assets.length} slots remaining</span>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {config.assets.map((asset) => (
              <div key={asset.id} className="group relative">
                <div className="aspect-square rounded-xl overflow-hidden border border-border bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.label} className="w-full h-full object-cover" />
                </div>
                <div className="mt-1.5">
                  {editingId === asset.id ? (
                    <input
                      autoFocus
                      value={asset.label}
                      onChange={(e) => updateAssetLabel(asset.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="w-full text-xs text-primary bg-surface-2 border border-accent rounded px-1 py-0.5 outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingId(asset.id)}
                      className="w-full text-left flex items-center gap-1 group/label"
                    >
                      <span className="text-xs text-muted truncate flex-1">{asset.label || 'Untitled'}</span>
                      <Pencil size={9} className="text-muted opacity-0 group-hover/label:opacity-100 flex-shrink-0" />
                    </button>
                  )}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant={asset.type === 'generated' ? 'accent' : 'default'} className="text-[9px] py-0 px-1">
                    {asset.type === 'generated' ? 'AI' : 'Upload'}
                  </Badge>
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="w-5 h-5 rounded-full bg-black/80 flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {config.assets.length === 0 && (
        <div className="mt-4 py-6 text-center border border-dashed border-border rounded-xl">
          <ImageIcon size={20} className="text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No assets added yet</p>
          <p className="text-xs text-muted mt-1">You can proceed without assets — the AI will work from the composition alone</p>
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={prevStep}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={nextStep} size="lg">
          Next: Instructions
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
