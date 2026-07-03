"use client";

import { useState, useTransition } from "react";
import { cleanReview, type AiTextResult } from "@/app/ai/actions";

export function NotesWithAiCleaner({ defaultValue }: { defaultValue: string }) {
  const [notes, setNotes] = useState(defaultValue);
  const [result, setResult] = useState<AiTextResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClean() {
    if (!notes.trim()) return;
    startTransition(async () => {
      const res = await cleanReview(notes);
      setResult(res);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        name="personal_notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Write your own review, thoughts, or memories about this one…"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent-rose/50"
      />

      <button
        type="button"
        onClick={handleClean}
        disabled={isPending || !notes.trim()}
        className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/15 disabled:opacity-50"
      >
        {isPending ? "Cleaning…" : "🧹 Clean up my review with AI"}
      </button>

      {result?.status === "not_configured" && (
        <p className="text-xs text-amber-300">
          AI is not configured yet. Add ANTHROPIC_API_KEY to your .env.local file.
        </p>
      )}
      {result?.status === "error" && <p className="text-xs text-rose-400">{result.message}</p>}
      {result?.status === "ok" && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-foreground">
          <p className="whitespace-pre-line leading-relaxed">{result.text}</p>
          <button
            type="button"
            onClick={() => setNotes(result.text)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted transition hover:border-white/20 hover:text-foreground"
          >
            Use this
          </button>
        </div>
      )}
    </div>
  );
}
