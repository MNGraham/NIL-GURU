# Athlete Revenue Engine — Architecture

## Overview

A SaaS platform that converts athlete performance data into monetizable assets:
1. **Social content** — AI-generated platform-specific posts
2. **NIL media profiles** — Brand-facing athlete profiles
3. **Brand matches** — AI-scored sponsorship recommendations

---

## Folder Structure

```
.
├── app/
│   ├── (auth)/                  # Unauthenticated routes
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts    # Supabase OAuth callback
│   ├── (dashboard)/             # Protected routes
│   │   ├── layout.tsx           # Auth guard + Sidebar
│   │   ├── athletes/page.tsx    # Athlete list
│   │   ├── content/page.tsx     # Content generator + history
│   │   ├── brands/page.tsx      # Brand match dashboard
│   │   └── profile/page.tsx     # NIL media profiles
│   └── api/
│       ├── athletes/            # CRUD: athlete profiles
│       │   ├── route.ts         # GET (list), POST (create)
│       │   └── [id]/route.ts    # GET, PATCH, DELETE
│       ├── content/route.ts     # POST (AI generate), GET (list)
│       ├── profiles/route.ts    # POST (AI generate NIL profile)
│       └── brands/
│           ├── route.ts         # GET (browse brands)
│           └── matches/route.ts # POST (AI match), GET (list)
│
├── components/
│   ├── shared/
│   │   └── Sidebar.tsx
│   ├── athletes/
│   │   ├── AthleteCard.tsx
│   │   ├── NewAthleteButton.tsx
│   │   └── NilProfileCard.tsx
│   ├── content/
│   │   ├── ContentGenerator.tsx  # Form + AI trigger
│   │   └── ContentList.tsx
│   └── brands/
│       └── BrandMatchDashboard.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server component client
│   │   └── middleware.ts        # Session refresh
│   ├── openai/
│   │   ├── client.ts            # OpenAI instance
│   │   └── prompts.ts           # Prompt builders
│   └── validations/
│       └── index.ts             # Zod schemas
│
├── types/index.ts               # Shared TypeScript types
├── middleware.ts                # Route protection
└── supabase/migrations/
    └── 001_initial_schema.sql
```

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` — role, name, avatar |
| `athletes` | Sport, school, stats (JSONB), social handles |
| `nil_profiles` | AI-generated headline, bio, categories, engagement data |
| `content_pieces` | Generated social posts — platform, tone, body, hashtags |
| `brands` | Brand catalog — industry, deal range, target sports |
| `brand_matches` | AI-scored athlete↔brand pairings with status tracking |

### Key Design Decisions
- `athletes.stats` is JSONB — sport-agnostic, works for football, basketball, etc.
- `brand_matches` uses `upsert(onConflict: athlete_id,brand_id)` — regenerating matches refreshes scores without duplicates
- RLS enforces ownership on every table — no server-side bypass needed for standard ops

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/athletes` | List current user's athletes |
| POST | `/api/athletes` | Create athlete |
| GET | `/api/athletes/[id]` | Get athlete + NIL profile |
| PATCH | `/api/athletes/[id]` | Update athlete |
| DELETE | `/api/athletes/[id]` | Delete athlete |
| GET | `/api/content` | List content (filterable by athlete, platform) |
| POST | `/api/content` | AI-generate content piece |
| POST | `/api/profiles` | AI-generate / regenerate NIL profile |
| GET | `/api/brands` | Browse brand catalog |
| GET | `/api/brands/matches` | List matches for an athlete |
| POST | `/api/brands/matches` | AI-generate brand match suggestions |

---

## AI Flows

### 1. Content Generation
```
User selects: athlete + platform + type + tone + optional context
→ POST /api/content
→ Fetch athlete stats from DB
→ Build prompt (lib/openai/prompts.ts)
→ OpenAI gpt-4o-mini (JSON mode)
→ Parse { body, hashtags }
→ Save to content_pieces
→ Display in ContentList
```

### 2. NIL Profile Generation
```
User clicks "Generate Profile"
→ POST /api/profiles
→ Fetch athlete stats from DB
→ Build prompt → OpenAI gpt-4o-mini
→ Parse { headline, bio, categories }
→ Upsert nil_profiles row
→ Display in NilProfileCard
```

### 3. Brand Matching
```
User selects athlete → "Find Brand Matches"
→ POST /api/brands/matches
→ Fetch athlete + active brands (sport-filtered)
→ Build scoring prompt → OpenAI gpt-4o
→ Parse [{ brand_id, score, reasons }]
→ Upsert brand_matches rows
→ Display sorted by match_score
```

---

## Auth Flow

1. User signs in via Supabase Auth (email/password or OAuth)
2. Supabase redirects to `/callback/route.ts` → exchanges code for session
3. `middleware.ts` runs on every request, refreshes session cookie, redirects unauthenticated users to `/login`
4. Server Components use `lib/supabase/server.ts`; Client Components use `lib/supabase/client.ts`
5. `handle_new_user()` trigger auto-creates a `profiles` row on signup

---

## Scalability Notes

- **Stats schema**: JSONB keeps the schema sport-agnostic; add sport-specific UI layers without migrations
- **Brand catalog**: Can be admin-managed via Supabase Studio or a future admin panel
- **Content approval**: `content_pieces.status` workflow (draft → approved → published) is ready for a publish-to-social integration
- **Match refresh**: Re-running brand match upserts refreshes scores as athlete data grows
- **Rate limits**: OpenAI calls are per-request; add a queue (e.g. Inngest) for bulk operations
