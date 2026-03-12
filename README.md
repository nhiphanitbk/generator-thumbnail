# ThumbCraft — AI Thumbnail Studio

An AI-powered YouTube thumbnail generator built with Next.js. Create professional thumbnails using your own face profile and reference images, with AI-generated composition and polish.

## Features

- **Face Profile** — Upload portrait photos; the AI uses your likeness when placing a face in thumbnails
- **Create Wizard** — 5-step flow: composition → assets → instructions → generate → polish
- **Composition Sources** — Paste a YouTube URL or pick from 10 built-in layout templates
- **Asset Generation** — Upload images or generate standalone assets via AI
- **Thumbnail Generation** — Two variants generated in parallel using Gemini AI
- **Polish Step** — Enhance the selected variant with an additional AI pass
- **Gallery** — Thumbnails saved to `localStorage` with compressed previews; persist across reloads

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, Framer Motion |
| State | Zustand with `localStorage` persistence |
| Image AI | Google Gemini (`gemini-3.1-flash-image-preview`) |
| Analysis AI | Claude (Anthropic API or proxy) |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```env
# Google Gemini — required for image generation
GEMINI_API_KEY=your_gemini_api_key_here

# Claude — choose one option:

# Option A: Direct Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Option B: Proxy (used if ANTHROPIC_API_KEY is not set)
PROXY_BASE=https://your-proxy.example.com/v1
PROXY_KEY=your_proxy_key_here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/youtube/extract` | POST | Extract thumbnail from a YouTube URL |
| `/api/generate/analyze` | POST | Claude reference analysis + prompt engineering |
| `/api/generate/thumbnail` | POST | Gemini image generation (with optional face) |
| `/api/generate/polish` | POST | Enhance selected thumbnail via Gemini |
| `/api/generate/asset` | POST | Generate a standalone square asset |

## Project Structure

```text
app/
  (routes)/           # Page routes
  api/                # API route handlers
components/
  create/steps/       # Wizard step components
  ui/                 # Shared UI primitives
lib/
  claude.ts           # Claude API client (direct or proxy)
  gemini-image.ts     # Gemini image generation wrappers
  store.ts            # Zustand stores (profile, gallery, wizard)
  types.ts            # TypeScript types
  utils.ts            # Shared utilities (compression, download, etc.)
  templates.ts        # 10 built-in composition templates
```

## Storage Notes

All data is stored in `localStorage` — no database required.

- **Face Profile** (`face-profile`) — up to 5 portrait photos, compressed to 512×512 JPEG
- **Gallery** (`thumbnail-gallery`) — thumbnails compressed to 640×360 JPEG (~60 KB each)
- **Wizard state** — in-memory only, cleared on reset or page refresh

## Environment Variables Reference

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `ANTHROPIC_API_KEY` | One of | Direct Anthropic API key |
| `PROXY_BASE` | One of | Proxy base URL (e.g. `https://claude.24h.dev/v1`) |
| `PROXY_KEY` | One of | API key for the proxy |
