"use client";

import { useActionState } from "react";
import { createSharedList, type CreateSharedListResult } from "@/app/shared/actions";

export default function NewSharedListPage() {
  const [state, formAction, isPending] = useActionState<CreateSharedListResult, FormData>(
    async (_prevState, formData) =>
      createSharedList(String(formData.get("name") ?? ""), String(formData.get("description") ?? "")),
    undefined
  );

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="glass-card rounded-3xl p-8">
        <h1 className="font-display text-2xl text-foreground">New Shared Watchlist</h1>
        <p className="mt-1 text-sm text-muted">
          Create a list you can share with friends by invite code.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm text-muted">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Girls' night picks"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>
          <div>
            <label htmlFor="description" className="text-sm text-muted">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What's this list for?"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-foreground outline-none transition focus:border-accent-rose/50"
            />
          </div>

          {state?.status === "error" && <p className="text-sm text-rose-400">{state.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-4 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Creating…" : "Create list"}
          </button>
        </form>
      </div>
    </div>
  );
}
