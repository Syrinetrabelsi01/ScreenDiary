// Builds a TMDb CDN image URL. This is just string concatenation against a
// public CDN — no secret involved — so it's safe to use from Client Components.
export function tmdbImageUrl(
  path: string | null | undefined,
  size: "w200" | "w342" | "w500" | "original" = "w500"
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatYear(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const year = dateString.slice(0, 4);
  return year || "—";
}

/**
 * Approximates TV progress as a percentage. ScreenDiary only stores aggregate
 * total_seasons/total_episodes (not a per-season episode breakdown), so this
 * assumes an even distribution of episodes across seasons.
 */
export function computeProgress({
  currentSeason,
  currentEpisode,
  totalSeasons,
  totalEpisodes,
}: {
  currentSeason: number | null;
  currentEpisode: number | null;
  totalSeasons: number | null;
  totalEpisodes: number | null;
}): number | null {
  if (
    !currentSeason ||
    !currentEpisode ||
    !totalSeasons ||
    !totalEpisodes ||
    totalSeasons <= 0 ||
    totalEpisodes <= 0
  ) {
    return null;
  }

  const avgEpisodesPerSeason = totalEpisodes / totalSeasons;
  const episodesWatched = (currentSeason - 1) * avgEpisodesPerSeason + currentEpisode;
  const percent = Math.round((episodesWatched / totalEpisodes) * 100);
  return Math.min(100, Math.max(0, percent));
}

export function truncate(text: string, maxLength: number): { text: string; wasTruncated: boolean } {
  if (text.length <= maxLength) return { text, wasTruncated: false };
  return { text: text.slice(0, maxLength).trimEnd() + "…", wasTruncated: true };
}
