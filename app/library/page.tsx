'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/store'
import { LIBRARY_TEMPLATES, TEMPLATE_GRADIENTS, CATEGORY_LABELS } from '@/lib/templates'
import type { LibraryTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from '@/components/ui/toast'
import { Wand2, BookImage, ArrowRight, X, Layers } from 'lucide-react'

export default function LibraryPage() {
  const [selected, setSelected] = useState<LibraryTemplate | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const { setComposition, reset, goToStep } = useWizardStore()
  const router = useRouter()

  const categories = ['all', ...Array.from(new Set(LIBRARY_TEMPLATES.map((t) => t.category)))]
  const filtered =
    activeCategory === 'all'
      ? LIBRARY_TEMPLATES
      : LIBRARY_TEMPLATES.filter((t) => t.category === activeCategory)

  const handleUseTemplate = (template: LibraryTemplate) => {
    reset()
    setComposition({
      type: 'library',
      templateId: template.id,
      templateName: template.name,
      thumbnailUrl: '',
      category: template.category,
    })
    goToStep(1) // Skip to assets step since composition is set
    toast(`"${template.name}" selected — proceed to add assets`, 'success')
    router.push('/create')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Composition Library</h1>
          <p className="text-secondary text-sm">
            Pre-defined thumbnail layouts. Pick one as your composition base.
          </p>
        </div>
        <Badge variant="default" className="text-sm px-3 py-1.5">
          {LIBRARY_TEMPLATES.length} templates
        </Badge>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-2 text-secondary hover:bg-surface-3 border border-border'
            }`}
          >
            {cat === 'all' ? 'All Templates' : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-4">
        {filtered.map((template) => {
          const gradient = TEMPLATE_GRADIENTS[template.id]
          const isSelected = selected?.id === template.id

          return (
            <div
              key={template.id}
              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-accent shadow-lg shadow-accent/20 ring-1 ring-accent/40'
                  : 'border-border hover:border-border-bright bg-surface'
              }`}
              onClick={() => setSelected(isSelected ? null : template)}
            >
              {/* Preview */}
              <div className={`aspect-video bg-gradient-to-br ${gradient} relative`}>
                <TemplatePreviewWidget templateId={template.id} name={template.name} />

                <div className="absolute top-2 left-2">
                  <Badge variant="default" className="text-[9px] py-0 px-1.5 bg-black/60 border-none">
                    {CATEGORY_LABELS[template.category]}
                  </Badge>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                      <Wand2 size={18} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Hover */}
                {!isSelected && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded-lg">
                      Click to preview
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-surface-2">
                <h3 className="text-sm font-semibold text-primary mb-0.5">{template.name}</h3>
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">{template.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-muted border border-border">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected template panel */}
      {selected && (
        <div className="fixed bottom-6 left-[220px] right-0 flex justify-center px-8 pointer-events-none">
          <div className="bg-surface-2 border border-border-bright rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 pointer-events-auto animate-slide-up max-w-2xl w-full">
            <div className={`w-14 h-8 rounded-lg bg-gradient-to-br ${TEMPLATE_GRADIENTS[selected.id]} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{selected.name}</p>
              <p className="text-xs text-muted truncate">{selected.layoutDescription}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                <X size={12} />
              </Button>
              <Button size="sm" onClick={() => handleUseTemplate(selected)}>
                Use this template
                <ArrowRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Visual layout widgets for each template
function TemplatePreviewWidget({ templateId, name }: { templateId: string; name: string }) {
  const widgets: Record<string, React.ReactNode> = {
    'reaction-face-left': (
      <div className="absolute inset-0 flex items-center px-4 gap-3">
        <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-white/50 rounded w-full" />
          <div className="h-3 bg-white/35 rounded w-3/4" />
          <div className="h-2 bg-yellow-300/70 rounded w-1/2" />
        </div>
      </div>
    ),
    'split-screen': (
      <div className="absolute inset-0 flex">
        <div className="flex-1 bg-black/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20" />
        </div>
        <div className="w-1 bg-white/50" />
        <div className="flex-1 bg-white/15 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/30" />
        </div>
      </div>
    ),
    'dramatic-closeup': (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>
    ),
    'vs-battle': (
      <div className="absolute inset-0 flex items-center px-4 gap-2">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-400/50" />
        </div>
        <div className="text-white font-black text-xl opacity-90 drop-shadow-lg">VS</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-blue-400/50" />
        </div>
      </div>
    ),
    'pointing-at': (
      <div className="absolute inset-0 flex items-center px-4 gap-3">
        <div className="w-12 h-14 rounded-lg bg-white/25 flex items-center justify-center flex-shrink-0">
          <div className="w-1.5 h-6 bg-white/70 rounded" style={{ transform: 'rotate(40deg)', transformOrigin: 'bottom' }} />
        </div>
        <div className="flex-1 rounded-xl bg-yellow-300/40 h-12 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-yellow-300/80" />
        </div>
      </div>
    ),
    'dark-cinematic': (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        <div className="w-16 h-16 rounded-full bg-white/8 border border-white/15 shadow-[0_0_40px_rgba(255,200,100,0.15)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent" />
      </div>
    ),
    'text-heavy': (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
        <div className="h-5 bg-white/70 rounded-md w-4/5" />
        <div className="h-4 bg-white/50 rounded-md w-3/5" />
        <div className="h-3 bg-orange-300/80 rounded-md w-2/5" />
      </div>
    ),
    'product-showcase': (
      <div className="absolute inset-0 flex items-center px-4 gap-3">
        <div className="flex-1 rounded-xl bg-white/20 h-16 flex items-center justify-center">
          <div className="w-10 h-10 rounded-lg bg-white/40" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white/25 flex-shrink-0" />
      </div>
    ),
    'grid-collage': (
      <div className="absolute inset-0 grid grid-cols-2 gap-1.5 p-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`rounded-lg ${i % 2 === 0 ? 'bg-white/20' : 'bg-white/15'}`} />
        ))}
      </div>
    ),
    'minimal-clean': (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/25 shadow-[0_8px_20px_rgba(0,0,0,0.2)]" />
        <div className="space-y-1.5 flex flex-col items-center">
          <div className="h-2 bg-white/50 rounded w-24" />
          <div className="h-1.5 bg-white/30 rounded w-16" />
        </div>
      </div>
    ),
  }

  return <>{widgets[templateId] ?? <div className="absolute inset-0 flex items-center justify-center"><span className="text-white/30 text-xs">{name}</span></div>}</>
}
