'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  User,
  Wand2,
  GalleryHorizontalEnd,
  BookImage,
  ChevronRight,
} from 'lucide-react'
import { useProfileStore } from '@/lib/store'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/profile', icon: User, label: 'Face Profile' },
  { href: '/create', icon: Wand2, label: 'Create' },
  { href: '/gallery', icon: GalleryHorizontalEnd, label: 'Gallery' },
  { href: '/library', icon: BookImage, label: 'Library' },
]

export function Nav() {
  const pathname = usePathname()
  const { profile } = useProfileStore()

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col bg-surface border-r border-border h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-transform">
            TC
          </div>
          <div>
            <div className="font-semibold text-sm text-primary leading-none">ThumbCraft</div>
            <div className="text-xs text-muted mt-0.5">AI Studio</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-surface-2'
              )}
            >
              <Icon size={16} className={cn(isActive ? 'text-white' : 'text-muted group-hover:text-secondary')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile status */}
      <div className="p-3 border-t border-border">
        <Link href="/profile" className="block p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">
          <div className="flex items-center gap-3">
            {profile?.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.images[0]}
                alt="Face profile"
                className="w-8 h-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center">
                <User size={14} className="text-muted" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-primary truncate">
                {profile ? 'Face Profile Set' : 'No Face Profile'}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {profile ? `${profile.images.length} photo${profile.images.length > 1 ? 's' : ''}` : 'Add your face →'}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}
