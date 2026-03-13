'use client'

import { useState } from 'react'
import { useWizardStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

const QUICK_PROMPTS = [
  'Replace the person with my face, keep the background and text style',
  'Use my assets as the main focal point, match the original color scheme',
  'Remove all text from the reference, add my logo in the top-right corner',
  'Keep the dramatic lighting and pose, but change the background to match my asset',
  'Create a "before and after" style with my uploaded images',
]

export function StepInstructions() {
  const { config, setInstructions, nextStep, prevStep } = useWizardStore()
  const [autoLoading, setAutoLoading] = useState(false)

  const handleAutoInstructions = async () => {
    if (!config.composition) return
    setAutoLoading(true)
    try {
      const refUrl =
        config.composition.type === 'youtube'
          ? config.composition.thumbnailUrl
          : '' // Library templates don't have a real image yet

      if (!refUrl) {
        setInstructions(
          'Use the selected composition layout as a base. Blend my uploaded assets naturally into the scene.'
        )
        toast('Auto-instructions generated from template layout', 'info')
        return
      }

      const res = await fetch('/api/generate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImageUrl: refUrl,
          assetDescriptions: config.assets.map((a) => a.label),
          hasFaceProfile: false,
          autoInstructions: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInstructions(data.instructions)
      toast('Instructions generated!', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to auto-generate instructions', 'error')
    } finally {
      setAutoLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-1">Describe the Thumbnail</h2>
        <p className="text-sm text-secondary">
          Tell the AI what to do — what to replace, keep, add, or how to blend things together.
          Or let AI figure it out automatically.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 space-y-5">
          {/* Instruction text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0">Instructions</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutoInstructions}
                loading={autoLoading}
                className="h-6 text-xs gap-1"
              >
                <Sparkles size={11} />
                AI suggests
              </Button>
            </div>
            <Textarea
              value={config.instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Replace the person in the thumbnail with my face. Keep the dramatic red background and lightning effects. Add my product in the bottom-right corner. Make the text bold and white..."
              rows={6}
              className="text-sm"
            />
            <p className="text-xs text-muted mt-1.5">
              {config.instructions.length > 0 ? `${config.instructions.length} chars` : 'Leave blank for full AI control'}
            </p>
          </div>

          {/* Quick prompt suggestions */}
          <div>
            <Label>Quick starts</Label>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInstructions(p)}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                    config.instructions === p
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-secondary hover:border-border-bright hover:text-primary hover:bg-surface-2'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="col-span-2 space-y-4">
          {/* Summary */}
          <div className="bg-surface-2 border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-secondary mb-3">Generation summary</h4>
            <div className="space-y-2">
              <SummaryRow
                label="Composition"
                value={
                  config.composition?.type === 'youtube'
                    ? `YouTube: ${config.composition.videoId}`
                    : config.composition?.type === 'library'
                    ? config.composition.templateName
                    : 'Not set'
                }
                ok={!!config.composition}
              />
              <SummaryRow
                label="Assets"
                value={`${config.assets.length} image${config.assets.length !== 1 ? 's' : ''}`}
                ok={true}
              />
              <SummaryRow
                label="Instructions"
                value={config.instructions ? 'Custom' : 'AI-decided'}
                ok={true}
              />
            </div>
          </div>

          <div className="bg-surface-2 border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-secondary mb-2">What happens next</h4>
            <p className="text-xs text-muted leading-relaxed">
              Gemini analyzes your reference + assets + instructions and builds a detailed generation prompt.
              Then generates 2 variants for you to choose from.
            </p>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={prevStep}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={nextStep} size="lg">
          Generate Thumbnails
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  ok,
  neutral = false,
}: {
  label: string
  value: string
  ok: boolean
  neutral?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span
        className={`text-xs font-medium truncate max-w-[120px] ${
          neutral ? 'text-secondary' : ok ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
