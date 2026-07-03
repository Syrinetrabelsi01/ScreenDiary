"use client";

import { useState, useTransition } from "react";
import { generateSpoilerFreeSummary, type AiTextResult } from "@/app/ai/actions";

export function SpoilerFreeSummaryTool({
  items,
  fixedItemId,
}: {
  items?: { id: string; title: string }[];
  fixedItemId?: string;
}) {
  const [selectedId, setSelectedId] = useState(items?.[0]?.id ?? "");
  const [result, setResult] = useState<AiTextResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const itemId = fixedItemId ?? selectedId;

  function handleGenerate() {
    if (!itemId) return;
    startTransition(async () => {
      const res = await generateSpoilerFreeSummary(itemId);
      setResult(res);
    });
  }

  return (
    <div className={fixedItemId ? "" : "glass-card rounded-2xl p-6"}>
      {!fixedItemId && (
        <>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl">🙈</span>
            <h2 className="font-display text-lg text-foreground">Spoiler-Free Summary</h2>
          </div>
          <p className="mb-4 text-sm text-muted">
            Pick something from your library — no spoilers, no endings.
          </p>
        </>
      )}

      {!fixedItemId && items && items.length > 0 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground outline-none"
        >
          {items.map((i) => (
            <option key={i.id} value={i.id} className="bg-background">
              {i.title}
            </option>
          ))}
        </select>
      )}

      {!fixedItemId && (!items || items.length === 0) ? (
        <p className="text-sm text-muted">Add something to your library first.</p>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || !itemId}
          className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Writing…" : "Generate spoiler-free summary"}
        </button>
      )}

      {result?.status === "not_configured" && (
        <p className="mt-4 text-sm text-amber-300">
          AI is not configured yet. Add ANTHROPIC_API_KEY to your .env.local file.
        </p>
      )}
      {result?.status === "error" && <p className="mt-4 text-sm text-rose-400">{result.message}</p>}
      {result?.status === "ok" && (
        <div className="mt-4 whitespace-pre-line rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-foreground">
          {result.text}
        </div>
      )}
    </div>
  );
}
