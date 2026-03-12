'use client'

import Link from 'next/link'
import { useGalleryStore, useProfileStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/toast'
import {
  Wand2,
  User,
  GalleryHorizontalEnd,
  BookImage,
  ArrowRight,
  ImageIcon,
  Sparkles,
  Layers,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const { profile } = useProfileStore()
  const { thumbnails } = useGalleryStore()

  const recent = thumbnails.slice(0, 4)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Toaster />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Welcome to ThumbCraft</h1>
            <p className="text-secondary text-sm">AI-powered YouTube thumbnail studio</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link href="/create">
          <div className="group relative overflow-hidden rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all duration-200 cursor-pointer p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-8 translate-x-8" />
            <Wand2 size={24} className="text-accent mb-3" />
            <h3 className="font-semibold text-primary mb-1">Create Thumbnail</h3>
            <p className="text-sm text-secondary leading-relaxed">
              AI-powered creation from YouTube reference or library templates
            </p>
            <div className="flex items-center gap-1 text-accent text-sm font-medium mt-4">
              Start creating <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        <div className="grid grid-rows-3 gap-3">
          <Link href="/profile">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors cursor-pointer">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profile ? 'bg-green-500/20' : 'bg-surface-3'}`}>
                <User size={14} className={profile ? 'text-green-400' : 'text-muted'} />
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Face Profile</div>
                <div className="text-xs text-muted">
                  {profile ? `${profile.images.length} photo${profile.images.length > 1 ? 's' : ''} saved` : 'Set up your face'}
                </div>
              </div>
              {profile && <Badge variant="success" className="ml-auto">Set</Badge>}
            </div>
          </Link>

          <Link href="/gallery">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
                <GalleryHorizontalEnd size={14} className="text-muted" />
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Gallery</div>
                <div className="text-xs text-muted">{thumbnails.length} saved thumbnail{thumbnails.length !== 1 ? 's' : ''}</div>
              </div>
              {thumbnails.length > 0 && <Badge variant="info" className="ml-auto">{thumbnails.length}</Badge>}
            </div>
          </Link>

          <Link href="/library">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
                <BookImage size={14} className="text-muted" />
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Template Library</div>
                <div className="text-xs text-muted">10 composition templates</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">How it works</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Layers, step: '1', title: 'Choose Reference', desc: 'Paste a YouTube URL or pick a template layout' },
            { icon: ImageIcon, step: '2', title: 'Add Assets', desc: 'Upload images or generate elements with AI' },
            { icon: User, step: '3', title: 'Set Instructions', desc: 'Describe what to replace, keep, or generate' },
            { icon: Sparkles, step: '4', title: 'Generate & Polish', desc: 'AI creates 2 variants, you pick one and refine' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <Card key={step} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step}
                  </div>
                  <Icon size={14} className="text-secondary" />
                </div>
                <div className="text-sm font-medium text-primary mb-1">{title}</div>
                <div className="text-xs text-muted leading-relaxed">{desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent work */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Recent Work</h2>
            <Link href="/gallery">
              <Button variant="ghost" size="sm">View all <ArrowRight size={12} /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {recent.map((t) => (
              <div key={t.id} className="group relative rounded-xl overflow-hidden border border-border bg-surface-2 aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.url} alt={t.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white font-medium truncate">{t.title}</p>
                  <p className="text-xs text-white/60">{formatDate(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {thumbnails.length === 0 && !profile && (
        <Card className="mt-6 border-dashed border-border-bright">
          <CardContent className="py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-muted" />
            </div>
            <h3 className="font-medium text-primary mb-1">Ready to get started?</h3>
            <p className="text-sm text-muted mb-4 max-w-xs mx-auto">
              Set up your face profile and create your first AI-powered thumbnail
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/profile">
                <Button variant="secondary" size="sm">Set up face profile</Button>
              </Link>
              <Link href="/create">
                <Button size="sm">Create thumbnail</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
