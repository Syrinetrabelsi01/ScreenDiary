import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { JoinByCodeForm } from "@/components/JoinByCodeForm";

export default async function SharedListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lists } = await supabase
    .from("shared_lists")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">Shared Watchlists</h1>
          <p className="mt-1 text-sm text-muted">Build a list together, vote on what to watch.</p>
        </div>
        <Link
          href="/shared/new"
          className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
        >
          ＋ New shared list
        </Link>
      </div>

      <div className="glass-card mb-8 rounded-2xl p-5">
        <h2 className="mb-2 font-display text-sm text-foreground">Have an invite code?</h2>
        <JoinByCodeForm />
      </div>

      {!lists || lists.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No shared lists yet"
          description="Create one and share the invite code with friends to decide what to watch together."
          actionHref="/shared/new"
          actionLabel="Create a list"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/shared/${list.invite_code}`}
              className="glass-card rounded-2xl p-5 transition hover:-translate-y-0.5"
            >
              <h3 className="font-display text-lg text-foreground">{list.name}</h3>
              {list.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">{list.description}</p>
              )}
              <p className="mt-3 text-xs text-muted">
                Code: <span className="font-mono text-foreground">{list.invite_code}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
