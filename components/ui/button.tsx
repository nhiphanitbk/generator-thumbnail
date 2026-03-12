import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm',
        secondary: 'bg-surface-2 text-primary hover:bg-surface-3 border border-border active:scale-[0.98]',
        ghost: 'text-secondary hover:text-primary hover:bg-surface-2 active:scale-[0.98]',
        outline: 'border border-border text-secondary hover:border-border-bright hover:text-primary active:scale-[0.98]',
        destructive: 'bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-900/50 active:scale-[0.98]',
        success: 'bg-green-900/40 text-green-400 hover:bg-green-900/60 border border-green-900/50 active:scale-[0.98]',
      },
      size: {
        sm: 'h-7 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        xl: 'h-13 px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
