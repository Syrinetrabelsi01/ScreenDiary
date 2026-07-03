"use server";

import { createClient } from "@/lib/supabase/server";
import { getSavedItemsWithMoodTags } from "@/lib/supabase/queries";
import { filterByCategory } from "@/lib/recommend";
import type { RandomPickerCategory } from "@/lib/constants";
import type { SavedItemRow } from "@/lib/supabase/database.types";

export type RandomPickResult =
  | { status: "empty" }
  | { status: "picked"; item: SavedItemRow; moodTags: string[] };

export async function pickRandom(category: RandomPickerCategory): Promise<RandomPickResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "empty" };

  const entries = await getSavedItemsWithMoodTags(supabase, user.id);
  const candidates = filterByCategory(entries, category);

  if (candidates.length === 0) {
    return { status: "empty" };
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { status: "picked", item: pick.item, moodTags: pick.moodTags };
}
