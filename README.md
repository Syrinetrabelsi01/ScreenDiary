# ScreenDiary

**Your personal movie and TV diary.**

Search movies and TV shows, save them to your own library, track episode-by-episode
progress, rate what you finish, tag it with a mood, and write personal notes — all in
a dark, cinematic, Letterboxd-meets-personal-Netflix interface.

Phase 1 (auth, search, library, ratings, mood tags, TV progress, reviews) and Phase 2
(Watch Tonight, Random Picker, richer stats) are both done. See [Roadmap](#roadmap--phase-3)
below for what's next.

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
3. Run [`supabase/migrations/002_add_runtime.sql`](./supabase/migrations/002_add_runtime.sql) too (Phase 2) — it adds the `runtime_minutes` column Watch Tonight uses for its "how much time do you have?" filter.
4. Run [`supabase/migrations/003_tv_progress_limits.sql`](./supabase/migrations/003_tv_progress_limits.sql) too — it adds `season_episode_counts` (real per-season episode counts), which the TV tracker uses to clamp season/episode to valid values and roll over seasons correctly instead of guessing.
5. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
6. By default, Supabase requires email confirmation for new signups. For local testing you can turn this off under **Authentication → Providers → Email → Confirm email**, or just check the inbox you sign up with.

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
    supabase/        client.ts, server.ts, queries.ts  # clients + shared saved-items+mood-tags query
    tmdb/             client.ts, types.ts    # server-only TMDb helpers
    constants.ts                             # statuses, mood tags, nav links, Watch Tonight/Random Picker options
    utils.ts                                  # image URLs, dates, progress math
    recommend.ts                              # Watch Tonight scoring + Random Picker category filtering
  components/                                 # shared UI (cards, pickers, trackers, stat bars, mobile nav…)
  app/
    page.tsx                                  # landing page
    (auth)/login, (auth)/signup, (auth)/actions.ts
    dashboard/page.tsx                         # stats, breakdowns, continue watching, recently added
    search/page.tsx
    library/page.tsx, library/[id]/page.tsx, library/actions.ts
    watch-tonight/page.tsx                     # guided recommender
    random-picker/page.tsx, RandomPickerClient.tsx, actions.ts
    ai/page.tsx                                # Phase 3 placeholder
    api/tmdb/search/route.ts                   # the only browser-facing TMDb route
  lib/tvProgress.ts                             # season/episode clamping, rollover, finale detection
supabase/
  schema.sql                                   # Phase 1 schema + RLS policies
  migrations/002_add_runtime.sql               # Phase 2: adds runtime_minutes
  migrations/003_tv_progress_limits.sql         # adds season_episode_counts
```

## How to test Watch Tonight

1. Make sure you have at least a few saved items with a mix of statuses/mood tags/media types (a fresh diary shows the "add movies or shows first" empty state).
2. Go to `/watch-tonight`. With no filters touched, you already get a recommendation.
3. Click through the pill filters (type, time, mood, continue-or-new) — the URL updates (`?type=movie&mood=comforting&mode=continue`, etc.) and the page re-recommends server-side. No client JS required for the questionnaire itself.
4. Set type to something you have zero saved items of (e.g. `tv` when you've only saved movies) to see the "nothing matches those filters" empty state.
5. Set mood to "Comforting" on an item tagged "Comfort" to see it surface as the main pick, with a reason line explaining why.

## How to test Random Picker

1. Go to `/random-picker`.
2. Pick a category pill (defaults to "From everything").
3. Click "🎲 Pick for me" — you'll see a brief pulsing "Picking something for you…" state, then a result card with a "Picked at random from…" reason line.
4. Click again with the same category to confirm it can land on a different item.
5. Pick a category with nothing in it yet (e.g. "Favorites" if you have none) to see the empty state.

## How to test the TV progress tracker

1. Add a TV show from `/search` (added after running migration 003, so it has real per-season episode counts).
2. Open its detail page — the tracker shows total seasons, the current season's episode limit, and an exact completion percentage.
3. Click "+1 Episode" repeatedly through a season's last episode — it rolls over to the next season at episode 1 automatically, and to "Completed" (with a "✓ Finished" badge) on the series finale.
4. Click "Mark Completed" on a show mid-way through — it jumps straight to the final season/episode, not just the status label.
5. Manually type an out-of-range season or episode number into the tracker's inputs — it clamps immediately with an inline message (e.g. "Episode 999 isn't valid for season 2 — clamped to 8"), and the server clamps again on save regardless.
6. Manually move a completed show's episode number backward and save — status reverts to "Watching" automatically.

## Known limitations

- Search results aren't paginated (only the first page of TMDb results is shown).
- "Highest rated" library sort uses your personal rating, not the TMDb rating.
- TV completion % uses real per-season episode counts when `season_episode_counts` is available (added after migration 003); for shows saved before that migration, it falls back to the old average-episodes-per-season approximation.
- `runtime_minutes` (used by Watch Tonight's time filter) is only populated for items added **after** the Phase 2 migration — existing saved items have it as `null` and are simply treated as "no time constraint" rather than excluded.
- Watch Tonight's scoring is a simple heuristic (mood match, continue/new match, favorite bonus, time fit, small random jitter), not a real ranking model.
- No password reset flow yet. No image upload / custom avatars.

## Roadmap — Phase 3

`/ai` is a placeholder page today. It's reserved for:

- 🤖 AI recommendation helper
- 🧹 AI review cleaner
- 💭 AI mood matcher
- 🙈 Spoiler-free summary
- 🤝 Shared watchlists
