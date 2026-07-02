"use client";

import { useState } from "react";
import { EMOJI_REACTIONS } from "@/lib/constants";

export function EmojiPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string | null;
}) {
  const [emoji, setEmoji] = useState<string | null>(defaultValue);

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={emoji ?? ""} />
      {EMOJI_REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => setEmoji(emoji === e ? null : e)}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
            emoji === e
              ? "bg-white/15 ring-1 ring-white/30"
              : "border border-white/10 hover:border-white/20"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
