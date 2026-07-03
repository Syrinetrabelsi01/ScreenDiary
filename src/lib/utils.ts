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
 * TV progress as a percentage. When `seasonEpisodeCounts` is available (real
 * per-season episode counts from TMDb), this sums exact watched episodes.
 * Otherwise it falls back to assuming an even distribution of episodes
 * across seasons using the aggregate total_seasons/total_episodes.
 */
export function computeProgress({
  currentSeason,
  currentEpisode,
  totalSeasons,
  totalEpisodes,
  seasonEpisodeCounts,
}: {
  currentSeason: number | null;
  currentEpisode: number | null;
  totalSeasons: number | null;
  totalEpisodes: number | null;
  seasonEpisodeCounts?: Record<string, number> | null;
}): number | null {
  if (!currentSeason || !currentEpisode) return null;

  if (seasonEpisodeCounts && Object.keys(seasonEpisodeCounts).length > 0) {
    const seasonNumbers = Object.keys(seasonEpisodeCounts)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const totalFromMap = seasonNumbers.reduce(
      (sum, s) => sum + (seasonEpisodeCounts[String(s)] ?? 0),
      0
    );

    if (totalFromMap > 0) {
      let watched = 0;
      for (const s of seasonNumbers) {
        if (s < currentSeason) watched += seasonEpisodeCounts[String(s)] ?? 0;
      }
      const currentSeasonCount = seasonEpisodeCounts[String(currentSeason)];
      watched += currentSeasonCount != null ? Math.min(currentEpisode, currentSeasonCount) : currentEpisode;

      const percent = Math.round((watched / totalFromMap) * 100);
      return Math.min(100, Math.max(0, percent));
    }
  }

  if (!totalSeasons || !totalEpisodes || totalSeasons <= 0 || totalEpisodes <= 0) {
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

// Kept as a plain helper (rather than inlined `Date.now()` in a component body)
// so the current-time read stays outside anything React's purity rules treat as render.
export function isWithinPastDays(dateString: string | null | undefined, days: number): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}
