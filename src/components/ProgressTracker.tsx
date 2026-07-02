"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { incrementEpisode, markCompleted } from "@/app/library/actions";
import { computeProgress } from "@/lib/utils";

export function ProgressTracker({
  itemId,
  currentSeason,
  currentEpisode,
  totalSeasons,
  totalEpisodes,
}: {
  itemId: string;
  currentSeason: number | null;
  currentEpisode: number | null;
  totalSeasons: number | null;
  totalEpisodes: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [season, setSeason] = useState(currentSeason ?? 1);
  const [episode, setEpisode] = useState(currentEpisode ?? 1);

  const progress = computeProgress({
    currentSeason: season,
    currentEpisode: episode,
    totalSeasons,
    totalEpisodes,
  });

  function handleIncrement() {
    startTransition(async () => {
      await incrementEpisode(itemId);
      router.refresh();
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await markCompleted(itemId);
      router.refresh();
    });
  }

  return (
    <div className="glass-card space-y-4 rounded-2xl p-5">
      <h3 className="font-display text-lg text-foreground">TV Progress</h3>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-muted">
          Season
          <input
            type="number"
            name="current_season"
            min={1}
            value={season}
            onChange={(e) => setSeason(Number(e.target.value) || 1)}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-foreground"
          />
        </label>
        <label className="flex items-center gap-2 text-muted">
          Episode
          <input
            type="number"
            name="current_episode"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(Number(e.target.value) || 1)}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-foreground"
          />
        </label>
      </div>

      <p className="text-sm text-muted">
        Currently watching: <span className="text-foreground">Season {season}, Episode {episode}</span>
        <br />
        Next episode: <span className="text-foreground">Season {season}, Episode {episode + 1}</span>
      </p>

      {totalSeasons && totalEpisodes ? (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-accent-rose to-accent-purple transition-all"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {progress}% completed · {totalSeasons} seasons · {totalEpisodes} episodes total
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Total episode count unavailable for this show — tracking season/episode manually.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isPending}
          className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/15 disabled:opacity-50"
        >
          +1 Episode
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-muted transition hover:border-white/20 hover:text-foreground disabled:opacity-50"
        >
          Mark Completed
        </button>
      </div>
    </div>
  );
}
