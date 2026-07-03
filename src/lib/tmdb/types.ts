// Shapes for the subset of the TMDb API responses we actually use.
// TMDb returns many more fields than this — these are just the ones ScreenDiary reads.

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string; // movies
  name?: string; // tv shows
  overview: string;
  poster_path: string | null;
  release_date?: string; // movies
  first_air_date?: string; // tv shows
  vote_average: number;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbSeason {
  season_number: number;
  episode_count: number;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genres: TmdbGenre[];
  runtime: number | null;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  genres: TmdbGenre[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TmdbSeason[];
  episode_run_time: number[];
}

export interface TmdbReview {
  id: string;
  author: string;
  author_details: {
    rating: number | null;
  };
  content: string;
  created_at: string;
  url: string;
}

export interface TmdbReviewsResponse {
  results: TmdbReview[];
}

// Normalized shape used throughout the app UI, independent of movie/tv quirks.
export interface NormalizedMedia {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
}
