"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { tmdbImageUrl, formatYear } from "@/lib/utils";
import type { TmdbSearchResult } from "@/lib/tmdb/types";
import type { AddToLibraryResult } from "@/app/library/actions";

export function MovieCard({
  result,
  onAdd,
}: {
  result: TmdbSearchResult;
  onAdd: (tmdbId: number, mediaType: "movie" | "tv") => Promise<AddToLibraryResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<AddToLibraryResult | null>(null);

  const mediaType = result.media_type as "movie" | "tv";
  const title = result.title ?? result.name ?? "Untitled";
  const year = formatYear(result.release_date ?? result.first_air_date);
  const poster = tmdbImageUrl(result.poster_path, "w342");

  function handleAdd() {
    startTransition(async () => {
      const res = await onAdd(result.id, mediaType);
      setOutcome(res);
    });
  }

  return (
    <div className="glass-card group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background-elevated">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 768px) 45vw, 220px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎞️</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground backdrop-blur-sm">
          {mediaType === "movie" ? "Movie" : "TV Show"}
        </span>
        {result.vote_average > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-amber-300 backdrop-blur-sm">
            ★ {result.vote_average.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-display text-base leading-tight text-foreground">{title}</h3>
          <p className="text-xs text-muted">{year}</p>
        </div>
        <p className="line-clamp-3 flex-1 text-xs leading-relaxed text-muted">
          {result.overview || "No overview available."}
        </p>

        {outcome?.status === "exists" ? (
          <Link
            href={`/library/${outcome.id}`}
            className="mt-1 rounded-full border border-white/10 px-3 py-2 text-center text-xs font-medium text-foreground transition hover:border-white/20"
          >
            Already in diary — view
          </Link>
        ) : outcome?.status === "added" ? (
          <Link
            href={`/library/${outcome.id}`}
            className="mt-1 rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-3 py-2 text-center text-xs font-semibold text-background transition hover:opacity-90"
          >
            Added ✓ — view in diary
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-white/15 disabled:opacity-60"
          >
            {isPending ? "Adding…" : "＋ Add to ScreenDiary"}
          </button>
        )}
        {outcome?.status === "error" && (
          <p className="text-[11px] text-rose-400">{outcome.message}</p>
        )}
      </div>
    </div>
  );
}
