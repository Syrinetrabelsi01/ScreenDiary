// Season/episode business rules for TV tracking, shared by the Server Actions
// in src/app/library/actions.ts and the client-side clamping in ProgressTracker.tsx.
// Keeping this logic in one place avoids three slightly-different reimplementations
// of "what's a valid season/episode for this show."

export type SeasonEpisodeCounts = Record<string, number>;

export type TvProgressState = {
  season: number;
  episode: number;
  totalSeasons: number | null;
  totalEpisodes: number | null;
  seasonEpisodeCounts: SeasonEpisodeCounts | null;
};

export function episodesInSeason(
  counts: SeasonEpisodeCounts | null | undefined,
  season: number
): number | null {
  if (!counts) return null;
  const count = counts[String(season)];
  return typeof count === "number" && count > 0 ? count : null;
}

// A finale can only be declared when we know how many seasons the show has —
// without that, "is this the last season" is unanswerable, so we never guess.
export function isFinalEpisode(state: TvProgressState): boolean {
  const { season, episode, totalSeasons, totalEpisodes, seasonEpisodeCounts } = state;
  if (totalSeasons == null || season < totalSeasons) return false;

  const lastSeasonEpisodes = episodesInSeason(seasonEpisodeCounts, totalSeasons);
  if (lastSeasonEpisodes != null) return episode >= lastSeasonEpisodes;
  if (totalEpisodes != null) return episode >= totalEpisodes;
  return false;
}

// Clamps season >= 1 (<= totalSeasons if known) and episode >= 1 (<= that
// season's known episode count, else <= totalEpisodes if that's all we have).
export function clampProgress(state: TvProgressState): { season: number; episode: number } {
  const { totalSeasons, totalEpisodes, seasonEpisodeCounts } = state;

  let season = Math.max(1, Math.floor(state.season) || 1);
  if (totalSeasons != null) season = Math.min(season, totalSeasons);

  let episode = Math.max(1, Math.floor(state.episode) || 1);
  const seasonLimit = episodesInSeason(seasonEpisodeCounts, season);
  if (seasonLimit != null) {
    episode = Math.min(episode, seasonLimit);
  } else if (totalEpisodes != null) {
    episode = Math.min(episode, totalEpisodes);
  }

  return { season, episode };
}

// Advances by one episode, rolling into the next season once the current
// season's known episode count is passed. Without per-season data, this just
// increments the episode number (clamped against totalEpisodes if known) —
// the same behavior the tracker always had for shows with no season breakdown.
export function advanceEpisode(
  state: TvProgressState
): { season: number; episode: number; finished: boolean } {
  const { totalSeasons, totalEpisodes, seasonEpisodeCounts } = state;
  let season = state.season;
  let episode = state.episode + 1;

  const seasonLimit = episodesInSeason(seasonEpisodeCounts, season);
  if (seasonLimit != null && episode > seasonLimit) {
    if (totalSeasons == null || season < totalSeasons) {
      season += 1;
      episode = 1;
    } else {
      episode = seasonLimit;
    }
  }

  const clamped = clampProgress({ season, episode, totalSeasons, totalEpisodes, seasonEpisodeCounts });
  const finished = isFinalEpisode({ ...clamped, totalSeasons, totalEpisodes, seasonEpisodeCounts });
  return { ...clamped, finished };
}

// Season/episode to write when the user marks a show fully completed —
// "tick all episodes as watched."
export function finalProgress(
  state: Pick<TvProgressState, "totalSeasons" | "totalEpisodes" | "seasonEpisodeCounts">
): { season: number; episode: number } {
  const { totalSeasons, totalEpisodes, seasonEpisodeCounts } = state;

  if (totalSeasons != null) {
    const lastSeasonEpisodes = episodesInSeason(seasonEpisodeCounts, totalSeasons);
    if (lastSeasonEpisodes != null) {
      return { season: totalSeasons, episode: lastSeasonEpisodes };
    }
    return { season: totalSeasons, episode: totalEpisodes ?? 1 };
  }

  return { season: 1, episode: totalEpisodes ?? 1 };
}
