# ScreenDiary

**Your personal movie and TV diary.**

Search movies and TV shows, save them to your own library, track episode-by-episode
progress, rate what you finish, tag it with a mood, and write personal notes — all in
a dark, cinematic, Letterboxd-meets-personal-Netflix interface.

This is the **Phase 1 MVP**. See [Roadmap](#roadmap--phase-23) below for what's next.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) — auth + Postgres database (with Row Level Security)
- [TMDb API](https://www.themoviedb.org/documentation/api) — movie/TV data, called only from the server

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** → New query, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates the `profiles`, `saved_items`, `mood_tags`, and `item_mood_tags` tables, seeds the 17 mood tags, and sets up Row Level Security so users can only ever see their own data.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. By default, Supabase requires email confirmation for new signups. For local testing you can turn this off under **Authentication → Providers → Email → Confirm email**, or just check the inbox you sign up with.

### 3. Get a TMDb API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Read Access Token** (the long v4 Bearer token — preferred) and/or the shorter v3 **API Key**.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` (a blank `.env.local` is already included — just fill it in) and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

TMDB_BEARER_TOKEN=your-v4-read-access-token
# or, if you'd rather use the v3 key:
TMDB_API_KEY=your-v3-api-key
```

None of these are ever exposed to the browser except the two `NEXT_PUBLIC_*` Supabase
values, which are safe to expose by design (access is enforced by Row Level Security,
not by hiding the key). All TMDb calls happen in server-only code
(`src/lib/tmdb/client.ts`, guarded by the `server-only` package) or in the one API route
that needs to be reachable from the browser (`/api/tmdb/search`).

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  middleware entry:  src/proxy.ts            # session refresh + route protection
  lib/
    supabase/        client.ts, server.ts    # browser / server Supabase clients
    tmdb/             client.ts, types.ts    # server-only TMDb helpers
    constants.ts                             # statuses, mood tags, emoji options
    utils.ts                                  # image URLs, dates, progress math
  components/                                 # shared UI (cards, pickers, trackers…)
  app/
    page.tsx                                  # landing page
    (auth)/login, (auth)/signup, (auth)/actions.ts
    dashboard/page.tsx
    search/page.tsx
    library/page.tsx, library/[id]/page.tsx, library/actions.ts
    ai/page.tsx                                # Phase 2/3 placeholder
    api/tmdb/search/route.ts                   # the only browser-facing TMDb route
supabase/schema.sql                            # full DB schema + RLS policies
```

## Known limitations (Phase 1)

- Search results aren't paginated (only the first page of TMDb results is shown).
- "Highest rated" sort uses your personal rating, not the TMDb rating.
- TV completion % is an approximation (average episodes per season), since only
  aggregate season/episode totals are stored, not a per-season breakdown.
- No password reset flow yet.
- No image upload / custom avatars.

## Roadmap — Phase 2/3

`/ai` is a placeholder page today. It's reserved for:

- 🌙 Watch Tonight recommendations
- 🎲 Random picker
- 📊 Stats dashboard
- 🤖 AI recommendation helper
- 🧹 AI review cleaner
- 💭 AI mood matcher
- 🙈 Spoiler-free summary
- 🤝 Shared watchlists
