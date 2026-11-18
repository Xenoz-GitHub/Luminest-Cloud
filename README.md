# LumiNest

**Your little space for everything**

A mobile-first Progressive Web App for personal cloud storage with smart file organization, document previews, AI-powered summarization, and secure branded file sharing.

## Links

- **Official website:** https://luminest-cloud.vercel.app
- **App listing:** https://appbuildersph.com/apps/luminest-cloud

## Project Status

The LumiNest application is implemented: authentication, file library, folders,
tags, search, previews, AI summaries, branded sharing, profile/settings and the
PWA shell. `npm run build` and `npm test` pass locally.

The Supabase migration still needs to be applied to a real project, and the
authenticated end-to-end flows should be exercised there before deployment. No
remote migration or deployment is performed automatically.

## Technology Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, React
- **Styling**: Tailwind CSS with LumiNest brand colors
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (Authentication, PostgreSQL, Storage)
- **AI**: Free-tier provider via any OpenAI-compatible API (Gemini, Groq, OpenRouter, Mistral, Cerebras)
- **Hosting**: Vercel

## Brand Colors

- Primary: `#B9A5EA` (Soft lavender)
- Secondary: `#D9CCF5` (Light lilac)
- Background: `#FFFCFF` (Milky white)
- Blush: `#F7DCE8`
- Soft Blue: `#DCEBFA`
- Cream: `#FFF0D8`
- Main Text: `#504465` (Deep muted purple)
- Secondary Text: `#9388A5`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles with Tailwind
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── navigation/       # Navigation components
│   ├── files/            # File management components
│   ├── folders/          # Folder components
│   ├── mascot/           # Mascot display component
│   ├── sharing/          # File sharing components
│   ├── dashboard/        # Dashboard components
│   └── preview/          # File preview components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client utilities
│   │   ├── client.ts    # Browser client
│   │   ├── server.ts    # Server client
│   │   └── middleware.ts # Auth middleware
│   └── utils.ts         # Helper functions (cn)
├── hooks/               # Custom React hooks
├── services/            # Business logic services
└── types/               # TypeScript types

public/
└── mascot/              # Mascot PNG assets
    ├── expressions/     # Emotion expressions
    ├── poses/          # Action poses
    └── states/         # UI state illustrations
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `SHARE_TOKEN_SECRET` - Long random string used to sign share links
- `NEXT_PUBLIC_APP_URL` - Public application URL (http://localhost:3000 for development)
- `AI_PROVIDER` - Free provider preset (see below)
- `AI_API_KEY` - One or more free provider API keys; comma-separate them or use `AI_API_KEY_1`, `AI_API_KEY_2`, ...
- `AI_MODEL` - Optional model override; empty uses the preset default
- `AI_BASE_URL` - Only for custom OpenAI-compatible endpoints
- `AI_API_KEY_<PROVIDER>` - Optional extra provider pools for cross-provider fallback (for example `AI_API_KEY_GEMINI`)

### Free AI providers

LumiNest does **not** require OpenAI or Anthropic. Summaries run through a
free-tier, OpenAI-compatible provider. Pick one and paste its API key:

| `AI_PROVIDER` | Free key | Default model | Notes |
|---|---|---|---|
| `gemini` | [Google AI Studio](https://aistudio.google.com/app/apikey) | `gemini-3.8-flash` | Generous free tier; free-tier prompts may be used to improve Google products |
| `groq` | [Groq Console](https://console.groq.com/keys) | `llama-3.3-70b-versatile` | Very fast; per-minute and per-day limits |
| `openrouter` | [OpenRouter Keys](https://openrouter.ai/settings/keys) | `meta-llama/llama-3.3-70b-instruct:free` | Use any model ending in `:free`; availability changes |
| `mistral` | [Mistral Console](https://console.mistral.ai/api-keys) | `mistral-small-latest` | Rate-limited free experiment tier |
| `cerebras` | [Cerebras Cloud](https://cloud.cerebras.ai/) | `llama-3.3-70b` | Daily token limits |

Example `.env.local` for Gemini:

```bash
AI_PROVIDER=gemini
AI_API_KEY=your-google-ai-studio-key
AI_MODEL=
```

For OpenRouter, set the model explicitly:

```bash
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-...
AI_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

### Multiple keys and automatic fallback

`AI_API_KEY` accepts a comma-separated pool. LumiNest tries the keys in order
and moves to the next one when a key is invalid, rate-limited or temporarily
unavailable:

```bash
AI_PROVIDER=groq
AI_API_KEY=gsk_key_one,gsk_key_two,gsk_key_three
```

Spaces, newlines, trailing commas and duplicate entries are ignored, so values
copied from dashboards work as-is. All keys in `AI_API_KEY` must belong to the
provider selected by `AI_PROVIDER`.

To add keys one at a time without editing the base value, create
`AI_API_KEY_1`, `AI_API_KEY_2`, ... with one key each. They are tried after
`AI_API_KEY` in numeric order. The same suffix pattern works for provider pools,
for example `AI_API_KEY_GEMINI_1` and `AI_API_KEY_GEMINI_2`.

For cross-provider fallback, add `AI_API_KEY_<PROVIDER>` pools. The primary
provider's keys run first, then the other pools in preset order (`gemini`,
`groq`, `openrouter`, `mistral`, `cerebras`, `openai-compatible`):

```bash
AI_PROVIDER=groq
AI_API_KEY=gsk_key_one,gsk_key_two
AI_API_KEY_GEMINI=google_key_one,google_key_two
```

Use `AI_MODEL_<PROVIDER>` and `AI_BASE_URL_<PROVIDER>` to override a fallback
provider's defaults. Only add a provider pool if you are comfortable sending
documents to that provider's free tier; fallback can route a request to the next
provider when earlier keys fail.

To add another key later, append it to the same value in `.env.local` or in
**Vercel → Project → Settings → Environment Variables**, then redeploy so the
updated value is picked up. No code change is required.

Free tiers change. If a model ID is retired, choose a current free model from
the provider dashboard and set `AI_MODEL` to it — no code change is needed.


### AI credits

AI actions (currently document summaries) draw from a per-user credit budget that
resets on a rolling window — **10 credits every 2 hours** on the free plan. A
summary costs 1 credit for small documents and up to 5 for very large ones. The
current balance and reset time are shown in the summary panel.

The budget is defined in `AI_PLANS` (`src/lib/constants.ts`) and the window is
`AI_CREDIT_WINDOW_SECONDS`. To add paid plans later, add an entry to `AI_PLANS`
and set `profiles.plan` to that id — the credit service reads the plan from the
database, so no other code changes are needed. Usage is logged in
`ai_usage_log` for future subscription metering.

Credits are enforced by the `consume_ai_credits()` SQL function (atomic, so
concurrent requests can't overspend). If the credits migration has not been
applied yet, the app fails open and relies on the in-memory endpoint rate
limiter until the migration is pushed.

### 3. Initialize Supabase

```bash
# Initialize Supabase CLI
supabase init

# Start local Supabase (requires Docker)
supabase start

# Link to remote project (optional)
supabase login
supabase link
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Build for Production

```bash
npm run build
npm test
```

## Testing

```bash
# Utility tests for share-token security, file validation, AI response
# parsing and folder/format helpers
npm test

# Production type-check and lint
npm run build
```

Manual QA against a configured Supabase project should cover sign-up/login,
upload, preview generation, summaries, share unlock/download, revocation and
row-level security isolation.

## Features

### Core Features
- ✅ User authentication with Supabase
- ✅ File upload and storage
- ✅ Folder organization
- ✅ File previews for PDF, DOCX, TXT and images
- ✅ Download-only fallback for PPT, PPTX and legacy DOC files
- ✅ AI-powered document summarization (free-tier provider)
- ✅ Branded file sharing with public links, expiry, passwords and revocation
- ✅ Search and filtering
- ✅ Favorites and tags
- ✅ Mobile-first responsive design
- ✅ Long-press preview panel (mobile)
- ✅ Installable PWA with offline shell

### Security
- Row Level Security (RLS) on all tables
- Private storage buckets with signed URLs
- Secure share token system
- Server-side authorization checks

### UI/UX
- Original cloud-bunny mascot companion
- Smooth animations with Framer Motion
- Bottom navigation for mobile
- Light and dark modes
- Reduced motion support

## Database Schema

See `supabase/migrations/` for the complete database schema including:
- `profiles` - User profiles
- `folders` - File organization
- `files` - File metadata
- `file_previews` - Generated previews
- `file_summaries` - AI summaries
- `share_links` - Sharing system
- `tags` - File tags
- `file_tags` - Tag associations
- `processing_jobs` - Background jobs

## Deployment

### Vercel Deployment

```bash
# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Deploy preview
vercel deploy

# Deploy production
vercel deploy --prod
```

## Development Workflow

1. **Phase 1**: Project setup ✅
2. **Phase 2**: Authentication and database ✅
3. **Phase 3**: File management ✅
4. **Phase 4**: File previews ✅
5. **Phase 5**: AI integration ✅
6. **Phase 6**: Sharing system ✅
7. **Phase 7**: PWA, profile and final polish ✅
8. **Local verification**: build and utility tests ✅
9. **Supabase end-to-end QA + Vercel preview**: pending project credentials and approval

## Contributing

This is a personal project. For any questions or suggestions, please open an issue.

## License

All rights reserved.
