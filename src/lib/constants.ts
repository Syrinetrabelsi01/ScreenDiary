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
