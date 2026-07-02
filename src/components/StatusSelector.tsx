"use client";

import { useState } from "react";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { SavedItemStatus } from "@/lib/supabase/database.types";

export function StatusSelector({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: SavedItemStatus;
}) {
  const [status, setStatus] = useState<SavedItemStatus>(defaultValue);

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={status} />
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setStatus(option.value)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            status === option.value
              ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
              : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
          }`}
        >
          {option.emoji} {option.label}
        </button>
      ))}
    </div>
  );
}
