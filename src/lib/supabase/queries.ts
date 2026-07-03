import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SavedItemRow, MoodTagLinkRow } from "./database.types";

export type SavedItemWithMoodTags = {
  item: SavedItemRow;
  moodTags: string[];
};

// Shared by dashboard, library, Watch Tonight, and Random Picker — fetches all
// of a user's saved items plus their mood tag names in two queries total.
export async function getSavedItemsWithMoodTags(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<SavedItemWithMoodTags[]> {
  const { data: items } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const savedItems: SavedItemRow[] = items ?? [];

  const { data: moodLinks } = await supabase
    .from("item_mood_tags")
    .select("saved_item_id, mood_tags(name)")
    .in(
      "saved_item_id",
      savedItems.length ? savedItems.map((i) => i.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  const moodTagsByItem = new Map<string, string[]>();
  ((moodLinks ?? []) as unknown as MoodTagLinkRow[]).forEach((link) => {
    const name = link.mood_tags?.name;
    if (!name) return;
    const list = moodTagsByItem.get(link.saved_item_id) ?? [];
    list.push(name);
    moodTagsByItem.set(link.saved_item_id, list);
  });

  return savedItems.map((item) => ({
    item,
    moodTags: moodTagsByItem.get(item.id) ?? [],
  }));
}
