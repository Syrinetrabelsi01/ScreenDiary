import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedItemsWithMoodTags } from "@/lib/supabase/queries";
import { LibraryCard } from "@/components/LibraryCard";
import { EmptyState } from "@/components/EmptyState";
import { FILTER_OPTIONS, SORT_OPTIONS, type FilterOption, type SortOption } from "@/lib/constants";
import type { SavedItemRow } from "@/lib/supabase/database.types";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const { filter: rawFilter, sort: rawSort } = await searchParams;
  const filter: FilterOption = (FILTER_OPTIONS.find((f) => f.value === rawFilter)?.value ??
    "all") as FilterOption;
  const sort: SortOption = (SORT_OPTIONS.find((s) => s.value === rawSort)?.value ?? "recent") as SortOption;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getSavedItemsWithMoodTags(supabase, user.id);
  const moodTagsByItem = new Map(entries.map((e) => [e.item.id, e.moodTags]));
  let savedItems: SavedItemRow[] = entries.map((e) => e.item);
  const totalItems = savedItems.length;

  if (filter === "movie" || filter === "tv") {
    savedItems = savedItems.filter((i) => i.media_type === filter);
  } else if (filter !== "all") {
    savedItems = savedItems.filter((i) => i.status === filter);
  }

  savedItems = [...savedItems].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "rating") return (b.personal_rating ?? -1) - (a.personal_rating ?? -1);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">Your Library</h1>
          <p className="mt-1 text-sm text-muted">Everything you&apos;ve saved to ScreenDiary.</p>
        </div>
        <Link
          href="/search"
          className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2.5 text-center text-sm font-semibold text-background transition hover:opacity-90"
        >
          ＋ Add something new
        </Link>
      </div>

      {totalItems > 0 && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={`/library?filter=${option.value}&sort=${sort}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  filter === option.value
                    ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
                    : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            Sort by
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={`/library?filter=${filter}&sort=${option.value}`}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  sort === option.value
                    ? "bg-white/15 text-foreground"
                    : "border border-white/10 hover:border-white/20 hover:text-foreground"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalItems === 0 ? (
        <EmptyState
          icon="📚"
          title="Your diary is empty"
          description="Search for a movie or TV show and add it to start building your library."
          actionHref="/search"
          actionLabel="Search now"
        />
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Nothing matches this filter"
          description="Try a different filter or add more titles to your diary."
          actionHref="/library"
          actionLabel="Clear filters"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {savedItems.map((item) => (
            <LibraryCard key={item.id} item={item} moodTags={moodTagsByItem.get(item.id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
