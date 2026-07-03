import type { SavedItemStatus } from "@/lib/supabase/database.types";

export const STATUS_OPTIONS: { value: SavedItemStatus; label: string; emoji: string }[] = [
  { value: "want_to_watch", label: "Want to Watch", emoji: "📌" },
  { value: "watching", label: "Watching", emoji: "▶️" },
  { value: "completed", label: "Completed", emoji: "✅" },
  { value: "dropped", label: "Dropped", emoji: "⏸️" },
  { value: "rewatching", label: "Rewatching", emoji: "🔁" },
  { value: "favorite", label: "Favorite", emoji: "❤️" },
];

export function statusLabel(status: SavedItemStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

// Predefined mood tags — must match the seed data in supabase/schema.sql.
export const MOOD_TAGS: string[] = [
  "Comfort",
  "Romantic",
  "Sad",
  "Funny",
  "Dark",
  "Nostalgic",
  "Mind-blowing",
  "Guilty pleasure",
  "Background show",
  "Cry movie",
  "Cozy",
  "Girl night",
  "Rewatchable",
  "Slow burn",
  "Chaotic",
  "Emotional",
  "Feel-good",
];

export const EMOJI_REACTIONS: string[] = [
  "😍",
  "😭",
  "😂",
  "😱",
  "🥹",
  "🤔",
  "😴",
  "🔥",
  "💔",
  "🤩",
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently added" },
  { value: "title", label: "Title" },
  { value: "rating", label: "Highest rated" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "want_to_watch", label: "Want to Watch" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
  { value: "rewatching", label: "Rewatching" },
  { value: "favorite", label: "Favorite" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV Shows" },
] as const;

export type FilterOption = (typeof FILTER_OPTIONS)[number]["value"];

// Shared nav links — used by both the desktop Navbar and MobileNav so the two
// can never drift out of sync.
export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/library", label: "Library" },
  { href: "/watch-tonight", label: "Watch Tonight" },
  { href: "/random-picker", label: "Random Picker" },
  { href: "/ai", label: "AI ✨" },
  { href: "/shared", label: "Shared Lists" },
] as const;

// --- Watch Tonight ---

export const WATCH_TYPE_OPTIONS = [
  { value: "either", label: "Either" },
  { value: "movie", label: "Movie" },
  { value: "tv", label: "TV Show" },
] as const;
export type WatchType = (typeof WATCH_TYPE_OPTIONS)[number]["value"];

export const WATCH_TIME_OPTIONS = [
  { value: "any", label: "No preference" },
  { value: "quick", label: "Under 30 min", min: 0, max: 30 },
  { value: "short", label: "30–60 min", min: 30, max: 60 },
  { value: "movie", label: "1–2 hours", min: 60, max: 120 },
  { value: "long", label: "2+ hours", min: 120, max: Infinity },
] as const;
export type WatchTime = (typeof WATCH_TIME_OPTIONS)[number]["value"];

// Mood choices map onto the existing MOOD_TAGS vocabulary rather than
// inventing new tags — "random" skips mood filtering entirely.
export const MOOD_CHOICES = [
  { value: "light", label: "Light", tag: "Feel-good" },
  { value: "emotional", label: "Emotional", tag: "Emotional" },
  { value: "funny", label: "Funny", tag: "Funny" },
  { value: "romantic", label: "Romantic", tag: "Romantic" },
  { value: "dark", label: "Dark", tag: "Dark" },
  { value: "comforting", label: "Comforting", tag: "Comfort" },
  { value: "random", label: "Surprise me", tag: null },
] as const;
export type MoodChoice = (typeof MOOD_CHOICES)[number]["value"];

export const WATCH_MODE_OPTIONS = [
  { value: "either", label: "Either" },
  { value: "continue", label: "Continue something" },
  { value: "new", label: "Something new" },
] as const;
export type WatchMode = (typeof WATCH_MODE_OPTIONS)[number]["value"];

// --- Random Picker ---

export const RANDOM_PICKER_CATEGORIES = [
  { value: "all", label: "From everything" },
  { value: "want_to_watch", label: "Want to Watch" },
  { value: "watching", label: "Watching" },
  { value: "favorite", label: "Favorites" },
  { value: "movie", label: "Movies only" },
  { value: "tv", label: "TV shows only" },
  { value: "comfort", label: "Comfort mood" },
  { value: "completed_rewatch", label: "Completed rewatch" },
  { value: "not_dropped", label: "Not dropped" },
] as const;
export type RandomPickerCategory = (typeof RANDOM_PICKER_CATEGORIES)[number]["value"];
