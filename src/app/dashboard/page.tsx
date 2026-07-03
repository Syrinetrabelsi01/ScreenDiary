import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedItemsWithMoodTags } from "@/lib/supabase/queries";
import { StatCard } from "@/components/StatCard";
import { StatBar } from "@/components/StatBar";
import { LibraryCard } from "@/components/LibraryCard";
import { EmptyState } from "@/components/EmptyState";
import { STATUS_OPTIONS, statusLabel } from "@/lib/constants";
import { isWithinPastDays } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getSavedItemsWithMoodTags(supabase, user.id);
  const savedItems = entries.map((e) => e.item);
  const moodTagsByItem = new Map(entries.map((e) => [e.item.id, e.moodTags]));
  const total = savedItems.length;

  const statusCounts = Object.fromEntries(
    STATUS_OPTIONS.map((s) => [s.value, savedItems.filter((i) => i.status === s.value).length])
  ) as Record<(typeof STATUS_OPTIONS)[number]["value"], number>;

  const moviesWatched = savedItems.filter(
    (i) => i.media_type === "movie" && i.status === "completed"
  ).length;
  const tvShowsTracked = savedItems.filter((i) => i.media_type === "tv").length;

  const ratedItems = savedItems.filter((i) => i.personal_rating !== null);
  const averageRating =
    ratedItems.length > 0
      ? (ratedItems.reduce((sum, i) => sum + (i.personal_rating ?? 0), 0) / ratedItems.length).toFixed(1)
      : "—";

  const recentlyCompletedCount = savedItems.filter((i) => isWithinPastDays(i.completed_at, 30)).length;

  const moodTagCounts = new Map<string, number>();
  entries.forEach((e) => e.moodTags.forEach((tag) => moodTagCounts.set(tag, (moodTagCounts.get(tag) ?? 0) + 1)));
  const topMoodTags = [...moodTagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const mostUsedMoodTag = topMoodTags[0]?.[0] ?? null;

  const highestRatedItem = [...ratedItems].sort(
    (a, b) => (b.personal_rating ?? 0) - (a.personal_rating ?? 0)
  )[0];

  const topRatedItems = [...ratedItems]
    .sort((a, b) => (b.personal_rating ?? 0) - (a.personal_rating ?? 0))
    .slice(0, 5);

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <StatCard label="Total Saved" value={total} emoji="📚" />
        <StatCard label="Want to Watch" value={statusCounts.want_to_watch ?? 0} emoji="📌" />
        <StatCard label="Watching" value={statusCounts.watching ?? 0} emoji="▶️" />
        <StatCard label="Completed" value={statusCounts.completed ?? 0} emoji="✅" />
        <StatCard label="Dropped" value={statusCounts.dropped ?? 0} emoji="⏸️" />
        <StatCard label="Favorites" value={statusCounts.favorite ?? 0} emoji="❤️" />
        <StatCard label="Movies Watched" value={moviesWatched} emoji="🎬" />
        <StatCard label="TV Shows Tracked" value={tvShowsTracked} emoji="📺" />
        <StatCard label="Average Rating" value={averageRating} emoji="⭐" />
        <StatCard label="Completed (30d)" value={recentlyCompletedCount} emoji="🗓️" />
      </div>

      {(mostUsedMoodTag || highestRatedItem) && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {mostUsedMoodTag && (
            <div className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4">
              <span className="text-2xl">💭</span>
              <div>
                <p className="font-display text-xl text-foreground">{mostUsedMoodTag}</p>
                <p className="text-xs text-muted">Your most-used mood tag</p>
              </div>
            </div>
          )}
          {highestRatedItem && (
            <div className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-display text-xl text-foreground">{highestRatedItem.title}</p>
                <p className="text-xs text-muted">
                  Highest rated — {highestRatedItem.personal_rating}/10
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {total > 0 && (
        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="glass-card space-y-4 rounded-2xl p-5">
            <h2 className="font-display text-lg text-foreground">Status Breakdown</h2>
            {STATUS_OPTIONS.map((s) => (
              <StatBar
                key={s.value}
                label={statusLabel(s.value)}
                count={statusCounts[s.value] ?? 0}
                total={total}
              />
            ))}
          </div>

          <div className="glass-card space-y-4 rounded-2xl p-5">
            <h2 className="font-display text-lg text-foreground">Mood Tag Breakdown</h2>
            {topMoodTags.length === 0 ? (
              <p className="text-sm text-muted">
                Add mood tags to your saved items to see your patterns here.
              </p>
            ) : (
              topMoodTags.map(([tag, count]) => (
                <StatBar key={tag} label={tag} count={count} total={entries.length} />
              ))
            )}
          </div>
        </section>
      )}

      {topRatedItems.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl text-foreground">Top Rated</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {topRatedItems.map((item) => (
              <LibraryCard key={item.id} item={item} moodTags={moodTagsByItem.get(item.id) ?? []} />
            ))}
          </div>
        </section>
      )}

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
