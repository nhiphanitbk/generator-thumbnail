'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListeners: ((toast: Toast) => void)[] = []

export function toast(message: string, type: ToastType = 'info') {
  const t: Toast = { id: `${Date.now()}`, message, type }
  toastListeners.forEach((fn) => fn(t))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id))
    }, 4000)
  }, [])

  useEffect(() => {
    toastListeners.push(addToast)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast)
    }
  }, [addToast])

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
  const colors = {
    success: 'border-green-500/40 bg-green-950/80',
    error: 'border-red-500/40 bg-red-950/80',
    info: 'border-border bg-surface-2',
  }
  const iconColors = { success: 'text-green-400', error: 'text-red-400', info: 'text-blue-400' }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm pointer-events-auto animate-slide-up max-w-sm',
              colors[t.type]
            )}
          >
            <Icon size={16} className={iconColors[t.type]} />
            <p className="text-sm text-primary flex-1">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-muted hover:text-primary transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
