import type { LibraryTemplate } from './types'

// SVG-based placeholder thumbnails that visually represent each layout type
function makeSvgPreview(content: string, bg: string = '#1a1a2e'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <rect width="1280" height="720" fill="${bg}"/>
    ${content}
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// Generate previews on server — for client we'll use inline SVGs
export const LIBRARY_TEMPLATES: LibraryTemplate[] = [
  {
    id: 'reaction-face-left',
    name: 'Reaction Face',
    description: 'Large expressive face on the left with bold text on the right. The classic YouTube format.',
    previewUrl: '',
    category: 'reaction',
    tags: ['face', 'text', 'classic', 'expressive'],
    promptHint: 'person with exaggerated surprised/shocked expression on left side',
    layoutDescription: 'Large face taking up 50-60% of left frame, bold colorful text in right 40%, bright solid color background',
  },
  {
    id: 'split-screen',
    name: 'Split Screen',
    description: 'Left and right panels showing contrast, comparison, or before/after.',
    previewUrl: '',
    category: 'split',
    tags: ['comparison', 'before-after', 'contrast', 'two-panel'],
    promptHint: 'split down the middle, two contrasting scenes or subjects',
    layoutDescription: 'Vertical split 50/50, left side darker tone, right side brighter, dividing line visible',
  },
  {
    id: 'dramatic-closeup',
    name: 'Dramatic Close-up',
    description: 'Face fills the entire frame with intense, cinematic lighting.',
    previewUrl: '',
    category: 'dramatic',
    tags: ['face', 'cinematic', 'intense', 'close-up'],
    promptHint: 'extreme close-up of face with dramatic cinematic lighting',
    layoutDescription: 'Face fills 80% of frame, dramatic side lighting, dark vignette edges, minimal text',
  },
  {
    id: 'vs-battle',
    name: 'VS Battle',
    description: 'Two subjects facing each other with a VS badge in the center.',
    previewUrl: '',
    category: 'comparison',
    tags: ['vs', 'comparison', 'competition', 'two-subjects'],
    promptHint: 'two subjects facing each other, VS symbol in center',
    layoutDescription: 'Subject 1 on left facing right, Subject 2 on right facing left, bold VS text center, energetic background',
  },
  {
    id: 'pointing-at',
    name: 'Pointing At',
    description: 'Person pointing dramatically at a key element or piece of information.',
    previewUrl: '',
    category: 'reaction',
    tags: ['pointing', 'face', 'attention', 'direction'],
    promptHint: 'person pointing dramatically at element with exaggerated expression',
    layoutDescription: 'Person on left or right, arm extended pointing toward opposite side, element being pointed at is prominent',
  },
  {
    id: 'dark-cinematic',
    name: 'Dark Cinematic',
    description: 'Moody, high-contrast cinematic composition with dramatic lighting.',
    previewUrl: '',
    category: 'cinematic',
    tags: ['dark', 'moody', 'cinematic', 'dramatic'],
    promptHint: 'dark cinematic scene with dramatic lighting and atmosphere',
    layoutDescription: 'Dark background, strong rim/key lighting, subject centered or rule-of-thirds, film grain texture',
  },
  {
    id: 'text-heavy',
    name: 'Text Heavy',
    description: 'Bold, colorful typography dominates with a supporting image or background.',
    previewUrl: '',
    category: 'text-heavy',
    tags: ['text', 'bold', 'typography', 'minimal'],
    promptHint: 'bold text design with background illustration, minimal imagery',
    layoutDescription: 'Large bold text occupies 60-70% of frame, supporting image or gradient background, vibrant color scheme',
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Product prominently displayed with person reacting or endorsing it.',
    previewUrl: '',
    category: 'product',
    tags: ['product', 'review', 'unboxing', 'showcase'],
    promptHint: 'person holding or pointing at product with excited expression',
    layoutDescription: 'Product large and centered, person in background or corner with excited expression, clean bright background',
  },
  {
    id: 'grid-collage',
    name: 'Grid Collage',
    description: 'Multiple images arranged in a clean grid showing variety or a list.',
    previewUrl: '',
    category: 'minimal',
    tags: ['grid', 'collage', 'multiple', 'list'],
    promptHint: 'clean grid layout with multiple panels or images',
    layoutDescription: 'Grid of 4-6 images, clean borders, title text at top or bottom, organized visual hierarchy',
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, elegant composition with a clean background and focused subject.',
    previewUrl: '',
    category: 'minimal',
    tags: ['minimal', 'clean', 'elegant', 'simple'],
    promptHint: 'clean minimal composition with single focused subject',
    layoutDescription: 'Subject centered with generous negative space, subtle gradient background, simple typography, premium feel',
  },
]

// Gradient colors for each template (used in CSS previews)
export const TEMPLATE_GRADIENTS: Record<string, string> = {
  'reaction-face-left': 'from-yellow-500 to-red-600',
  'split-screen': 'from-blue-600 to-purple-700',
  'dramatic-closeup': 'from-gray-900 to-gray-700',
  'vs-battle': 'from-red-600 to-blue-600',
  'pointing-at': 'from-green-500 to-teal-600',
  'dark-cinematic': 'from-gray-950 to-slate-800',
  'text-heavy': 'from-orange-500 to-pink-600',
  'product-showcase': 'from-cyan-500 to-blue-500',
  'grid-collage': 'from-violet-500 to-indigo-600',
  'minimal-clean': 'from-slate-300 to-slate-500',
}

export const CATEGORY_LABELS: Record<LibraryTemplate['category'], string> = {
  reaction: 'Reaction',
  split: 'Split Screen',
  dramatic: 'Dramatic',
  minimal: 'Minimal',
  comparison: 'Comparison',
  cinematic: 'Cinematic',
  'text-heavy': 'Text Heavy',
  product: 'Product',
}
