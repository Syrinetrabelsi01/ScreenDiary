# ScreenDiary

**Your personal movie and TV diary.**

Search movies and TV shows, save them to your own library, track episode-by-episode
progress, rate what you finish, tag it with a mood, write personal notes, get AI help
deciding what to watch, and share a watchlist with friends — all in a dark, cinematic,
Letterboxd-meets-personal-Netflix interface.

## Full feature list

**Core diary**
- Email/password auth (Supabase), plus password reset (`/forgot-password`, `/reset-password`)
- TMDb search (movies + TV) → save to your private library
- Library with filters (status, movie/TV) and sorting (recent, title, your rating)
- Item detail page: status, 1–10 personal rating, emoji reaction, mood tags, personal notes,
  TMDb reviews
- TV progress tracker: real per-season episode counts, season rollover on "+1 Episode",
  automatic "Completed" on the series finale, clamped/validated manual editing, accurate
  completion percentage
- Dashboard: 10 stat cards, status/mood-tag breakdowns, top rated, continue watching,
  recently added

**Discovery**
- Watch Tonight — guided questionnaire (type/time/mood/continue-or-new) that recommends
  from your own library, or tells you what to search for if nothing fits
- Random Picker — category-filtered random pick with a brief spin animation

**ScreenDiary AI** (`/ai`, optional — degrades gracefully without a key)
- Recommendation Helper — free-text "what should I watch" using your library as context
- Mood Matcher — same engine, framed around how you feel
- Review Cleaner — turns messy notes into a polished + a shorter version
- Spoiler-Free Summary — premise, why-you'd-like-it, and best mood to watch it in, built
  only from metadata (never claims to have "watched" anything, never reveals endings)
- The same three tools also live inline on the item detail page, next to the fields they help with

**Shared Watchlists** (`/shared`)
- Create a list, get an invite code, share it
- Anyone logged into ScreenDiary with the code can view it and vote (Want to watch /
  Maybe / Not interested) with live vote counts
- Owner adds items from their own library, removes items, or deletes the list

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) — auth + Postgres database (with Row Level Security)
- [TMDb API](https://www.themoviedb.org/documentation/api) — movie/TV data, called only from the server
- [Anthropic API](https://console.anthropic.com) (`@anthropic-ai/sdk`) — optional, powers `/ai`

## Setup instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** → New query, and run each of these **in order** (each one only
   depends on the ones before it):
   1. [`supabase/schema.sql`](./supabase/schema.sql) — creates `profiles`, `saved_items`,
      `mood_tags`, `item_mood_tags`, seeds the 17 mood tags, sets up Row Level Security.
   2. [`supabase/migrations/002_add_runtime.sql`](./supabase/migrations/002_add_runtime.sql) —
      adds `runtime_minutes` (Watch Tonight's time filter).
   3. [`supabase/migrations/003_tv_progress_limits.sql`](./supabase/migrations/003_tv_progress_limits.sql) —
      adds `season_episode_counts` (real per-season TV tracking).
   4. [`supabase/migrations/004_shared_watchlists.sql`](./supabase/migrations/004_shared_watchlists.sql) —
      creates `shared_lists`, `shared_list_items`, `shared_list_votes` + RLS.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. By default, Supabase requires email confirmation for new signups. For local testing
   you can turn this off under **Authentication → Providers → Email → Confirm email**,
   or just check the inbox you sign up with.

### 3. TMDb setup

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Go to **Settings → API** and request an API key (choose "Developer").
3. Copy the **API Read Access Token** (the long v4 Bearer token — preferred) and/or the
   shorter v3 **API Key**.

### 4. AI setup (optional)

The app works completely fine without this — every AI tool just shows *"AI is not
configured yet. Add ANTHROPIC_API_KEY to your .env.local file."* instead of erroring.

1. Create an API key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).
2. Set `ANTHROPIC_API_KEY` (see below). `AI_PROVIDER` and `AI_MODEL` already have sensible
   defaults — only set them if you want to change provider or model.

### 5. Configure environment variables

Copy `.env.example` to `.env.local` (a starter `.env.local` is already included — just
fill in the blanks):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# TMDb — only one of these two is required
TMDB_BEARER_TOKEN=your-v4-read-access-token
TMDB_API_KEY=your-v3-api-key

# AI — optional
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_MODEL=claude-sonnet-5
```

None of these are ever exposed to the browser except the two `NEXT_PUBLIC_*` Supabase
values, which are safe to expose by design (access is enforced by Row Level Security,
not by hiding the key). TMDb calls happen in server-only code (`src/lib/tmdb/client.ts`)
or the one API route reachable from the browser (`/api/tmdb/search`). AI calls happen
only inside `src/lib/ai/` (also guarded with the `server-only` package) and Server
Actions in `src/app/ai/actions.ts` — `ANTHROPIC_API_KEY` is never read from, or sent to,
a Client Component.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  proxy.ts                                    # session refresh + route protection (Next 16's middleware)
  lib/
    supabase/  client.ts, server.ts, queries.ts, database.types.ts, middleware.ts
    tmdb/      client.ts, types.ts             # server-only TMDb helpers
    ai/        provider.ts, anthropic.ts, client.ts, prompts.ts   # server-only AI helpers
    constants.ts, utils.ts, recommend.ts, tvProgress.ts
  components/                                  # shared UI + components/ai/ for the AI tool cards
  app/
    page.tsx                                   # landing page
    (auth)/  login, signup, forgot-password, reset-password, actions.ts
    dashboard/page.tsx
    search/page.tsx
    library/  page.tsx, [id]/page.tsx, actions.ts
    watch-tonight/page.tsx
    random-picker/  page.tsx, RandomPickerClient.tsx, actions.ts
    ai/  page.tsx, actions.ts                  # ScreenDiary AI
    shared/  page.tsx, new/page.tsx, [code]/page.tsx, actions.ts   # Shared Watchlists
    api/tmdb/search/route.ts                   # the only browser-facing TMDb route
supabase/
  schema.sql                                   # base schema + RLS
  migrations/002_add_runtime.sql
  migrations/003_tv_progress_limits.sql
  migrations/004_shared_watchlists.sql
```

## How to test

**Auth** — sign up at `/signup` (confirm the email if required), log in at `/login`, log
out from the navbar. Try `/forgot-password` → check your inbox → follow the link →
`/reset-password` sets a new password.

**Search** — `/search`, type a title, confirm both movies and TV shows appear with
poster/year/rating, click "Add to ScreenDiary".

**Library** — `/library`, try each filter pill and each sort option; open an item to
reach the detail page.

**TV progress** — see the dedicated section below the feature list, or the walkthrough
in [How to test the TV progress tracker](#how-to-test-the-tv-progress-tracker).

**Watch Tonight** — `/watch-tonight`, click through the pill filters; URL updates
(`?type=movie&mood=comforting&mode=continue`); try a filter combo with zero matches to
see the empty state.

**Random Picker** — `/random-picker`, pick a category, click "🎲 Pick for me"; click again
to confirm it can land on something different; try an empty category.

**AI** — `/ai` (needs `ANTHROPIC_API_KEY`):
1. Recommendation Helper: type "I want something romantic but not too sad" → get a pick
   from your library with a reason, or a TMDb search suggestion if nothing fits.
2. Mood Matcher: type "I'm sad but I don't want to cry more" → matched against your mood
   tags/ratings/notes.
3. Review Cleaner: paste "it was cute but kinda slow and the ending annoyed me" → get a
   polished + shorter version.
4. Spoiler-Free Summary: pick an item from the dropdown → get a spoiler-free summary,
   why-you'd-like-it, and best mood to watch it in.
5. On any item's detail page: "✨ Suggest mood tags" next to Mood Tags, "🧹 Clean up my
   review with AI" next to Personal Notes (with a "Use this" button that only updates the
   textarea — nothing saves until you click the page's own "Save changes"), and a
   "Generate spoiler-free summary" button in the AI Tools card.
6. Without `ANTHROPIC_API_KEY` set, every one of the above shows "AI is not configured
   yet" instead of an error.

**Shared Watchlists** — `/shared`:
1. Create a list (`/shared/new`) → redirected to `/shared/<CODE>`.
2. As the owner: "Add from my library" to add items, vote, remove an item, delete the list.
3. Open `/shared` in another logged-in account and use "Have an invite code?" with the
   code from step 1 — you can view and vote, but you won't see owner-only controls
   (add/remove/delete).

## How to test the TV progress tracker

1. Add a TV show from `/search` (after running migration 003, new adds get real
   per-season episode counts).
2. Open its detail page — the tracker shows total seasons, the current season's episode
   limit, and an exact completion percentage.
3. Click "+1 Episode" repeatedly through a season's last episode — it rolls over to the
   next season at episode 1 automatically, and to "Completed" (with a "✓ Finished" badge)
   on the series finale.
4. Click "Mark Completed" on a show mid-way through — it jumps straight to the final
   season/episode, not just the status label.
5. Manually type an out-of-range season or episode number — it clamps immediately with an
   inline message, and the server clamps again on save regardless.
6. Manually move a completed show's episode number backward and save — status reverts to
   "Watching" automatically.

## Known limitations

- Search results aren't paginated (only the first page of TMDb results is shown).
- "Highest rated" library sort uses your personal rating, not the TMDb rating.
- TV completion % uses real per-season episode counts when available (items saved after
  migration 003); older items fall back to an average-episodes-per-season approximation.
- `runtime_minutes` (Watch Tonight's time filter) is only populated for items added after
  the Phase 2 migration — older items are treated as "no time constraint," not excluded.
- Watch Tonight's scoring is a heuristic (mood match, continue/new match, favorite bonus,
  time fit, small random jitter), not a real ranking model.
- Shared Watchlists are visible to **any logged-in ScreenDiary user who has the invite
  code** — there's no fully public/anonymous sharing (the whole app's routing and RLS
  model assumes an authenticated Supabase user; building anonymous access would need its
  own auth exemption and an anonymous-voter identity scheme). Anyone who knows a code can
  view/vote on that list, but there is no "browse all shared lists" page, so the code
  itself is the practical access gate.
- The AI tools send library metadata (title, type, status, genres, overview, mood tags,
  your rating, your notes, TV progress) to Anthropic's API when you use them — never your
  email, user id, or other accounts' data. Nothing is sent unless you actively use a tool.
- No image upload / custom avatars.

## Future improvements

- A real ranking model behind Watch Tonight instead of the current heuristic
- Anonymous/public shared-list links for people without a ScreenDiary account
- Streaming AI responses instead of a single non-streaming call per tool
- Pagination for `/search`
- Backfilling `runtime_minutes` / `season_episode_counts` for items saved before their
  respective migrations
