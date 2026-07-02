"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
