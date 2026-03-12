'use client'

import { useWizardStore } from '@/lib/store'
import { Toaster } from '@/components/ui/toast'
import { WizardShell } from '@/components/create/wizard-shell'

const STEPS = ['Composition', 'Assets', 'Instructions', 'Generate', 'Polish']

export default function CreatePage() {
  const { step } = useWizardStore()

  return (
    <div className="flex flex-col h-full">
      <Toaster />

      {/* Top bar with step progress */}
      <div className="border-b border-border bg-surface px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-primary">Create Thumbnail</h1>
            <p className="text-xs text-muted">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0">
          {STEPS.map((name, i) => (
            <div key={name} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? 'bg-accent text-white'
                      : i === step
                      ? 'bg-accent text-white ring-2 ring-accent/40'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-primary' : 'text-muted'}`}>
                  {name}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 sm:w-16 h-px mx-2 transition-all ${i < step ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard content */}
      <div className="flex-1 overflow-y-auto">
        <WizardShell />
      </div>
    </div>
  )
}
