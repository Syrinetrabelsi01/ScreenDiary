"use client";

import { useState } from "react";

export function RatingPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null;
}) {
  const [rating, setRating] = useState<number | null>(defaultValue);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name={name} value={rating ?? ""} />
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setRating(rating === n ? null : n)}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
            rating !== null && n <= rating
              ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
              : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
          }`}
        >
          {n}
        </button>
      ))}
      {rating !== null && <span className="ml-1 text-xs text-muted">{rating}/10</span>}
    </div>
  );
}
