"use client";

import { useState, useTransition } from "react";
import type { AiTextResult } from "@/app/ai/actions";

export function AiToolCard({
  icon,
  title,
  description,
  placeholder,
  submitLabel,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  action: (text: string) => Promise<AiTextResult>;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<AiTextResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    startTransition(async () => {
      const res = await action(value);
      setResult(res);
    });
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="font-display text-lg text-foreground">{title}</h2>
      </div>
      <p className="mb-4 text-sm text-muted">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent-rose/50"
        />
        <button
          type="submit"
          disabled={isPending || !value.trim()}
          className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Thinking…" : submitLabel}
        </button>
      </form>

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
