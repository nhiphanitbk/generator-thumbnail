'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGalleryStore, useWizardStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from '@/components/ui/toast'
import { formatDate, downloadImage } from '@/lib/utils'
import type { SavedThumbnail } from '@/lib/types'
import { ExportMenu } from '@/components/ui/export-menu'
import {
  Download,
  Trash2,
  Youtube,
  BookImage,
  Wand2,
  GalleryHorizontalEnd,
  Calendar,
  Eye,
} from 'lucide-react'

function GalleryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [expired, setExpired] = useState(false)
  if (expired) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-surface-2 gap-2 ${className ?? ''}`}>
        <span className="text-2xl">🕐</span>
        <span className="text-xs font-medium text-muted">Image expired</span>
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setExpired(true)} />
  )
}

export default function GalleryPage() {
  const { thumbnails, removeThumbnail } = useGalleryStore()
  const { reset, setComposition } = useWizardStore()
  const [preview, setPreview] = useState<SavedThumbnail | null>(null)
  const [filter, setFilter] = useState<'all' | 'youtube' | 'library'>('all')

  const filtered = thumbnails.filter((t) => {
    if (filter === 'all') return true
    return t.composition.type === filter
  })

  const handleDelete = (id: string) => {
    removeThumbnail(id)
    toast('Thumbnail removed from gallery', 'info')
    if (preview?.id === id) setPreview(null)
  }

  const handleDownload = async (t: SavedThumbnail) => {
    try {
      await downloadImage(t.url, `thumbnail-${t.id}.jpg`)
      toast('Downloading…', 'info')
    } catch {
      toast('Download failed', 'error')
    }
  }

  const handleUseAsTemplate = (t: SavedThumbnail) => {
    reset()
    setComposition(t.composition)
    toast('Composition loaded — head to Create to continue', 'success')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Gallery</h1>
          <p className="text-secondary text-sm">{thumbnails.length} thumbnail{thumbnails.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Link href="/create">
          <Button>
            <Wand2 size={14} />
            Create new
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      {thumbnails.length > 0 && (
        <div className="flex bg-surface-2 rounded-xl p-1 w-fit mb-6 border border-border">
          {[
            { id: 'all', label: 'All', count: thumbnails.length },
            { id: 'youtube', label: 'YouTube', count: thumbnails.filter((t) => t.composition.type === 'youtube').length },
            { id: 'library', label: 'Templates', count: thumbnails.filter((t) => t.composition.type === 'library').length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setFilter(id as typeof filter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === id ? 'bg-accent text-white shadow-sm' : 'text-secondary hover:text-primary'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === id ? 'bg-white/20' : 'bg-surface-3'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="group rounded-xl overflow-hidden border border-border bg-surface hover:border-border-bright transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden">
                <GalleryImage
                  src={t.url}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setPreview(t)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm"
                    title="Preview"
                  >
                    <Eye size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDownload(t)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm"
                    title="Download"
                  >
                    <Download size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="w-9 h-9 rounded-full bg-red-900/60 hover:bg-red-900/80 flex items-center justify-center backdrop-blur-sm"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-300" />
                  </button>
                </div>

                {/* Source badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={t.composition.type === 'youtube' ? 'info' : 'default'}>
                    {t.composition.type === 'youtube' ? <Youtube size={9} /> : <BookImage size={9} />}
                    {t.composition.type === 'youtube' ? 'YouTube' : 'Template'}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-primary truncate mb-1">{t.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(t.createdAt)}
                  </span>
                  <button
                    onClick={() => handleUseAsTemplate(t)}
                    className="text-xs text-accent hover:text-accent-hover font-medium"
                  >
                    Use as template →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
            <GalleryHorizontalEnd size={24} className="text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">
            {filter === 'all' ? 'No thumbnails yet' : `No ${filter === 'youtube' ? 'YouTube' : 'template'} thumbnails`}
          </h3>
          <p className="text-sm text-muted mb-6 max-w-xs">
            Create your first AI-powered thumbnail and save it here
          </p>
          <Link href="/create">
            <Button>
              <Wand2 size={14} />
              Create thumbnail
            </Button>
          </Link>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-w-4xl w-full bg-surface rounded-2xl overflow-hidden border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video">
              <GalleryImage src={preview.url} alt={preview.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary">{preview.title}</h3>
                <p className="text-sm text-muted mt-1">{formatDate(preview.createdAt)}</p>
                {preview.instructions && (
                  <p className="text-xs text-secondary mt-2 max-w-lg">"{preview.instructions}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <ExportMenu url={preview.url} />
                <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
