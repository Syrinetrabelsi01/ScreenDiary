"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { addToLibrary } from "@/app/library/actions";
import type { TmdbSearchResult } from "@/lib/tmdb/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setIsLoading(true);
      setError(null);

      fetch(`/api/tmdb/search?query=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Search failed");
          setResults(data.results ?? []);
        })
        .catch((err) => {
          if ((err as Error).name !== "AbortError") {
            setError("Couldn't reach TMDb. Please try again.");
          }
        })
        .finally(() => setIsLoading(false));
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Find something to <span className="text-gradient">watch</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Search movies and TV shows powered by TMDb.</p>
      </div>

      <div className="mx-auto max-w-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie or TV show…"
          className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-foreground outline-none transition focus:border-accent-rose/50"
          autoFocus
        />
      </div>

      <div className="mt-10">
        {isLoading && (
          <div className="flex justify-center py-16 text-muted">
            <Spinner />
          </div>
        )}

        {!isLoading && error && (
          <EmptyState icon="⚠️" title="Something went wrong" description={error} />
        )}

        {!isLoading && !error && trimmedQuery && results.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No results"
            description="We couldn't find any movies or TV shows matching that search. Try a different title."
          />
        )}

        {!isLoading && !error && !trimmedQuery && (
          <EmptyState
            icon="🎬"
            title="Start typing to search"
            description="Search across thousands of movies and TV shows, then add your favorites straight to your diary."
          />
        )}

        {!isLoading && trimmedQuery && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((result) => (
              <MovieCard key={`${result.media_type}-${result.id}`} result={result} onAdd={addToLibrary} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
