-- ScreenDiary — TV progress tracker migration
-- Run this once in your Supabase project's SQL editor, after 002_add_runtime.sql.
-- Stores real per-season episode counts so the tracker can clamp season/episode
-- to valid values and roll over seasons correctly instead of guessing.

alter table public.saved_items
  add column if not exists season_episode_counts jsonb;

comment on column public.saved_items.season_episode_counts is
  'Maps season number (as a string key) to its episode count, e.g. {"1": 10, "2": 8, "3": 12}. Null when unknown — the tracker falls back to the aggregate total_seasons/total_episodes approximation.';
