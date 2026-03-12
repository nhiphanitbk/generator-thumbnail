import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw video ID
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnailUrls(videoId: string) {
  return {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function base64ToBlob(base64: string): Blob {
  const [meta, data] = base64.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(data)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function estimateBase64Size(base64: string): number {
  return Math.ceil((base64.length * 3) / 4)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

export async function downloadImageResized(
  url: string,
  filename: string,
  width: number,
  height: number,
  crop = false,
): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      if (crop) {
        const srcAspect = img.width / img.height
        const dstAspect = width / height
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        if (srcAspect > dstAspect) {
          sw = img.height * dstAspect
          sx = (img.width - sw) / 2
        } else {
          sh = img.width / dstAspect
          sy = (img.height - sh) / 2
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
      } else {
        ctx.drawImage(img, 0, 0, width, height)
      }

      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((resized) => {
        if (!resized) { reject(new Error('Export failed')); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(resized)
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        resolve()
      }, 'image/jpeg', 0.95)
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
