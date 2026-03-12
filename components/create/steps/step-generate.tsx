'use client'

import { useState, useEffect, useRef } from 'react'
import { useWizardStore, useProfileStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { ExportMenu } from '@/components/ui/export-menu'
import { ThumbnailOverlay } from '@/components/thumbnail-overlay'
import type { AnalysisResult, ThumbnailVariant } from '@/lib/types'
import type { CTRAnalysis } from '@/lib/ai'
import { generateId } from '@/lib/utils'
import { ArrowRight, ArrowLeft, RefreshCw, Check, Sparkles, Zap, AlertCircle, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type GenState = 'idle' | 'analyzing' | 'generating' | 'done' | 'error'

export function StepGenerate() {
  const { config, setVariants, selectVariant, nextStep, prevStep, setStatus } = useWizardStore()
  const { profile } = useProfileStore()

  const [state, setState] = useState<GenState>('idle')
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [variants, setLocalVariants] = useState<ThumbnailVariant[]>(config.variants)
  const [selected, setSelected] = useState<ThumbnailVariant | null>(config.selectedVariant)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [ctr, setCtr] = useState<CTRAnalysis | null>(null)
  const [ctrLoading, setCtrLoading] = useState(false)
  const hasStartedRef = useRef(false)

  // Auto-start generation on first mount
  useEffect(() => {
    if (!hasStartedRef.current && variants.length === 0) {
      hasStartedRef.current = true
      runGeneration()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runGeneration = async () => {
    setState('analyzing')
    setProgress(5)
    setError('')
    setLocalVariants([])
    setSelected(null)

    try {
      // Step 1: Analyze reference and build prompt
      setStatusMsg('Analyzing reference thumbnail…')
      setProgress(15)

      const refUrl =
        config.composition?.type === 'youtube'
          ? config.composition.thumbnailUrl
          : null

      let analysisResult: AnalysisResult

      if (refUrl) {
        const analysisRes = await fetch('/api/generate/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referenceImageUrl: refUrl,
            assetDescriptions: config.assets.map((a) => `${a.label} (${a.type})`),
            userInstructions: config.instructions,
            hasFaceProfile: config.useFaceProfile && !!profile,
            faceProfileNote: profile?.note,
          }),
        })
        const analysisData = await analysisRes.json()
        if (!analysisRes.ok) throw new Error(analysisData.error)
        analysisResult = analysisData
      } else {
        // Library template — synthesize a prompt directly
        const templateComp = config.composition as Extract<typeof config.composition, { type: 'library' }> | null
        analysisResult = {
          layoutDescription: templateComp?.templateName ?? 'standard thumbnail composition',
          colorPalette: ['#ff4444', '#1a1a1a', '#ffffff'],
          compositionType: templateComp?.category ?? 'standard',
          keyElements: ['subject', 'background', 'title text'],
          hasPerson: config.useFaceProfile && !!profile,
          suggestedFaceReplacement: config.useFaceProfile && !!profile,
          generationPrompt: buildFallbackPrompt(
            templateComp?.templateName ?? 'YouTube thumbnail',
            config.assets.map((a) => a.label),
            config.instructions,
            profile?.note
          ),
          negativePrompt: 'blurry, low quality, pixelated, watermark, deformed faces, ugly',
          strength: 0.75,
        }
      }

      setAnalysis(analysisResult)
      setProgress(35)

      // Step 2: Generate variant 1
      setState('generating')
      setStatusMsg('Generating variant 1…')
      setProgress(40)

      const faceUrls =
        config.useFaceProfile && profile
          ? config.faceImageIndices.slice(0, 3).map((i) => profile.images[i]).filter(Boolean)
          : []

      const v1Res = await fetch('/api/generate/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisResult,
          referenceImageUrl: refUrl ?? 'https://picsum.photos/1280/720',
          faceImageUrls: faceUrls,
          variantIndex: 0,
        }),
      })
      const v1Data = await v1Res.json()
      if (!v1Res.ok) throw new Error(v1Data.error)

      const variant1: ThumbnailVariant = { id: generateId(), url: v1Data.url, index: 0, prompt: analysisResult.generationPrompt }
      setLocalVariants([variant1])
      setProgress(70)

      // Step 3: Generate variant 2
      setStatusMsg('Generating variant 2…')

      const v2Res = await fetch('/api/generate/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: { ...analysisResult, strength: Math.min(analysisResult.strength + 0.1, 0.9) },
          referenceImageUrl: refUrl ?? 'https://picsum.photos/1280/720',
          faceImageUrls: faceUrls,
          variantIndex: 1,
        }),
      })
      const v2Data = await v2Res.json()
      if (!v2Res.ok) throw new Error(v2Data.error)

      const variant2: ThumbnailVariant = { id: generateId(), url: v2Data.url, index: 1, prompt: analysisResult.generationPrompt }
      const allVariants = [variant1, variant2]
      setLocalVariants(allVariants)
      setVariants(allVariants)
      setProgress(100)
      setState('done')
      setStatusMsg('Both variants ready!')
      toast('Variants generated!', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      setState('error')
      toast(msg, 'error')
    }
  }

  const handleSelect = (variant: ThumbnailVariant) => {
    setSelected(variant)
    selectVariant(variant)
    setCtr(null) // reset CTR when switching variants
  }

  const runCTR = async (url: string) => {
    setCtrLoading(true)
    setCtr(null)
    try {
      const res = await fetch('/api/generate/ctr-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCtr(data)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'CTR analysis failed', 'error')
    } finally {
      setCtrLoading(false)
    }
  }

  const canProceed = !!selected

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary mb-1">Generate Variants</h2>
        <p className="text-sm text-secondary">
          Two versions are generated for you to choose from. Select the one you prefer to continue to polish.
        </p>
      </div>

      {/* Status bar */}
      {(state === 'analyzing' || state === 'generating') && (
        <div className="mb-6 bg-surface-2 border border-border rounded-xl p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-primary">{statusMsg}</span>
            </div>
            <span className="text-xs text-muted">{progress}%</span>
          </div>
          <Progress value={progress} animated />
          <div className="flex items-center gap-3 mt-3">
            {[
              { label: 'AI analysis', done: progress >= 35 },
              { label: 'Variant 1', done: progress >= 70 },
              { label: 'Variant 2', done: progress >= 100 },
            ].map(({ label, done }) => (
              <div key={label} className={`flex items-center gap-1.5 text-xs ${done ? 'text-green-400' : 'text-muted'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-green-400' : 'bg-muted'}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="mb-6 bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Generation failed</p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={runGeneration}>
            <RefreshCw size={12} />
            Retry
          </Button>
        </div>
      )}

      {/* Variants grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {[0, 1].map((idx) => {
          const variant = variants[idx]
          const isSelected = selected?.id === variant?.id
          const isLoading = state === 'generating' && !variant && idx > 0
          const isPending = !variant && state !== 'done' && state !== 'error'

          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary">Variant {idx + 1}</span>
                {isSelected && <Badge variant="accent"><Check size={10} /> Selected</Badge>}
              </div>

              <div
                className={`aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer relative ${
                  isPending || isLoading
                    ? 'border-border bg-surface-2 cursor-default'
                    : isSelected
                    ? 'border-accent shadow-lg shadow-accent/20'
                    : variant
                    ? 'border-border hover:border-border-bright'
                    : 'border-border bg-surface-2'
                }`}
                onClick={() => variant && handleSelect(variant)}
              >
                {variant ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={variant.url} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                    {!isSelected && (
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity bg-accent text-white rounded-lg px-3 py-1.5 text-sm font-medium">
                          Select this variant
                        </div>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    {isLoading || isPending ? (
                      <>
                        <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                        <span className="text-xs text-muted">Generating…</span>
                      </>
                    ) : state === 'idle' ? (
                      <>
                        <Sparkles size={20} className="text-muted" />
                        <span className="text-xs text-muted">Will be generated</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Selected variant preview panel ── */}
      {selected && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-secondary">Selected: Variant {selected.index + 1}</h3>
            <ExportMenu url={selected.url} />
          </div>

          <ThumbnailOverlay imageUrl={selected.url} />

          {/* CTR Score */}
          <div className="bg-surface-2 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-accent" />
                <span className="text-sm font-semibold text-primary">CTR Analysis</span>
              </div>
              {!ctr && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => runCTR(selected.url)}
                  loading={ctrLoading}
                  className="h-7 text-xs"
                >
                  <Sparkles size={11} />
                  Analyze CTR
                </Button>
              )}
              {ctr && (
                <button
                  onClick={() => runCTR(selected.url)}
                  disabled={ctrLoading}
                  className="text-xs text-muted hover:text-secondary transition-colors"
                >
                  Re-analyze
                </button>
              )}
            </div>

            {ctrLoading && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin" />
                Analyzing thumbnail…
              </div>
            )}

            {ctr && !ctrLoading && (
              <div className="space-y-3">
                {/* Score */}
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-black tabular-nums ${
                    ctr.score >= 8 ? 'text-green-400' : ctr.score >= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {ctr.score}<span className="text-lg text-muted font-normal">/10</span>
                  </div>
                  <div>
                    <Badge variant={ctr.score >= 8 ? 'success' : ctr.score >= 6 ? 'accent' : 'default'}>
                      {ctr.verdict === 'Excellent' || ctr.verdict === 'Good' ? <TrendingUp size={10} /> : ctr.verdict === 'Weak' ? <TrendingDown size={10} /> : <Minus size={10} />}
                      {ctr.verdict}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-green-400 font-medium mb-1.5 uppercase tracking-wide">Strengths</p>
                    <ul className="space-y-1">
                      {ctr.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-secondary flex gap-1.5">
                          <span className="text-green-400 mt-0.5 flex-shrink-0">+</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] text-yellow-400 font-medium mb-1.5 uppercase tracking-wide">Improvements</p>
                    <ul className="space-y-1">
                      {ctr.improvements.map((s, i) => (
                        <li key={i} className="text-xs text-secondary flex gap-1.5">
                          <span className="text-yellow-400 mt-0.5 flex-shrink-0">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted"><span className="text-accent font-medium">Top tip:</span> {ctr.tip}</p>
                </div>
              </div>
            )}

            {!ctr && !ctrLoading && (
              <p className="text-xs text-muted">AI will analyze colors, composition, emotion, and visual hierarchy to estimate CTR potential.</p>
            )}
          </div>
        </div>
      )}

      {/* Analysis info */}
      {analysis && (
        <details className="mb-6">
          <summary className="text-xs text-muted cursor-pointer hover:text-secondary select-none">
            Show AI analysis details
          </summary>
          <div className="mt-2 bg-surface-2 border border-border rounded-xl p-4 text-xs space-y-2">
            <div><span className="text-muted">Composition:</span> <span className="text-secondary">{analysis.compositionType}</span></div>
            <div><span className="text-muted">Key elements:</span> <span className="text-secondary">{analysis.keyElements.join(', ')}</span></div>
            <div><span className="text-muted">Face replacement:</span> <span className="text-secondary">{analysis.suggestedFaceReplacement ? 'Yes' : 'No'}</span></div>
            <div><span className="text-muted">Strength:</span> <span className="text-secondary">{analysis.strength}</span></div>
            <div>
              <span className="text-muted block mb-1">Prompt:</span>
              <p className="text-secondary font-mono leading-relaxed">{analysis.generationPrompt.slice(0, 300)}…</p>
            </div>
          </div>
        </details>
      )}

      {/* Stale results banner — shown when user came back with old variants */}
      {state === 'idle' && variants.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-surface-2 border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-secondary">
            These are your previous results. If you changed assets or instructions, regenerate to apply updates.
          </p>
          <Button variant="secondary" size="sm" onClick={runGeneration} className="flex-shrink-0">
            <RefreshCw size={13} />
            Regenerate
          </Button>
        </div>
      )}

      {/* Regenerate */}
      {(state === 'done' || state === 'error') && (
        <div className="flex justify-center mb-4">
          <Button variant="secondary" size="sm" onClick={runGeneration}>
            <RefreshCw size={14} />
            Regenerate both
          </Button>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={prevStep}>
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed} size="lg">
          <Zap size={16} />
          Polish selected
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

function buildFallbackPrompt(
  templateName: string,
  assetLabels: string[],
  instructions: string,
  faceNote?: string
): string {
  const assets = assetLabels.length > 0 ? `featuring ${assetLabels.join(', ')}` : ''
  const face = faceNote ? `Person in thumbnail: ${faceNote}.` : ''
  const inst = instructions || 'Create an eye-catching, click-worthy thumbnail.'

  return `Professional YouTube thumbnail, ${templateName} composition style, ${assets}. ${face} ${inst} High contrast, vibrant colors, sharp focus, professional photography quality. 1280x720, 16:9 aspect ratio, no watermarks, no borders.`
}
