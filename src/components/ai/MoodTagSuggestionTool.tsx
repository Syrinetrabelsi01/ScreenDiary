"use client";

import { useState, useTransition } from "react";
import { suggestMoodTags, type AiMoodTagsResult } from "@/app/ai/actions";

export function MoodTagSuggestionTool({ itemId }: { itemId: string }) {
  const [result, setResult] = useState<AiMoodTagsResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSuggest() {
    startTransition(async () => {
      const res = await suggestMoodTags(itemId);
      setResult(res);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSuggest}
        disabled={isPending}
        className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/15 disabled:opacity-50"
      >
        {isPending ? "Thinking…" : "✨ Suggest mood tags"}
      </button>

      {result?.status === "not_configured" && (
        <p className="mt-2 text-xs text-amber-300">
          AI is not configured yet. Add ANTHROPIC_API_KEY to your .env.local file.
        </p>
      )}
      {result?.status === "error" && <p className="mt-2 text-xs text-rose-400">{result.message}</p>}
      {result?.status === "ok" && (
        <p className="mt-2 text-xs text-muted">
          {result.tags.length > 0 ? (
            <>
              Consider adding: <span className="text-foreground">{result.tags.join(", ")}</span> —
              click them in the Mood Tags section above to apply.
            </>
          ) : (
            "No new suggestions — your existing tags already fit well."
          )}
        </p>
      )}
    </div>
  );
}
