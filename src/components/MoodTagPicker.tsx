"use client";

import { useState } from "react";
import { MOOD_TAGS } from "@/lib/constants";

export function MoodTagPicker({
  name,
  defaultSelected,
}: {
  name: string;
  defaultSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[...selected].map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
      {MOOD_TAGS.map((tag) => {
        const active = selected.has(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-white/15 text-foreground ring-1 ring-white/25"
                : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
