'use client'

import { useState } from 'react'
import { Type } from 'lucide-react'

type Position =
  | 'top-left' | 'top-center' | 'top-right'
  | 'mid-left' | 'mid-center' | 'mid-right'
  | 'bot-left' | 'bot-center' | 'bot-right'

const POSITION_GRID: Position[] = [
  'top-left', 'top-center', 'top-right',
  'mid-left', 'mid-center', 'mid-right',
  'bot-left', 'bot-center', 'bot-right',
]

const POSITION_STYLES: Record<Position, string> = {
  'top-left':    'top-3 left-3 right-auto bottom-auto items-start text-left',
  'top-center':  'top-3 left-0 right-0 bottom-auto items-center text-center',
  'top-right':   'top-3 right-3 left-auto bottom-auto items-end text-right',
  'mid-left':    'top-1/2 -translate-y-1/2 left-3 right-auto items-start text-left',
  'mid-center':  'top-1/2 -translate-y-1/2 left-0 right-0 items-center text-center',
  'mid-right':   'top-1/2 -translate-y-1/2 right-3 left-auto items-end text-right',
  'bot-left':    'bottom-3 left-3 right-auto top-auto items-start text-left',
  'bot-center':  'bottom-3 left-0 right-0 top-auto items-center text-center',
  'bot-right':   'bottom-3 right-3 left-auto top-auto items-end text-right',
}

const TEXT_COLORS = ['#ffffff', '#000000', '#ffdd00', '#ff4444', '#00ccff']
const FONT_SIZES = ['text-base', 'text-2xl', 'text-4xl', 'text-5xl']
const FONT_SIZE_LABELS = ['S', 'M', 'L', 'XL']

interface ThumbnailOverlayProps {
  imageUrl: string
  alt?: string
  children?: React.ReactNode // extra elements overlaid on image (e.g. polish spinner)
}

export function ThumbnailOverlay({ imageUrl, alt = 'Thumbnail', children }: ThumbnailOverlayProps) {
  const [text, setText] = useState('')
  const [position, setPosition] = useState<Position>('bot-center')
  const [color, setColor] = useState('#ffffff')
  const [sizeIdx, setSizeIdx] = useState(2)
  const [shadow, setShadow] = useState(true)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      {/* Image + overlay */}
      <div className="aspect-video rounded-xl overflow-hidden border border-border-bright relative thumbnail-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />

        {text && (
          <div className={`absolute flex flex-col px-4 ${POSITION_STYLES[position]}`}>
            <span
              className={`font-black leading-tight max-w-[90%] ${FONT_SIZES[sizeIdx]}`}
              style={{
                color,
                textShadow: shadow ? '0 2px 10px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.7)' : 'none',
              }}
            >
              {text}
            </span>
          </div>
        )}

        {children}
      </div>

      {/* Controls toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
          open || text
            ? 'border-accent/50 text-accent bg-accent/5'
            : 'border-border text-muted hover:border-border-bright hover:text-secondary'
        }`}
      >
        <Type size={11} />
        {text ? 'Edit text overlay' : 'Add text overlay'}
      </button>

      {open && (
        <div className="bg-surface-2 border border-border rounded-xl p-3 space-y-3 animate-slide-up">
          {/* Text input */}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your video title here…"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted outline-none focus:border-accent transition-colors"
          />

          <div className="flex flex-wrap items-start gap-5">
            {/* Position grid */}
            <div>
              <p className="text-[10px] text-muted mb-1.5 font-medium">Position</p>
              <div className="grid grid-cols-3 gap-0.5">
                {POSITION_GRID.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`w-5 h-4 rounded-sm transition-colors ${
                      position === pos ? 'bg-accent' : 'bg-surface-3 hover:bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <p className="text-[10px] text-muted mb-1.5 font-medium">Color</p>
              <div className="flex gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      color === c ? 'border-accent scale-110' : 'border-border hover:border-border-bright'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-[10px] text-muted mb-1.5 font-medium">Size</p>
              <div className="flex gap-1">
                {FONT_SIZE_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setSizeIdx(i)}
                    className={`w-7 h-5 rounded text-[10px] font-semibold transition-colors ${
                      sizeIdx === i ? 'bg-accent text-white' : 'bg-surface-3 text-muted hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadow */}
            <div>
              <p className="text-[10px] text-muted mb-1.5 font-medium">Shadow</p>
              <button
                onClick={() => setShadow((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  shadow ? 'bg-accent text-white' : 'bg-surface-3 text-muted hover:text-primary'
                }`}
              >
                {shadow ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {text && (
            <button
              onClick={() => { setText(''); setOpen(false) }}
              className="text-[10px] text-muted hover:text-red-400 transition-colors"
            >
              Clear text
            </button>
          )}
        </div>
      )}
    </div>
  )
}
