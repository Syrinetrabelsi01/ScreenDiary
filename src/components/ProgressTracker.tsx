"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { incrementEpisode, markCompleted } from "@/app/library/actions";
import { computeProgress } from "@/lib/utils";
import { clampProgress, episodesInSeason } from "@/lib/tvProgress";
import type { SavedItemStatus } from "@/lib/supabase/database.types";

export function ProgressTracker({
  itemId,
  currentSeason,
  currentEpisode,
  totalSeasons,
  totalEpisodes,
  seasonEpisodeCounts,
  status,
}: {
  itemId: string;
  currentSeason: number | null;
  currentEpisode: number | null;
  totalSeasons: number | null;
  totalEpisodes: number | null;
  seasonEpisodeCounts: Record<string, number> | null;
  status: SavedItemStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [season, setSeason] = useState(currentSeason ?? 1);
  const [episode, setEpisode] = useState(currentEpisode ?? 1);
  const [notice, setNotice] = useState<string | null>(null);

  const progressMeta = { totalSeasons, totalEpisodes, seasonEpisodeCounts };
  const progress = computeProgress({ currentSeason: season, currentEpisode: episode, ...progressMeta });
  const currentSeasonLimit = episodesInSeason(seasonEpisodeCounts, season);

  function updateSeason(raw: string) {
    const parsed = Number(raw) || 1;
    const clamped = clampProgress({ season: parsed, episode, ...progressMeta });
    setSeason(clamped.season);
    setEpisode(clamped.episode);
    setNotice(
      clamped.season !== parsed
        ? `Only ${totalSeasons ?? clamped.season} season(s) available — clamped to season ${clamped.season}.`
        : clamped.episode !== episode
          ? `Episode adjusted to fit season ${clamped.season}.`
          : null
    );
  }

  function updateEpisode(raw: string) {
    const parsed = Number(raw) || 1;
    const clamped = clampProgress({ season, episode: parsed, ...progressMeta });
    setEpisode(clamped.episode);
    setNotice(
      clamped.episode !== parsed
        ? `Episode ${parsed} isn't valid for season ${season} — clamped to ${clamped.episode}.`
        : null
    );
  }

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

  const nextEpisodeLabel = (() => {
    if (currentSeasonLimit && episode + 1 > currentSeasonLimit) {
      if (totalSeasons == null || season < totalSeasons) {
        return `Season ${season + 1}, Episode 1`;
      }
      return "You're at the series finale";
    }
    return `Season ${season}, Episode ${episode + 1}`;
  })();

  return (
    <div className="glass-card space-y-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-foreground">TV Progress</h3>
        {status === "completed" && (
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            ✓ Finished
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-muted">
          Season
          <input
            type="number"
            name="current_season"
            min={1}
            max={totalSeasons ?? undefined}
            value={season}
            onChange={(e) => updateSeason(e.target.value)}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-foreground"
          />
        </label>
        <label className="flex items-center gap-2 text-muted">
          Episode
          <input
            type="number"
            name="current_episode"
            min={1}
            max={currentSeasonLimit ?? totalEpisodes ?? undefined}
            value={episode}
            onChange={(e) => updateEpisode(e.target.value)}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-foreground"
          />
        </label>
        {totalSeasons && <span className="text-xs text-muted">of {totalSeasons} season(s)</span>}
      </div>

      {currentSeasonLimit && (
        <p className="text-xs text-muted">
          Season {season} has {currentSeasonLimit} episode(s).
        </p>
      )}

      {notice && <p className="text-xs text-amber-300">{notice}</p>}

      <p className="text-sm text-muted">
        Currently watching: <span className="text-foreground">Season {season}, Episode {episode}</span>
        <br />
        Next episode: <span className="text-foreground">{nextEpisodeLabel}</span>
      </p>

      {progress !== null ? (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-accent-rose to-accent-purple transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted">
            {progress}% completed{totalEpisodes ? ` · ${totalEpisodes} episodes total` : ""}
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
