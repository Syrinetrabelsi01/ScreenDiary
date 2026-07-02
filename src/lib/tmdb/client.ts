import "server-only";
import type {
  TmdbMovieDetails,
  TmdbReviewsResponse,
  TmdbSearchResponse,
  TmdbTvDetails,
} from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Server-only fetch wrapper. Never import this file from a Client Component —
// the "server-only" package will throw a build error if you try.
async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const bearerToken = process.env.TMDB_BEARER_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!bearerToken && !apiKey) {
    throw new Error(
      "Missing TMDb credentials. Set TMDB_BEARER_TOKEN or TMDB_API_KEY in your .env.local file."
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  if (!bearerToken && apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  const res = await fetch(url.toString(), {
    headers: bearerToken
      ? { Authorization: `Bearer ${bearerToken}`, Accept: "application/json" }
      : { Accept: "application/json" },
    // Search/details data changes rarely enough that a short cache is fine.
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`TMDb request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

export function searchMulti(query: string, page = 1) {
  return tmdbFetch<TmdbSearchResponse>("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export function getMovieDetails(tmdbId: number) {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${tmdbId}`);
}

export function getTvDetails(tmdbId: number) {
  return tmdbFetch<TmdbTvDetails>(`/tv/${tmdbId}`);
}

export function getReviews(tmdbId: number, mediaType: "movie" | "tv") {
  return tmdbFetch<TmdbReviewsResponse>(`/${mediaType}/${tmdbId}/reviews`);
}
