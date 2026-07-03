"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-3xl text-foreground">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted">We&apos;ll email you a link to reset it.</p>

        {status === "sent" ? (
          <p className="mt-6 text-sm text-emerald-400">
            Check your email for a password reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
              />
            </div>

            {status === "error" && error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={status === "pending"}
              className="w-full rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-4 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {status === "pending" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
