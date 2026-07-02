"use client";

import { useState } from "react";
import { formatDate, truncate } from "@/lib/utils";
import type { TmdbReview } from "@/lib/tmdb/types";

export function ReviewItem({ review }: { review: TmdbReview }) {
  const [expanded, setExpanded] = useState(false);
  const { text, wasTruncated } = truncate(review.content, 400);

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{review.author}</p>
        <div className="flex items-center gap-2 text-xs text-muted">
          {review.author_details.rating && (
            <span className="text-amber-300">★ {review.author_details.rating}/10</span>
          )}
          <span>{formatDate(review.created_at)}</span>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
        {expanded ? review.content : text}
      </p>
      {wasTruncated && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-accent-rose hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
