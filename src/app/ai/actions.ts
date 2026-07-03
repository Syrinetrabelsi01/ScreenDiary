"use server";

import { createClient } from "@/lib/supabase/server";
import { getSavedItemsWithMoodTags } from "@/lib/supabase/queries";
import { getAiProvider } from "@/lib/ai/client";
import {
  buildRecommendationPrompt,
  buildReviewCleanerPrompt,
  buildSpoilerFreeSummaryPrompt,
  buildMoodTagSuggestionPrompt,
} from "@/lib/ai/prompts";
import { MOOD_TAGS } from "@/lib/constants";
import type { MoodTagLinkRow } from "@/lib/supabase/database.types";

export type AiTextResult =
  | { status: "not_configured" }
  | { status: "ok"; text: string }
  | { status: "error"; message: string };

export type AiMoodTagsResult =
  | { status: "not_configured" }
  | { status: "ok"; tags: string[] }
  | { status: "error"; message: string };

const GENERIC_ERROR = "Couldn't reach the AI right now. Please try again in a moment.";

export async function recommendFromLibrary(userText: string): Promise<AiTextResult> {
  const provider = getAiProvider();
  if (!provider) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be logged in." };

  if (!userText.trim()) {
    return { status: "error", message: "Tell me what you're in the mood for first." };
  }

  try {
    const entries = await getSavedItemsWithMoodTags(supabase, user.id);
    const { system, prompt } = buildRecommendationPrompt(userText.trim(), entries);
    const text = await provider.complete({ system, prompt, maxTokens: 500 });
    return { status: "ok", text };
  } catch (err) {
    console.error("recommendFromLibrary failed:", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function cleanReview(messyText: string): Promise<AiTextResult> {
  const provider = getAiProvider();
  if (!provider) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be logged in." };

  if (!messyText.trim()) {
    return { status: "error", message: "Write a few thoughts first." };
  }

  try {
    const { system, prompt } = buildReviewCleanerPrompt(messyText.trim());
    const text = await provider.complete({ system, prompt, maxTokens: 400 });
    return { status: "ok", text };
  } catch (err) {
    console.error("cleanReview failed:", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function generateSpoilerFreeSummary(itemId: string): Promise<AiTextResult> {
  const provider = getAiProvider();
  if (!provider) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be logged in." };

  const { data: item } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return { status: "error", message: "Couldn't find that item in your diary." };

  try {
    const { system, prompt } = buildSpoilerFreeSummaryPrompt(item);
    const text = await provider.complete({ system, prompt, maxTokens: 300 });
    return { status: "ok", text };
  } catch (err) {
    console.error("generateSpoilerFreeSummary failed:", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}

export async function suggestMoodTags(itemId: string): Promise<AiMoodTagsResult> {
  const provider = getAiProvider();
  if (!provider) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "You must be logged in." };

  const { data: item } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return { status: "error", message: "Couldn't find that item in your diary." };

  const { data: moodLinks } = await supabase
    .from("item_mood_tags")
    .select("mood_tags(name)")
    .eq("saved_item_id", itemId);

  const existingTags = ((moodLinks ?? []) as unknown as MoodTagLinkRow[])
    .map((l) => l.mood_tags?.name)
    .filter((n): n is string => !!n);

  try {
    const { system, prompt } = buildMoodTagSuggestionPrompt(item, existingTags);
    const raw = await provider.complete({ system, prompt, maxTokens: 100 });
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => MOOD_TAGS.includes(t) && !existingTags.includes(t));
    return { status: "ok", tags };
  } catch (err) {
    console.error("suggestMoodTags failed:", err);
    return { status: "error", message: GENERIC_ERROR };
  }
}
