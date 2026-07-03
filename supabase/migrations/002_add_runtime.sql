-- ScreenDiary — Phase 2 migration
-- Run this once in your Supabase project's SQL editor, after supabase/schema.sql.
-- Adds a runtime column used by the Watch Tonight "how much time do you have?" filter.

alter table public.saved_items
  add column if not exists runtime_minutes integer;

comment on column public.saved_items.runtime_minutes is
  'Movie runtime in minutes, or a TV show''s typical single-episode length. Null when unknown — treated as "no time constraint" by the recommender.';
