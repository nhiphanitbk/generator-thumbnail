'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useWizardStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { LIBRARY_TEMPLATES, TEMPLATE_GRADIENTS, CATEGORY_LABELS } from '@/lib/templates'
import type { LibraryTemplate } from '@/lib/types'
import { Youtube, BookImage, ArrowRight, Check, Loader2, ExternalLink } from 'lucide-react'

type Tab = 'youtube' | 'library'

export function StepComposition() {
  const { config, setComposition, nextStep } = useWizardStore()
  const [tab, setTab] = useState<Tab>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryTemplate | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const handleYoutubeExtract = async () => {
    if (!youtubeUrl.trim()) {
      toast('Please enter a YouTube URL', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/youtube/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setComposition({
        type: 'youtube',
        videoId: data.videoId,
        thumbnailUrl: data.thumbnailUrl,
        title: data.title,
      })
      toast('Thumbnail extracted!', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to extract thumbnail', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (template: LibraryTemplate) => {
    setSelectedTemplate(template)
    setComposition({
      type: 'library',
      templateId: template.id,
      templateName: template.name,
      thumbnailUrl: '',
      category: template.category,
    })
  }

  const canProceed = config.composition !== null

  const categories = ['all', ...Array.from(new Set(LIBRARY_TEMPLATES.map((t) => t.category)))]
  const filtered =
    activeCategory === 'all'
      ? LIBRARY_TEMPLATES
      : LIBRARY_TEMPLATES.filter((t) => t.category === activeCategory)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-1">Choose Composition Reference</h2>
        <p className="text-sm text-secondary">
          The composition defines the layout. Upload a YouTube reference or pick from templates.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex bg-surface-2 rounded-xl p-1 w-fit mb-6 border border-border">
        {[
          { id: 'youtube' as Tab, icon: Youtube, label: 'YouTube URL' },
          { id: 'library' as Tab, icon: BookImage, label: 'Template Library' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* YouTube Tab */}
      {tab === 'youtube' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="youtube-url">YouTube Video URL</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="youtube-url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleYoutubeExtract()}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1"
              />
              <Button onClick={handleYoutubeExtract} loading={loading} disabled={!youtubeUrl.trim()}>
                {loading ? 'Extracting…' : 'Extract'}
              </Button>
            </div>
            <p className="text-xs text-muted mt-1.5">
              Paste any YouTube link — the thumbnail will be used as the composition layout reference
            </p>
          </div>

          {/* Preview */}
          {config.composition?.type === 'youtube' && (
            <div className="rounded-xl overflow-hidden border border-border-bright bg-surface-2 animate-slide-up">
              <div className="aspect-video relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.composition.thumbnailUrl}
                  alt="YouTube thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="accent">Reference</Badge>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <div>
                  {config.composition.title && (
                    <p className="text-sm font-medium text-primary truncate max-w-xs">
                      {config.composition.title}
                    </p>
                  )}
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    <Youtube size={10} />
                    {config.composition.videoId}
                    <a
                      href={`https://youtube.com/watch?v=${config.composition.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-accent"
                    >
                      <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
                <Badge variant="success">
                  <Check size={10} />
                  Selected
                </Badge>
              </div>
            </div>
          )}

          <div className="bg-surface-2 border border-border rounded-xl p-4">
            <h4 className="text-xs font-medium text-secondary mb-2">Good reference thumbnails have:</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {['Clear subject positioning', 'Strong visual hierarchy', 'High contrast colors', 'Bold text treatment'].map((tip) => (
                <div key={tip} className="flex items-center gap-1.5 text-xs text-muted">
                  <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Library Tab */}
      {tab === 'library' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-secondary hover:bg-surface-3 border border-border'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filtered.map((template) => {
              const isSelected =
                config.composition?.type === 'library' &&
                config.composition.templateId === template.id
              const gradient = TEMPLATE_GRADIENTS[template.id]

              return (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`text-left rounded-xl overflow-hidden border transition-all duration-150 ${
                    isSelected
                      ? 'border-accent shadow-sm shadow-accent/20'
                      : 'border-border hover:border-border-bright'
                  }`}
                >
                  {/* Preview */}
                  <div className={`aspect-video bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
                    <TemplatePreview templateId={template.id} name={template.name} />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1">
                      <Badge variant="default" className="text-[9px] py-0 px-1.5">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-2">
                    <p className="text-xs font-semibold text-primary">{template.name}</p>
                    <p className="text-[10px] text-muted mt-0.5 line-clamp-2">{template.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-8 flex justify-end">
        <Button onClick={nextStep} disabled={!canProceed} size="lg">
          Next: Add Assets
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

// Visual preview widgets for each template type
function TemplatePreview({ templateId, name }: { templateId: string; name: string }) {
  const previews: Record<string, React.ReactNode> = {
    'reaction-face-left': (
      <div className="flex w-full h-full items-center px-4 gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-white/40 rounded w-full" />
          <div className="h-3 bg-white/30 rounded w-3/4" />
          <div className="h-3 bg-yellow-400/60 rounded w-1/2" />
        </div>
      </div>
    ),
    'split-screen': (
      <div className="flex w-full h-full">
        <div className="flex-1 bg-black/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20" />
        </div>
        <div className="w-px bg-white/40" />
        <div className="flex-1 bg-white/10 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/30" />
        </div>
      </div>
    ),
    'dramatic-closeup': (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-transparent via-white/10 to-transparent">
        <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20" />
      </div>
    ),
    'vs-battle': (
      <div className="flex w-full h-full items-center px-3 gap-2">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-400/40" />
        </div>
        <div className="text-white font-black text-lg opacity-80">VS</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-blue-400/40" />
        </div>
      </div>
    ),
    'pointing-at': (
      <div className="flex w-full h-full items-center px-4 gap-3">
        <div className="w-12 h-14 rounded-lg bg-white/20 flex items-end pb-2 justify-center flex-shrink-0">
          <div className="w-1 h-5 bg-white/60 rounded" style={{ transform: 'rotate(45deg)' }} />
        </div>
        <div className="flex-1 rounded-lg bg-yellow-400/30 h-10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-yellow-300" />
        </div>
      </div>
    ),
    'dark-cinematic': (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
      </div>
    ),
    'text-heavy': (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4">
        <div className="h-5 bg-white/60 rounded w-4/5" />
        <div className="h-4 bg-white/40 rounded w-3/5" />
        <div className="h-3 bg-orange-400/60 rounded w-2/5" />
      </div>
    ),
    'product-showcase': (
      <div className="flex w-full h-full items-center px-4 gap-3">
        <div className="flex-1 rounded-xl bg-white/15 h-16 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-white/30" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0" />
      </div>
    ),
    'grid-collage': (
      <div className="grid grid-cols-2 gap-1 m-3 w-full h-full">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded bg-white/20" />
        ))}
      </div>
    ),
    'minimal-clean': (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="w-14 h-14 rounded-xl bg-white/20" />
        <div className="h-2 bg-white/40 rounded w-20" />
        <div className="h-1.5 bg-white/20 rounded w-14" />
      </div>
    ),
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {previews[templateId] ?? (
        <span className="text-white/40 text-xs">{name}</span>
      )}
    </div>
  )
}
