'use client'

import { useWizardStore } from '@/lib/store'
import { StepComposition } from './steps/step-composition'
import { StepAssets } from './steps/step-assets'
import { StepInstructions } from './steps/step-instructions'
import { StepGenerate } from './steps/step-generate'
import { StepPolish } from './steps/step-polish'

export function WizardShell() {
  const { step } = useWizardStore()

  const steps = [
    <StepComposition key="composition" />,
    <StepAssets key="assets" />,
    <StepInstructions key="instructions" />,
    <StepGenerate key="generate" />,
    <StepPolish key="polish" />,
  ]

  return <div className="animate-fade-in">{steps[step]}</div>
}
