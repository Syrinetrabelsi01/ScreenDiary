import Image from "next/image";
import Link from "next/link";
import { tmdbImageUrl, formatYear, computeProgress } from "@/lib/utils";
import { statusLabel } from "@/lib/constants";
import type { SavedItemRow } from "@/lib/supabase/database.types";

export function LibraryCard({
  item,
  moodTags,
}: {
  item: SavedItemRow;
  moodTags: string[];
}) {
  const poster = tmdbImageUrl(item.poster_path, "w342");
  const progress =
    item.media_type === "tv"
      ? computeProgress({
          currentSeason: item.current_season,
          currentEpisode: item.current_episode,
          totalSeasons: item.total_seasons,
          totalEpisodes: item.total_episodes,
        })
      : null;

  return (
    <Link
      href={`/library/${item.id}`}
      className="glass-card group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background-elevated">
        {poster ? (
          <Image
            src={poster}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 45vw, 220px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎞️</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">
          {item.media_type === "movie" ? "Movie" : "TV Show"}
        </span>
        {item.emoji_reaction && (
          <span className="absolute right-2 top-2 text-lg drop-shadow">{item.emoji_reaction}</span>
        )}
        {progress !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
            <div
              className="h-full bg-gradient-to-r from-accent-rose to-accent-purple"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base leading-tight text-foreground">{item.title}</h3>
        <p className="text-xs text-muted">{formatYear(item.release_date)}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
            {statusLabel(item.status)}
          </span>
          {item.personal_rating && (
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              ★ {item.personal_rating}/10
            </span>
          )}
        </div>

        {moodTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {moodTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted"
              >
                {tag}
              </span>
            ))}
            {moodTags.length > 3 && (
              <span className="text-[10px] text-muted">+{moodTags.length - 3}</span>
            )}
          </div>
        )}

        {item.media_type === "tv" && item.current_season && item.current_episode && (
          <p className="mt-auto text-[11px] text-muted">
            S{item.current_season} · E{item.current_episode}
            {progress !== null ? ` — ${progress}%` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
