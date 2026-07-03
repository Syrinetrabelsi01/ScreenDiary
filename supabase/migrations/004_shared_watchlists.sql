-- ScreenDiary — Shared Watchlists migration
-- Run this once in your Supabase project's SQL editor, after 003_tv_progress_limits.sql.

-- ============================================================================
-- 1. SHARED_LISTS
-- ============================================================================
create table if not exists public.shared_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists shared_lists_owner_id_idx on public.shared_lists (owner_id);

alter table public.shared_lists enable row level security;

-- Readable by any logged-in user — there's no "browse all lists" UI, so the
-- invite code (looked up via .eq("invite_code", code)) is the practical gate.
create policy "Authenticated users can read shared lists"
  on public.shared_lists for select
  to authenticated
  using (true);

create policy "Users can create their own shared lists"
  on public.shared_lists for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update their own shared lists"
  on public.shared_lists for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners can delete their own shared lists"
  on public.shared_lists for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ============================================================================
-- 2. SHARED_LIST_ITEMS
-- Denormalized display fields (title/poster/overview), NOT a live join to
-- saved_items — saved_items RLS only lets the owner read their own rows, so a
-- visitor with just the invite code could never see a joined title/poster.
-- Copying the public-safe fields at add-time keeps private diary data
-- (personal_rating, personal_notes, mood tags, status) out of shared lists.
-- ============================================================================
create table if not exists public.shared_list_items (
  id uuid primary key default gen_random_uuid(),
  shared_list_id uuid not null references public.shared_lists (id) on delete cascade,
  saved_item_id uuid references public.saved_items (id) on delete set null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  overview text,
  added_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (shared_list_id, tmdb_id, media_type)
);

create index if not exists shared_list_items_list_id_idx on public.shared_list_items (shared_list_id);

alter table public.shared_list_items enable row level security;

create policy "Authenticated users can read shared list items"
  on public.shared_list_items for select
  to authenticated
  using (true);

create policy "Owners can add items to their own shared lists"
  on public.shared_list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.shared_lists
      where shared_lists.id = shared_list_items.shared_list_id
        and shared_lists.owner_id = auth.uid()
    )
  );

create policy "Owners can remove items from their own shared lists"
  on public.shared_list_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.shared_lists
      where shared_lists.id = shared_list_items.shared_list_id
        and shared_lists.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. SHARED_LIST_VOTES
-- ============================================================================
create table if not exists public.shared_list_votes (
  id uuid primary key default gen_random_uuid(),
  shared_list_item_id uuid not null references public.shared_list_items (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  vote_type text not null check (vote_type in ('want_to_watch', 'maybe', 'not_interested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shared_list_item_id, voter_id)
);

create index if not exists shared_list_votes_item_id_idx on public.shared_list_votes (shared_list_item_id);

alter table public.shared_list_votes enable row level security;

-- Open read so vote counts can be shown to anyone viewing the list.
create policy "Authenticated users can read shared list votes"
  on public.shared_list_votes for select
  to authenticated
  using (true);

create policy "Users can cast their own vote"
  on public.shared_list_votes for insert
  to authenticated
  with check (auth.uid() = voter_id);

create policy "Users can change their own vote"
  on public.shared_list_votes for update
  to authenticated
  using (auth.uid() = voter_id)
  with check (auth.uid() = voter_id);

create policy "Users can retract their own vote"
  on public.shared_list_votes for delete
  to authenticated
  using (auth.uid() = voter_id);
