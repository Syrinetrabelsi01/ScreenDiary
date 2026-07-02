import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { LibraryCard } from "@/components/LibraryCard";
import { EmptyState } from "@/components/EmptyState";
import type { SavedItemRow, MoodTagLinkRow } from "@/lib/supabase/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const savedItems: SavedItemRow[] = items ?? [];

  const { data: moodLinks } = await supabase
    .from("item_mood_tags")
    .select("saved_item_id, mood_tags(name)")
    .in("saved_item_id", savedItems.map((i) => i.id).length ? savedItems.map((i) => i.id) : ["00000000-0000-0000-0000-000000000000"]);

  const moodTagsByItem = new Map<string, string[]>();
  ((moodLinks ?? []) as unknown as MoodTagLinkRow[]).forEach((link) => {
    const name = link.mood_tags?.name;
    if (!name) return;
    const list = moodTagsByItem.get(link.saved_item_id) ?? [];
    list.push(name);
    moodTagsByItem.set(link.saved_item_id, list);
  });

  const counts = {
    want_to_watch: savedItems.filter((i) => i.status === "want_to_watch").length,
    watching: savedItems.filter((i) => i.status === "watching").length,
    completed: savedItems.filter((i) => i.status === "completed").length,
    favorite: savedItems.filter((i) => i.status === "favorite").length,
  };

  const continueWatching = savedItems.filter((i) => i.status === "watching").slice(0, 5);
  const recentlyAdded = [...savedItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const displayName = user.email?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Welcome back, <span className="text-gradient">{displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening in your diary.</p>
        </div>
        <Link
          href="/search"
          className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
        >
          🔎 Search for something to watch
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Want to Watch" value={counts.want_to_watch} emoji="📌" />
        <StatCard label="Watching" value={counts.watching} emoji="▶️" />
        <StatCard label="Completed" value={counts.completed} emoji="✅" />
        <StatCard label="Favorites" value={counts.favorite} emoji="❤️" />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl text-foreground">Continue Watching</h2>
        <div className="mt-4">
          {continueWatching.length === 0 ? (
            <EmptyState
              icon="▶️"
              title="Nothing in progress"
              description="Mark something as “Watching” from your library and it'll show up here."
              actionHref="/library"
              actionLabel="Go to library"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {continueWatching.map((item) => (
                <LibraryCard key={item.id} item={item} moodTags={moodTagsByItem.get(item.id) ?? []} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl text-foreground">Recently Added</h2>
        <div className="mt-4">
          {recentlyAdded.length === 0 ? (
            <EmptyState
              icon="📚"
              title="Your diary is empty"
              description="Search for a movie or TV show and add it to start building your library."
              actionHref="/search"
              actionLabel="Search now"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {recentlyAdded.map((item) => (
                <LibraryCard key={item.id} item={item} moodTags={moodTagsByItem.get(item.id) ?? []} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
