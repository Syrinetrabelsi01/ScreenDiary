"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinByCodeForm() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/shared/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. AB3D9F2K"
        className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground outline-none transition focus:border-accent-rose/50"
      />
      <button
        type="submit"
        className="rounded-full border border-white/10 px-4 py-2 text-sm text-foreground transition hover:border-white/20"
      >
        Open
      </button>
    </form>
  );
}
