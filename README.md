# ThumbCraft — AI Thumbnail Studio

An AI-powered YouTube thumbnail generator built with Next.js. Create professional thumbnails by referencing real YouTube compositions, uploading your own assets, and letting AI preserve the layout while applying your personal brand.

## Features

- **Face Profile** — Upload portrait photos; AI uses your exact likeness when placing a face in thumbnails
- **Create Wizard** — 5-step flow: composition → assets → instructions → generate → polish
- **Composition Sources** — Paste a YouTube URL or pick from 10 built-in layout templates
- **Asset Generation** — Upload images or generate standalone assets via AI (square, isolated)
- **Smart Generation** — Reference image + assets are passed directly to Gemini as visual context (not just text descriptions), ensuring accurate layout preservation and asset integration
- **Two Variants** — Both generated from the same analysis; variant 2 uses a slightly shifted expression and angle
- **Polish Step** — Enhance the selected variant with a dedicated quality-improvement AI pass
- **CTR Analysis** — AI scores the generated thumbnail 1–10 with specific strengths and improvement suggestions
- **Gallery** — Thumbnails saved to `localStorage` with compressed previews; persist across reloads

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, Framer Motion |
| State | Zustand with `localStorage` persistence |
| Image Generation | Google Gemini (`gemini-3-pro-image-preview`) |
| Analysis AI | Google Gemini (`gemini-2.5-flash`) |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```env
# Google Gemini — required for all AI features (image generation + analysis)
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your key at [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Generation Pipeline

```text
YouTube URL / Template
        ↓
  Extract reference image
        ↓
  Gemini Vision Analysis          ← deep 5-axis analysis (background, lighting,
  (gemini-2.5-flash)                subject, text, color palette)
        ↓
  generationPrompt (300–450 words, 7 labeled sections)
        ↓
  Gemini Image Generation         ← receives: reference image + asset images + prompt
  (gemini-3-pro-image-preview)      as visual input (not just text)
        ↓
  Variant 1 + Variant 2
        ↓
  Polish pass (optional)          ← image-to-image quality enhancement
```

### Prompt Architecture

User-written instructions are **not** the full prompt sent to the AI. They are injected as a targeted "surgical changes" section inside a large structured system prompt that separately defines:

1. **Scene Foundation** — exact background reproduction from reference
2. **Lighting** — direction, color temperature, shadow placement
3. **Subject Placement & Pose** — frame position, framing, body orientation
4. **Subject Appearance** — clothing colors, expression, accessories
5. **Asset Integration** — where each uploaded asset sits in the scene
6. **Text & Graphics** — text element positions and styles
7. **Style & Quality** — cinematic grade, sharpness, no watermarks

### Image Context Passed to Generation

| Input | Purpose |
| --- | --- |
| Reference thumbnail (1st image) | Layout blueprint — background, lighting, composition |
| User asset images (middle) | Props/products to integrate naturally into the scene |
| Face reference photos (last) | Identity only — skin tone, facial structure, features |

## API Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/youtube/extract` | POST | Extract thumbnail from a YouTube URL |
| `/api/generate/analyze` | POST | Gemini vision analysis + structured prompt engineering |
| `/api/generate/thumbnail` | POST | Gemini image generation (reference + assets + optional face) |
| `/api/generate/polish` | POST | Image-to-image quality enhancement pass |
| `/api/generate/asset` | POST | Generate a standalone square asset |
| `/api/generate/ctr-score` | POST | AI click-through rate analysis of a thumbnail |

## Project Structure

```text
app/
  api/                    # API route handlers
  create/                 # Wizard page
  gallery/                # Saved thumbnails page
  library/                # Template browser
  profile/                # Face profile management
components/
  create/steps/           # Wizard step components (5 steps)
  ui/                     # Shared UI primitives
lib/
  ai.ts                   # Gemini text + vision analysis helpers
  gemini-image.ts         # Gemini image generation (thumbnail, face, polish, asset)
  prompts.ts              # All prompt definitions — edit here to tune AI behavior
  store.ts                # Zustand stores (profile, gallery, wizard)
  types.ts                # TypeScript types
  templates.ts            # 10 built-in composition templates
  utils.ts                # Utilities (compression, download, ID generation)
```

## Tuning AI Behavior

All prompts live in **`lib/prompts.ts`**. Edit this file to change how the AI analyzes, generates, or polishes thumbnails — no other files need to change.

| Function | Controls |
| --- | --- |
| `buildAnalysisPrompt()` | What Gemini extracts from the reference + how the generation prompt is structured |
| `buildFaceGenerationPrompt()` | How Gemini interprets multi-image input (reference / assets / face roles) |
| `buildPolishGenerationPrompt()` | What enhancements are applied in the polish pass |
| `buildAutoInstructionsPrompt()` | How AI generates suggested instructions for the user |
| `buildAssetPrompt()` | Style of standalone asset generation |
| `GENERATION_HARD_RULES` | Constraints that are never relaxed (background, lighting, clothing preservation) |
| `GENERATION_SOFT_RULES` | Where user customisation is applied |

## Storage Notes

All data is stored in `localStorage` — no database required.

- **Face Profile** (`face-profile`) — up to 5 portrait photos, compressed to 512×512 JPEG
- **Gallery** (`thumbnail-gallery`) — thumbnails compressed to 640×360 JPEG (~60 KB each)
- **Wizard state** — in-memory only, cleared on reset or page refresh

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Google AI Studio key — used for both image generation and analysis |
