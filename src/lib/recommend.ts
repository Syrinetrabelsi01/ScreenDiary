import type { SavedItemWithMoodTags } from "@/lib/supabase/queries";
import {
  MOOD_CHOICES,
  WATCH_TIME_OPTIONS,
  type WatchType,
  type WatchTime,
  type MoodChoice,
  type WatchMode,
  type RandomPickerCategory,
} from "@/lib/constants";

export type WatchTonightFilters = {
  type: WatchType;
  time: WatchTime;
  mood: MoodChoice;
  mode: WatchMode;
};

export type Recommendation = SavedItemWithMoodTags & { reason: string; score: number };

// Filters by type, then avoids "Dropped" items unless that would empty the
// pool entirely, then scores what's left by how well it matches the mood/
// continue-or-new/time preferences. Small random jitter breaks ties so the
// same top pick doesn't always win when several items score equally.
export function recommendForTonight(
  entries: SavedItemWithMoodTags[],
  filters: WatchTonightFilters
): { main: Recommendation | null; backups: Recommendation[] } {
  const typeFiltered =
    filters.type === "either" ? entries : entries.filter((e) => e.item.media_type === filters.type);

  if (typeFiltered.length === 0) {
    return { main: null, backups: [] };
  }

  const nonDropped = typeFiltered.filter((e) => e.item.status !== "dropped");
  const pool = nonDropped.length > 0 ? nonDropped : typeFiltered;

  const moodChoice = MOOD_CHOICES.find((m) => m.value === filters.mood);
  const timeChoice = WATCH_TIME_OPTIONS.find((t) => t.value === filters.time);

  const scored: Recommendation[] = pool.map((entry) => {
    let score = 0;
    const reasons: string[] = [];

    if (moodChoice?.tag && entry.moodTags.includes(moodChoice.tag)) {
      score += 3;
      reasons.push(`it matches your ${moodChoice.label.toLowerCase()} mood`);
    }

    if (filters.mode === "continue" && (entry.item.status === "watching" || entry.item.status === "rewatching")) {
      score += 2;
      reasons.push("you're already partway through it");
    } else if (filters.mode === "new" && entry.item.status === "want_to_watch") {
      score += 2;
      reasons.push("it's been sitting on your Want to Watch list");
    }

    if (entry.item.status === "favorite") {
      score += 1;
      reasons.push("it's one of your favorites");
    }

    if (timeChoice && timeChoice.value !== "any" && entry.item.runtime_minutes) {
      if (entry.item.runtime_minutes >= timeChoice.min && entry.item.runtime_minutes <= timeChoice.max) {
        score += 2;
        reasons.push("it fits the time you have tonight");
      } else {
        score -= 2;
      }
    }

    score += Math.random() * 0.5;

    const reason =
      reasons.length > 0
        ? `I picked this because ${reasons.slice(0, 2).join(" and ")}.`
        : "It stood out from your diary tonight.";

    return { ...entry, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);

  return { main: scored[0] ?? null, backups: scored.slice(1, 4) };
}

export function filterByCategory(
  entries: SavedItemWithMoodTags[],
  category: RandomPickerCategory
): SavedItemWithMoodTags[] {
  switch (category) {
    case "all":
      return entries;
    case "want_to_watch":
    case "watching":
    case "favorite":
      return entries.filter((e) => e.item.status === category);
    case "movie":
    case "tv":
      return entries.filter((e) => e.item.media_type === category);
    case "comfort":
      return entries.filter((e) => e.moodTags.includes("Comfort"));
    case "completed_rewatch":
      return entries.filter((e) => e.item.status === "completed" || e.item.status === "rewatching");
    case "not_dropped":
      return entries.filter((e) => e.item.status !== "dropped");
    default:
      return entries;
  }
}
