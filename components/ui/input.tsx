import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-primary placeholder:text-muted',
        'transition-colors focus:outline-none focus:border-border-bright focus:ring-1 focus:ring-border-bright/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
