import "server-only";
import type { SavedItemWithMoodTags } from "@/lib/supabase/queries";
import type { SavedItemRow } from "@/lib/supabase/database.types";
import { MOOD_TAGS } from "@/lib/constants";

const MAX_LIBRARY_ITEMS_IN_PROMPT = 40;

// Only ever includes fields that are useful for recommending/matching —
// never user_id, email, or anything from another account.
function summarizeItem(entry: SavedItemWithMoodTags): string {
  const { item, moodTags } = entry;
  const parts = [
    `"${item.title}" (${item.media_type === "movie" ? "movie" : "TV show"})`,
    `status: ${item.status}`,
  ];
  if (item.genres.length > 0) parts.push(`genres: ${item.genres.join(", ")}`);
  if (moodTags.length > 0) parts.push(`mood tags: ${moodTags.join(", ")}`);
  if (item.personal_rating) parts.push(`your rating: ${item.personal_rating}/10`);
  if (item.personal_notes) parts.push(`your notes: "${item.personal_notes.slice(0, 200)}"`);
  if (item.media_type === "tv" && item.current_season && item.current_episode) {
    parts.push(`progress: S${item.current_season}E${item.current_episode}`);
  }
  if (item.overview) parts.push(`overview: ${item.overview.slice(0, 200)}`);
  return `- ${parts.join(" | ")}`;
}

function buildLibraryContext(entries: SavedItemWithMoodTags[]): string {
  if (entries.length === 0) return "The user's diary is currently empty.";

  const trimmed = entries.slice(0, MAX_LIBRARY_ITEMS_IN_PROMPT);
  const omittedNote =
    entries.length > trimmed.length
      ? `\n(...and ${entries.length - trimmed.length} more items not shown)`
      : "";

  return `Here is the user's saved diary (${entries.length} items):\n${trimmed
    .map(summarizeItem)
    .join("\n")}${omittedNote}`;
}

export function buildRecommendationPrompt(userText: string, entries: SavedItemWithMoodTags[]) {
  const system = `You are ScreenDiary's recommendation assistant. You help users decide what to watch using ONLY their personal diary of saved movies and TV shows.

Rules:
- Prefer recommending something from the user's own saved library when it fits their request.
- Use title, media type, status, genres, overview, mood tags, personal rating, personal notes, and TV progress to judge fit.
- Avoid recommending items with status "dropped" unless nothing else in the library fits.
- If nothing in the library fits, say so plainly and suggest 1-3 specific titles or a type of thing to search for on TMDb instead — don't force a bad match from the library.
- Always briefly explain WHY you picked what you picked, referencing the specific signal (mood tag, genre, rating, notes) that led you there.
- Keep the whole response under ~150 words. No markdown headers, just plain prose.`;

  const prompt = `${buildLibraryContext(entries)}\n\nThe user says: "${userText}"\n\nRecommend something.`;

  return { system, prompt };
}

export function buildReviewCleanerPrompt(messyText: string) {
  const system = `You clean up messy personal movie/TV notes into a short readable review, for ScreenDiary's "Review Cleaner" tool.

Rules:
- Keep the user's own voice and opinions — don't make it sound like a professional critic or overly formal.
- Do not invent plot details, characters, or events the user didn't mention.
- Return exactly two things, in this format:
Polished: <the polished version, 1-3 sentences>
Shorter: <an even shorter one-sentence version>`;

  const prompt = `Here are the user's messy notes: "${messyText}"`;

  return { system, prompt };
}

export function buildSpoilerFreeSummaryPrompt(item: SavedItemRow) {
  const system = `You write short, spoiler-free summaries for ScreenDiary based ONLY on the metadata given — you have not "watched" anything, so never claim to have. Never reveal endings, twists, or major plot turns.

Return exactly three short parts, in this format:
Summary: <1-2 spoiler-free sentences on the premise>
Why you might like it: <1 sentence, tied to the genres/overview given>
Best mood to watch it in: <one short phrase, e.g. "cozy night in" or "when you want something intense">`;

  const details = [
    `Title: ${item.title}`,
    `Type: ${item.media_type === "movie" ? "Movie" : "TV Show"}`,
    item.genres.length > 0 ? `Genres: ${item.genres.join(", ")}` : null,
    item.overview ? `Overview: ${item.overview}` : null,
  ]
    .filter((line): line is string => !!line)
    .join("\n");

  return { system, prompt: details };
}

export function buildMoodTagSuggestionPrompt(item: SavedItemRow, existingTags: string[]) {
  const system = `You suggest mood tags for a saved movie/TV diary entry on ScreenDiary. You must ONLY choose from this exact predefined list — never invent new tags:
${MOOD_TAGS.join(", ")}

Respond with a comma-separated list of 2-5 tags from that exact list, nothing else. No explanation, no extra words.`;

  const details = [
    `Title: ${item.title}`,
    `Type: ${item.media_type === "movie" ? "Movie" : "TV Show"}`,
    item.genres.length > 0 ? `Genres: ${item.genres.join(", ")}` : null,
    item.overview ? `Overview: ${item.overview}` : null,
    item.personal_notes ? `User's notes: ${item.personal_notes}` : null,
    existingTags.length > 0 ? `Already tagged: ${existingTags.join(", ")}` : null,
  ]
    .filter((line): line is string => !!line)
    .join("\n");

  return { system, prompt: details };
}
