import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-primary placeholder:text-muted',
        'transition-colors focus:outline-none focus:border-border-bright focus:ring-1 focus:ring-border-bright/50',
        'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
