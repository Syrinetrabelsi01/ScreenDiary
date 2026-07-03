import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReviews } from "@/lib/tmdb/client";
import { tmdbImageUrl, formatDate } from "@/lib/utils";
import { updateSavedItem, deleteItem } from "@/app/library/actions";
import { StatusSelector } from "@/components/StatusSelector";
import { RatingPicker } from "@/components/RatingPicker";
import { EmojiPicker } from "@/components/EmojiPicker";
import { MoodTagPicker } from "@/components/MoodTagPicker";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ReviewsSection } from "@/components/ReviewsSection";
import { SubmitButton } from "@/components/SubmitButton";
import { DeleteButton } from "@/components/DeleteButton";
import { NotesWithAiCleaner } from "@/components/NotesWithAiCleaner";
import { MoodTagSuggestionTool } from "@/components/ai/MoodTagSuggestionTool";
import { SpoilerFreeSummaryTool } from "@/components/ai/SpoilerFreeSummaryTool";
import type { TmdbReview } from "@/lib/tmdb/types";
import type { MoodTagLinkRow } from "@/lib/supabase/database.types";

export default async function LibraryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: item } = await supabase
    .from("saved_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) notFound();

  const { data: moodLinks } = await supabase
    .from("item_mood_tags")
    .select("mood_tags(name)")
    .eq("saved_item_id", item.id);

  const selectedMoodTags = ((moodLinks ?? []) as unknown as MoodTagLinkRow[])
    .map((l) => l.mood_tags?.name)
    .filter((n): n is string => !!n);

  let reviews: TmdbReview[] = [];
  try {
    const data = await getReviews(item.tmdb_id, item.media_type);
    reviews = data.results;
  } catch (err) {
    console.error("Failed to load TMDb reviews:", err);
  }

  const poster = tmdbImageUrl(item.poster_path, "w500");
  const boundUpdate = updateSavedItem.bind(null, item.id);
  const boundDelete = deleteItem.bind(null, item.id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="glass-card relative aspect-[2/3] w-full overflow-hidden rounded-2xl">
            {poster ? (
              <Image src={poster} alt={item.title} fill sizes="280px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">🎞️</div>
            )}
          </div>
          <DeleteButton action={boundDelete} />
        </div>

        <div className="space-y-8">
          <div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
              {item.media_type === "movie" ? "Movie" : "TV Show"}
            </span>
            <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">{item.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{formatDate(item.release_date)}</span>
              {item.tmdb_rating !== null && (
                <span className="text-amber-300">★ {item.tmdb_rating.toFixed(1)} TMDb</span>
              )}
            </div>
            {item.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {item.overview || "No overview available."}
            </p>
          </div>

          <form action={boundUpdate} className="space-y-6">
            <div>
              <h3 className="mb-2 font-display text-lg text-foreground">Status</h3>
              <StatusSelector name="status" defaultValue={item.status} />
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg text-foreground">Your Rating</h3>
              <RatingPicker name="personal_rating" defaultValue={item.personal_rating} />
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg text-foreground">Reaction</h3>
              <EmojiPicker name="emoji_reaction" defaultValue={item.emoji_reaction} />
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg text-foreground">Mood Tags</h3>
              <MoodTagPicker name="mood_tags" defaultSelected={selectedMoodTags} />
              <div className="mt-2">
                <MoodTagSuggestionTool itemId={item.id} />
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg text-foreground">Personal Notes</h3>
              <NotesWithAiCleaner defaultValue={item.personal_notes ?? ""} />
            </div>

            {item.media_type === "tv" && (
              <ProgressTracker
                key={`${item.current_season}-${item.current_episode}-${item.status}`}
                itemId={item.id}
                currentSeason={item.current_season}
                currentEpisode={item.current_episode}
                totalSeasons={item.total_seasons}
                totalEpisodes={item.total_episodes}
                seasonEpisodeCounts={item.season_episode_counts}
                status={item.status}
              />
            )}

            <SubmitButton>Save changes</SubmitButton>
          </form>

          <div className="glass-card space-y-3 rounded-2xl p-5">
            <h3 className="font-display text-lg text-foreground">AI Tools</h3>
            <p className="text-xs text-muted">
              Mood tag suggestions live next to your Mood Tags above, and the review cleaner lives
              next to Personal Notes — both stay right where you&apos;d use them.
            </p>
            <SpoilerFreeSummaryTool fixedItemId={item.id} />
          </div>

          <ReviewsSection reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
