"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthActionResult } from "../actions";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    async (_prevState, formData) => signUp(formData),
    undefined
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md flex-col justify-center px-6 py-16">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-3xl text-foreground">Start your diary</h1>
        <p className="mt-1 text-sm text-muted">Create a free account to save what you watch.</p>

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
            <label htmlFor="password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm text-muted">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>

          {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
          {state?.info && <p className="text-sm text-emerald-400">{state.info}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-4 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
