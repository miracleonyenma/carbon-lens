# Carbon Lens 🌿

**See the carbon cost of everything you buy.** AI-powered carbon footprint tracking using Google Gemini — scan receipts, photograph products, or point your live camera at items to instantly estimate CO₂e emissions and discover lower-carbon alternatives.

**[Live Demo](https://carbon-lens-pi.vercel.app/)** · **[DEV Challenge Submission](https://dev.to/miracleio/how-to-build-a-carbon-footprint-tracker-32a4)**

---

## Features

| Feature | Description |
|---|---|
| **Photo Scanning** | Upload receipt/product photos (JPEG, PNG, WebP, HEIC up to 10MB). Gemini identifies items and estimates carbon. |
| **Live Camera** | Point your camera at items and tap Scan. Frames are scaled to 640px and compressed to JPEG 0.6 for fast analysis. |
| **Text Input** | Type or paste items (e.g. `1 kg chicken breast`) — up to 5000 characters. |
| **Smart Swaps** | Every medium/high-impact item includes a lower-carbon alternative with exact kg CO₂ savings. |
| **Impact Badges** | 🟢 Low (<2 kg) · 🟡 Medium (2-5 kg) · 🔴 High (>5 kg) per item. |
| **Dashboard** | Stat cards, monthly trend chart, category breakdown pie chart, recent scans. |
| **Climate Context** | Live atmospheric CO₂ plus global climate signals like warming, renewables growth, forest loss, ice loss, species threat, and plastic production. Shows the regional context Gemini is using when available. |
| **Scan History** | Paginated history with expandable item details, swap suggestions, and AI insights. |
| **BYOK** | Bring Your Own Gemini API Key — stored in localStorage, sent directly to Google via `x-gemini-key` header. |
| **Dark Mode** | Full light/dark theme support via `next-themes`. |

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Frontend | React, Tailwind CSS v4, shadcn/ui, Motion, Recharts | React 19.2.3 |
| AI | Google Gemini via `@google/generative-ai` | `gemini-2.5-flash` |
| Database | MongoDB via Mongoose | 9.2.3 |
| Auth | Custom JWT with `jose` (HS256), cookie-based sessions | 7-day expiry |
| State | Zustand + `usePersistedState` (localStorage-backed) | 5.0.11 |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Google Gemini API key ([get one free](https://aistudio.google.com/apikey))

### Setup

```bash
git clone https://github.com/miracleonyenma/carbon-lens.git
cd carbon-lens
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME="Carbon Lens"

MONGO_URI=mongodb://localhost:27017/carbon-lens
ENCRYPTION_KEY=<32-character-random-string>

GEMINI_API_KEY=<your-gemini-api-key>
```

> `ENCRYPTION_KEY` must be exactly 32 characters. Used for JWT session encryption with HS256.

### Run

```bash
npm run dev        # Starts on http://localhost:4000
npm run build      # Production build
npm run start      # Start production server
```

## Architecture

### Project Structure

```text
app/
├── page.tsx                          # Landing page
├── layout.tsx                        # Root layout (providers, fonts, theme)
├── (auth)/                           # Auth pages (login, register)
├── (app)/                            # Authenticated app shell
│   └── dashboard/
│       ├── page.tsx                   # Dashboard (stats, charts)
│       ├── scan/page.tsx              # Photo upload + text input scanning
│       ├── live/page.tsx              # Live camera analysis
│       └── history/page.tsx           # Paginated scan history
├── api/v1/
│   ├── auth/                         # Login, register, logout, session, OTP, magic-link
│   └── receipts/
│       ├── scan/route.ts             # POST — image upload or text analysis
│       ├── camera/route.ts           # POST — live camera frame analysis
│       ├── route.ts                  # GET  — paginated receipt list
│       └── stats/route.ts            # GET  — aggregated stats & charts
components/
├── carbon/                           # Domain components
│   ├── api-key-dialog.tsx            # BYOK dialog + useGeminiKey hook
│   ├── live-camera.tsx               # Camera feed, capture, analyze
│   ├── receipt-upload.tsx            # Drag & drop image upload
│   ├── scan-result.tsx               # Analysis result display
│   ├── carbon-chart.tsx              # Trend & category charts (Recharts)
│   ├── impact-badge.tsx              # 🟢🟡🔴 badge component
│   └── app-nav.tsx                   # In-app navigation
├── providers/                        # AuthProvider, AuthGuard
└── ui/                               # shadcn/ui primitives
lib/
├── gemini.ts                         # Gemini AI integration (prompts, parsing, error handling)
├── session.ts                        # JWT encrypt/decrypt (jose)
├── mongodb.ts                        # Mongoose connection singleton
└── models/
    ├── Receipt.ts                    # Receipt + ReceiptItem schemas
    └── User.ts                       # User schema
```

### API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/receipts/scan` | ✅ | Analyze image (multipart) or text (JSON). Saves to DB. |
| `POST` | `/api/v1/receipts/camera` | ✅ | Analyze camera frame (base64). Returns result only (no DB save). |
| `GET` | `/api/v1/receipts` | ✅ | List receipts. Query: `?page=1&limit=10` (max 50). |
| `GET` | `/api/v1/receipts/stats` | ✅ | Aggregated stats: totals, monthly trend (6mo), categories, impact distribution. |
| `GET` | `/api/v1/system/climate` | — | Global climate context: live CO₂ plus editorial planetary signals for dashboard and AI insights. |
| `POST` | `/api/v1/auth/register` | — | Create account (email/password). |
| `POST` | `/api/v1/auth/login` | — | Login, returns `auth-token` cookie. |
| `POST` | `/api/v1/auth/logout` | — | Clear session cookie. |
| `GET` | `/api/v1/auth/session` | ✅ | Validate session, return user info. |

### Gemini Integration

**Model:** `gemini-2.5-flash`

Three specialized prompts share a common response schema and carbon guidelines:

```text
IMAGE_ANALYSIS_PROMPT   → Receipt photos, product images, meal photos
TEXT_ANALYSIS_PROMPT    → Typed/pasted item lists
LIVE_CAMERA_PROMPT      → Real-time camera frames (optimized for speed)
```

The scan and camera prompts are also augmented with shared climate context so Gemini can write more grounded, timely user insights without changing item-level carbon estimates.

Gemini also receives coarse regional context when available:

- request-level country and currency via Vercel headers or `ipinfo.io`
- persisted profile geo for signed-in users
- automatic geo backfill for older accounts during login, OTP verify, magic-link verify, or session refresh

This regional context is used to localize insight wording and swap framing. It is not used to invent exact regional lifecycle factors, prices, or policy claims.

**Carbon Guidelines** — 30+ reference values embedded in every prompt:

```text
Beef: ~27 kg CO₂e/kg    Chicken: ~6.9 kg CO₂e/kg    Tofu: ~2 kg CO₂e/kg
Jeans: ~33 kg CO₂e      Laptop: ~300-400 kg CO₂e     Gasoline: ~2.3 kg CO₂e/L
```

**Response Format** — Structured JSON with no markdown fencing:

```json
{
  "storeName": "string | null",
  "receiptDate": "YYYY-MM-DD | null",
  "items": [{
    "name": "string",
    "quantity": 1,
    "unit": "kg | item | liter",
    "category": "meat | dairy | produce | grains | beverages | snacks | frozen | household | seafood | clothing | electronics | transport | other",
    "carbonKg": 2.5,
    "impactLevel": "low | medium | high",
    "suggestedSwap": "string",
    "swapSavingsKg": 1.5
  }],
  "insights": "2-3 sentence personalized insight"
}
```

**Error Classification:**

| Error | Code | Behavior |
|---|---|---|
| 429 + `limit: 0` | `NO_QUOTA` | Key has zero free-tier allocation — permanent |
| 429 + retry delay | `RATE_LIMIT` | Transient — UI shows countdown timer |
| 401/403 | `INVALID_KEY` | Bad API key — prompt to update |
| No key configured | `NO_API_KEY` | Prompt to add key |

### BYOK (Bring Your Own Key)

Users can provide their own Gemini API key via a settings dialog. The key is:

1. Stored in browser `localStorage` (via Zustand-backed `usePersistedState`)
2. Sent to the server via `x-gemini-key` HTTP header
3. Passed directly to `new GoogleGenerativeAI(key)` — never persisted server-side
4. Used instead of the server's `GEMINI_API_KEY` env variable

### Data Model

```typescript
// Receipt (MongoDB)
{
  userId: ObjectId,
  storeName?: string,
  receiptDate?: Date,
  items: [{
    name: string,
    quantity: number,
    unit: "kg" | "item" | "liter",
    category: string,
    carbonKg: number,
    impactLevel: "low" | "medium" | "high",
    suggestedSwap?: string,
    swapSavingsKg?: number
  }],
  totalCarbonKg: number,
  totalItems: number,
  insights?: string,
  createdAt: Date,
  updatedAt: Date
}

// User (MongoDB)
{
  email: string,
  ...
  geo?: {
    country?: string,
    currency?: string,
    source?: string,
    detectedAt?: Date
  }
}
```

### Auth Flow

1. User registers/logs in via `/api/v1/auth/register` or `/api/v1/auth/login`
2. Server creates a JWT (HS256, 7-day expiry) using `jose` and sets it as an `auth-token` httpOnly cookie
3. `AuthProvider` checks session on mount via `/api/v1/auth/session`
4. Missing user geo is backfilled opportunistically from the incoming request during auth/session flows
5. Dashboard climate cards can display the current regional context source used for AI grounding
6. `AuthGuard` wraps protected routes — redirects to `/login?returnUrl=...` if unauthenticated

### Live Camera Pipeline

```text
getUserMedia (1280x720) → canvas scale (max 640px) → JPEG 0.6 quality
  → base64 data URL → POST /api/v1/receipts/camera
  → strip data URL prefix → analyzeCameraFrame(base64, mimeType, apiKey?)
  → Gemini gemini-2.5-flash → parseGeminiResponse → JSON result
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_APP_NAME` | Yes | Display name |
| `MONGO_URI` | Yes | MongoDB connection string |
| `ENCRYPTION_KEY` | Yes | 32-char string for JWT signing (HS256) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (fallback when no BYOK) |
| `IPINFO_TOKEN` | No | Optional token for `ipinfo.io` request geolocation fallback used for regional AI context and geo backfill. |
| `MAIL_USER` | No | SMTP from address |
| `MAIL_PASS` | No | SMTP password |
| `RESEND_API_KEY` | No | Resend email API key |
| `DEFAULT_MAIL_PROVIDER` | No | `resend` or `smtp` |

## Deployment

### Vercel

```bash
npm run build
vercel --prod
```

Set all environment variables in Vercel dashboard. `MONGO_URI` should point to MongoDB Atlas or another cloud-hosted instance.

## License

MIT
