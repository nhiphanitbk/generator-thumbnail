'use client'

import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { downloadImage, downloadImageResized } from '@/lib/utils'
import { toast } from './toast'

const SIZES = [
  { label: 'YouTube Standard', sub: '1280 × 720', w: 1280, h: 720, crop: false },
  { label: 'Full HD', sub: '1920 × 1080', w: 1920, h: 1080, crop: false },
  { label: 'Half size', sub: '640 × 360', w: 640, h: 360, crop: false },
  { label: 'Square', sub: '720 × 720 · center crop', w: 720, h: 720, crop: true },
  { label: 'Shorts / Vertical', sub: '720 × 1280 · center crop', w: 720, h: 1280, crop: true },
]

interface ExportMenuProps {
  url: string
  disabled?: boolean
  className?: string
}

export function ExportMenu({ url, disabled, className = '' }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDownload = async (size: typeof SIZES[0]) => {
    setOpen(false)
    setLoading(true)
    try {
      const filename = `thumbnail-${size.w}x${size.h}-${Date.now()}.jpg`
      if (size.w === 1280 && size.h === 720) {
        await downloadImage(url, filename)
      } else {
        await downloadImageResized(url, filename, size.w, size.h, size.crop)
      }
      toast(`Downloading ${size.sub}…`, 'info')
    } catch {
      toast('Download failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 hover:border-border-bright text-sm text-secondary hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={13} />
        Export
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden min-w-[230px]">
            <p className="text-[10px] text-muted px-3 pt-2.5 pb-1 font-medium uppercase tracking-wide">Export size</p>
            {SIZES.map((size) => (
              <button
                key={size.label}
                onClick={() => handleDownload(size)}
                className="w-full text-left px-3 py-2.5 hover:bg-surface-2 transition-colors flex items-center justify-between gap-4 group"
              >
                <span className="text-sm text-primary">{size.label}</span>
                <span className="text-xs text-muted group-hover:text-secondary">{size.sub}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
