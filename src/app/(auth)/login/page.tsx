"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthActionResult } from "../actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    async (_prevState, formData) => signIn(formData),
    undefined
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to continue your diary.</p>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-muted">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-muted underline underline-offset-4 hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>

          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-4 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
