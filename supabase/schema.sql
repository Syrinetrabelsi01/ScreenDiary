-- ScreenDiary — Phase 1 database schema
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).

-- ============================================================================
-- 1. PROFILES
-- One row per auth user. Auto-created via trigger when someone signs up.
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-insert a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 2. SAVED_ITEMS
-- The user's personal diary entries — one row per movie/show they've saved.
-- ============================================================================
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- TMDb identity
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),

  -- Cached TMDb metadata (so the library/detail pages don't need to re-fetch)
  title text not null,
  poster_path text,
  overview text,
  release_date text,
  genres text[] not null default '{}',
  tmdb_rating numeric(3, 1),

  -- Personal diary fields
  status text not null default 'want_to_watch'
    check (status in ('want_to_watch', 'watching', 'completed', 'dropped', 'rewatching', 'favorite')),
  personal_rating integer check (personal_rating between 1 and 10),
  emoji_reaction text,
  personal_notes text,

  -- TV progress tracking (movies leave these null)
  current_season integer,
  current_episode integer,
  total_seasons integer,
  total_episodes integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  unique (user_id, tmdb_id, media_type)
);

create index if not exists saved_items_user_id_idx on public.saved_items (user_id);
create index if not exists saved_items_user_status_idx on public.saved_items (user_id, status);

alter table public.saved_items enable row level security;

create policy "Users can view their own saved items"
  on public.saved_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved items"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved items"
  on public.saved_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own saved items"
  on public.saved_items for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_saved_items_updated_at on public.saved_items;
create trigger set_saved_items_updated_at
  before update on public.saved_items
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- 3. MOOD_TAGS
-- Shared, predefined list of mood tags. Readable by everyone, not user-owned.
-- ============================================================================
create table if not exists public.mood_tags (
  id serial primary key,
  name text not null unique
);

alter table public.mood_tags enable row level security;

create policy "Anyone can read mood tags"
  on public.mood_tags for select
  using (true);

insert into public.mood_tags (name) values
  ('Comfort'), ('Romantic'), ('Sad'), ('Funny'), ('Dark'), ('Nostalgic'),
  ('Mind-blowing'), ('Guilty pleasure'), ('Background show'), ('Cry movie'),
  ('Cozy'), ('Girl night'), ('Rewatchable'), ('Slow burn'), ('Chaotic'),
  ('Emotional'), ('Feel-good')
on conflict (name) do nothing;

-- ============================================================================
-- 4. ITEM_MOOD_TAGS
-- Join table linking saved items to mood tags (many-to-many).
-- ============================================================================
create table if not exists public.item_mood_tags (
  id uuid primary key default gen_random_uuid(),
  saved_item_id uuid not null references public.saved_items (id) on delete cascade,
  mood_tag_id integer not null references public.mood_tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (saved_item_id, mood_tag_id)
);

create index if not exists item_mood_tags_saved_item_id_idx on public.item_mood_tags (saved_item_id);

alter table public.item_mood_tags enable row level security;

-- A user may only see/manage mood tags on items they own (checked via saved_items).
create policy "Users can view mood tags on their own items"
  on public.item_mood_tags for select
  using (
    exists (
      select 1 from public.saved_items
      where saved_items.id = item_mood_tags.saved_item_id
        and saved_items.user_id = auth.uid()
    )
  );

create policy "Users can add mood tags to their own items"
  on public.item_mood_tags for insert
  with check (
    exists (
      select 1 from public.saved_items
      where saved_items.id = item_mood_tags.saved_item_id
        and saved_items.user_id = auth.uid()
    )
  );

create policy "Users can remove mood tags from their own items"
  on public.item_mood_tags for delete
  using (
    exists (
      select 1 from public.saved_items
      where saved_items.id = item_mood_tags.saved_item_id
        and saved_items.user_id = auth.uid()
    )
  );
