'use client'

import { useState, useRef } from 'react'
import { useProfileStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Toaster, toast } from '@/components/ui/toast'
import { fileToBase64, generateId } from '@/lib/utils'
import { X, CheckCircle2, Plus } from 'lucide-react'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 4 * 1024 * 1024

export default function ProfilePage() {
  const { profile, setProfile, clearProfile } = useProfileStore()

  const [images, setImages] = useState<string[]>(profile?.images ?? [])
  const [note, setNote] = useState(profile?.note ?? '')
  const [saving, setSaving] = useState(false)

  const addInputRef = useRef<HTMLInputElement>(null)

  const compressImage = (base64: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 512
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => resolve(base64)
      img.src = base64
    })

  const readFiles = async (files: File[]): Promise<string[]> => {
    const results: string[] = []
    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast(`"${file.name}" is too large (max 4MB)`, 'error')
        continue
      }
      try {
        const raw = await fileToBase64(file)
        results.push(await compressImage(raw))
      } catch {
        toast(`Failed to process "${file.name}"`, 'error')
      }
    }
    return results
  }

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const newImgs = await readFiles(files.slice(0, MAX_IMAGES - images.length))
    setImages((prev) => [...prev, ...newImgs])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (images.length === 0) {
      toast('Please upload at least one photo', 'error')
      return
    }
    setSaving(true)
    try {
      setProfile({
        id: profile?.id ?? generateId(),
        images,
        note,
        createdAt: profile?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      toast('Face profile saved!', 'success')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    clearProfile()
    setImages([])
    setNote('')
    toast('Face profile cleared', 'info')
  }

  const hasChanges =
    JSON.stringify(images) !== JSON.stringify(profile?.images ?? []) ||
    note !== (profile?.note ?? '')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Toaster />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Face Profile</h1>
        <p className="text-secondary text-sm">
          Upload portrait photos of your face. The AI will use them to place your likeness in thumbnails.
        </p>
      </div>

      {/* ── Photo slots ── */}
      <div className="mb-6">
        <Label className="mb-3 block">
          Portrait Photos
          <span className="ml-2 text-muted font-normal">({images.length}/{MAX_IMAGES})</span>
        </Label>

        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Face ${i + 1}`}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:border-accent"
                title="Remove"
              >
                <X size={10} className="text-primary" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded-full">Primary</span>
                </div>
              )}
            </div>
          ))}

          {/* Add slot */}
          {images.length < MAX_IMAGES && (
            <button
              onClick={() => addInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 flex flex-col items-center justify-center gap-1.5 transition-all text-muted hover:text-accent"
            >
              <Plus size={20} />
              <span className="text-[10px] font-medium">Add photo</span>
            </button>
          )}
        </div>

        <p className="text-xs text-muted mt-3">
          Front-facing, good lighting · JPG, PNG, WebP · max 4MB each · Click photo to replace
        </p>
      </div>

      {/* Hidden file inputs */}
      <input ref={addInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />

      {/* ── Note ── */}
      <div className="mb-6">
        <Label htmlFor="note" className="mb-1.5 block">
          Usage Note <span className="text-muted font-normal">(optional)</span>
        </Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. I have a beard, prefer casual clothing, always smiling, natural hair…"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted mt-1">{note.length}/500 · The AI reads this when placing your face</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving} disabled={images.length === 0 || (!hasChanges && !!profile)}>
          <CheckCircle2 size={14} />
          {profile ? (hasChanges ? 'Save changes' : 'Saved') : 'Save Profile'}
        </Button>
        {profile && (
          <Button variant="destructive" onClick={handleClear}>
            <X size={14} />
            Clear Profile
          </Button>
        )}
        {profile && !hasChanges && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Profile active
          </span>
        )}
      </div>
    </div>
  )
}
