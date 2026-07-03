"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMovieDetails, getTvDetails } from "@/lib/tmdb/client";
import { clampProgress, isFinalEpisode, advanceEpisode, finalProgress } from "@/lib/tvProgress";
import type { SavedItemStatus, SavedItemRow } from "@/lib/supabase/database.types";

export type AddToLibraryResult =
  | { status: "added"; id: string }
  | { status: "exists"; id: string }
  | { status: "error"; message: string };

export async function addToLibrary(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<AddToLibraryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "You must be logged in to save items." };
  }

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (existing) {
    return { status: "exists", id: existing.id };
  }

  try {
    if (mediaType === "movie") {
      const details = await getMovieDetails(tmdbId);
      const { data, error } = await supabase
        .from("saved_items")
        .insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          media_type: "movie",
          title: details.title,
          poster_path: details.poster_path,
          overview: details.overview,
          release_date: details.release_date || null,
          genres: details.genres.map((g) => g.name),
          tmdb_rating: details.vote_average || null,
          runtime_minutes: details.runtime || null,
        })
        .select("id")
        .single();

      if (error || !data) throw error ?? new Error("Insert failed");
      revalidatePath("/library");
      revalidatePath("/dashboard");
      return { status: "added", id: data.id };
    }

    const details = await getTvDetails(tmdbId);
    const avgEpisodeRuntime =
      details.episode_run_time && details.episode_run_time.length > 0
        ? Math.round(
            details.episode_run_time.reduce((sum, minutes) => sum + minutes, 0) /
              details.episode_run_time.length
          )
        : null;

    // Season 0 is TMDb's convention for "Specials" — excluded so total_seasons/
    // total_episodes and the finale detection in tvProgress.ts stay consistent
    // with the season keys actually stored in season_episode_counts.
    const regularSeasons = (details.seasons ?? []).filter(
      (s) => s.season_number > 0 && s.episode_count > 0
    );
    const seasonEpisodeCounts =
      regularSeasons.length > 0
        ? Object.fromEntries(regularSeasons.map((s) => [String(s.season_number), s.episode_count]))
        : null;
    const totalSeasons =
      regularSeasons.length > 0
        ? Math.max(...regularSeasons.map((s) => s.season_number))
        : details.number_of_seasons || null;
    const totalEpisodes =
      regularSeasons.length > 0
        ? regularSeasons.reduce((sum, s) => sum + s.episode_count, 0)
        : details.number_of_episodes || null;

    const { data, error } = await supabase
      .from("saved_items")
      .insert({
        user_id: user.id,
        tmdb_id: tmdbId,
        media_type: "tv",
        title: details.name,
        poster_path: details.poster_path,
        overview: details.overview,
        release_date: details.first_air_date || null,
        genres: details.genres.map((g) => g.name),
        tmdb_rating: details.vote_average || null,
        current_season: 1,
        current_episode: 1,
        total_seasons: totalSeasons,
        total_episodes: totalEpisodes,
        season_episode_counts: seasonEpisodeCounts,
        runtime_minutes: avgEpisodeRuntime,
      })
      .select("id")
      .single();

    if (error || !data) throw error ?? new Error("Insert failed");
    revalidatePath("/library");
    revalidatePath("/dashboard");
    return { status: "added", id: data.id };
  } catch (err) {
    console.error("addToLibrary failed:", err);
    return {
      status: "error",
      message: "Couldn't save this item right now. Please try again.",
    };
  }
}

export async function updateSavedItem(itemId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("saved_items")
    .select("media_type, total_seasons, total_episodes, season_episode_counts")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return;

  let status = String(formData.get("status") ?? "want_to_watch") as SavedItemStatus;
  const personalRatingRaw = formData.get("personal_rating");
  const personalRating = personalRatingRaw ? Number(personalRatingRaw) : null;
  const emojiReaction = String(formData.get("emoji_reaction") ?? "") || null;
  const personalNotes = String(formData.get("personal_notes") ?? "") || null;
  const currentSeasonRaw = formData.get("current_season");
  const currentEpisodeRaw = formData.get("current_episode");
  const moodTags = formData.getAll("mood_tags").map(String);

  const update: Partial<SavedItemRow> = {
    personal_rating: personalRating,
    emoji_reaction: emojiReaction,
    personal_notes: personalNotes,
  };

  if (existing.media_type === "tv" && currentSeasonRaw && currentEpisodeRaw) {
    const progressMeta = {
      totalSeasons: existing.total_seasons,
      totalEpisodes: existing.total_episodes,
      seasonEpisodeCounts: existing.season_episode_counts,
    };
    const clamped = clampProgress({
      season: Number(currentSeasonRaw),
      episode: Number(currentEpisodeRaw),
      ...progressMeta,
    });
    update.current_season = clamped.season;
    update.current_episode = clamped.episode;

    const finished = isFinalEpisode({ ...clamped, ...progressMeta });
    const hasProgress = clamped.season > 1 || clamped.episode > 1;

    // Only override the user's explicit status pick in the two cases the
    // progress fields make unambiguous — leave Favorite/Dropped/Rewatching
    // alone otherwise so editing an episode number can't silently undo them.
    if (finished) {
      status = "completed";
    } else if (hasProgress && (status === "completed" || status === "want_to_watch")) {
      status = "watching";
    }
  }

  update.status = status;
  if (status === "completed") update.completed_at = new Date().toISOString();

  const { error } = await supabase
    .from("saved_items")
    .update(update)
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    console.error("updateSavedItem failed:", error);
    return;
  }

  await syncMoodTags(itemId, moodTags);

  revalidatePath(`/library/${itemId}`);
  revalidatePath("/library");
  revalidatePath("/dashboard");
}

async function syncMoodTags(itemId: string, tagNames: string[]) {
  const supabase = await createClient();

  const { data: allTags } = await supabase.from("mood_tags").select("id, name");
  if (!allTags) return;

  const nameToId = new Map(allTags.map((t) => [t.name, t.id]));
  const desiredIds = new Set(tagNames.map((n) => nameToId.get(n)).filter((id): id is number => !!id));

  const { data: currentLinks } = await supabase
    .from("item_mood_tags")
    .select("id, mood_tag_id")
    .eq("saved_item_id", itemId);

  const currentIds = new Set((currentLinks ?? []).map((l) => l.mood_tag_id));

  const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));
  const toRemove = (currentLinks ?? []).filter((l) => !desiredIds.has(l.mood_tag_id));

  if (toAdd.length > 0) {
    await supabase
      .from("item_mood_tags")
      .insert(toAdd.map((mood_tag_id) => ({ saved_item_id: itemId, mood_tag_id })));
  }
  if (toRemove.length > 0) {
    await supabase
      .from("item_mood_tags")
      .delete()
      .in("id", toRemove.map((l) => l.id));
  }
}

export async function incrementEpisode(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("saved_items")
    .select("current_season, current_episode, total_seasons, total_episodes, season_episode_counts")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) return;

  const result = advanceEpisode({
    season: item.current_season ?? 1,
    episode: item.current_episode ?? 0,
    totalSeasons: item.total_seasons,
    totalEpisodes: item.total_episodes,
    seasonEpisodeCounts: item.season_episode_counts,
  });

  const update: Partial<SavedItemRow> = {
    current_season: result.season,
    current_episode: result.episode,
    status: result.finished ? "completed" : "watching",
  };
  if (result.finished) update.completed_at = new Date().toISOString();

  await supabase.from("saved_items").update(update).eq("id", itemId).eq("user_id", user.id);

  revalidatePath(`/library/${itemId}`);
  revalidatePath("/library");
  revalidatePath("/dashboard");
}

export async function markCompleted(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("saved_items")
    .select("media_type, total_seasons, total_episodes, season_episode_counts")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();

  if (!item) return;

  const update: Partial<SavedItemRow> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  };

  if (item.media_type === "tv") {
    const final = finalProgress({
      totalSeasons: item.total_seasons,
      totalEpisodes: item.total_episodes,
      seasonEpisodeCounts: item.season_episode_counts,
    });
    update.current_season = final.season;
    update.current_episode = final.episode;
  }

  await supabase.from("saved_items").update(update).eq("id", itemId).eq("user_id", user.id);

  revalidatePath(`/library/${itemId}`);
  revalidatePath("/library");
  revalidatePath("/dashboard");
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("saved_items").delete().eq("id", itemId).eq("user_id", user.id);

  revalidatePath("/library");
  revalidatePath("/dashboard");
  redirect("/library");
}
