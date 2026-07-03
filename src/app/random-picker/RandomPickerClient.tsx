"use client";

import { useState, useTransition } from "react";
import { RANDOM_PICKER_CATEGORIES, type RandomPickerCategory } from "@/lib/constants";
import { pickRandom, type RandomPickResult } from "./actions";
import { LibraryCard } from "@/components/LibraryCard";
import { EmptyState } from "@/components/EmptyState";

export function RandomPickerClient() {
  const [category, setCategory] = useState<RandomPickerCategory>("all");
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [result, setResult] = useState<RandomPickResult | null>(null);
  const [, startTransition] = useTransition();

  function handlePick() {
    setPhase("spinning");
    setResult(null);
    startTransition(async () => {
      const res = await pickRandom(category);
      // Brief cinematic pause so the "spinning" state is visible even on fast connections.
      setTimeout(() => {
        setResult(res);
        setPhase("result");
      }, 650);
    });
  }

  const categoryLabel =
    RANDOM_PICKER_CATEGORIES.find((c) => c.value === category)?.label ?? "your library";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-center">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">
        Random <span className="text-gradient">Picker</span>
      </h1>
      <p className="mt-2 text-sm text-muted">Can&apos;t decide? Let ScreenDiary choose for you.</p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {RANDOM_PICKER_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              category === c.value
                ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
                : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePick}
        disabled={phase === "spinning"}
        className="mt-8 rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-8 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {phase === "spinning" ? "Picking…" : "🎲 Pick for me"}
      </button>

      <div className="mt-10">
        {phase === "spinning" && (
          <div className="glass-card mx-auto flex max-w-xs flex-col items-center gap-3 rounded-2xl px-8 py-16">
            <span className="animate-pulse text-4xl">🎬</span>
            <p className="animate-pulse text-sm text-muted">Picking something for you…</p>
          </div>
        )}

        {phase === "result" && result?.status === "picked" && (
          <div className="mx-auto max-w-xs">
            <LibraryCard
              item={result.item}
              moodTags={result.moodTags}
              reason={`Picked at random from "${categoryLabel}."`}
            />
          </div>
        )}

        {phase === "result" && result?.status === "empty" && (
          <EmptyState
            icon="🗂️"
            title="Nothing in that category yet"
            description="Try a different category, or add more titles to your diary first."
            actionHref="/search"
            actionLabel="Search now"
          />
        )}
      </div>
    </div>
  );
}
