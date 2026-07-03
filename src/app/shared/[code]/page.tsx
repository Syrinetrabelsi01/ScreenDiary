import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { SharedItemCard } from "@/components/SharedItemCard";
import { addItemToSharedList, deleteSharedList } from "@/app/shared/actions";
import { tmdbImageUrl } from "@/lib/utils";
import type { SharedListItemRow, VoteType } from "@/lib/supabase/database.types";

const EMPTY_COUNTS: Record<VoteType, number> = {
  want_to_watch: 0,
  maybe: 0,
  not_interested: 0,
};

export default async function SharedListPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = code.toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: list } = await supabase
    .from("shared_lists")
    .select("*")
    .eq("invite_code", normalizedCode)
    .maybeSingle();

  if (!list) notFound();

  const isOwner = list.owner_id === user.id;

  const { data: items } = await supabase
    .from("shared_list_items")
    .select("*")
    .eq("shared_list_id", list.id)
    .order("created_at", { ascending: false });

  const sharedItems: SharedListItemRow[] = items ?? [];

  const { data: votes } = await supabase
    .from("shared_list_votes")
    .select("shared_list_item_id, voter_id, vote_type")
    .in(
      "shared_list_item_id",
      sharedItems.length ? sharedItems.map((i) => i.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  const countsByItem = new Map<string, Record<VoteType, number>>();
  const myVoteByItem = new Map<string, VoteType>();
  (votes ?? []).forEach((v) => {
    const counts = countsByItem.get(v.shared_list_item_id) ?? { ...EMPTY_COUNTS };
    counts[v.vote_type as VoteType] += 1;
    countsByItem.set(v.shared_list_item_id, counts);
    if (v.voter_id === user.id) myVoteByItem.set(v.shared_list_item_id, v.vote_type as VoteType);
  });

  let addableItems: { id: string; title: string; poster_path: string | null }[] = [];
  if (isOwner) {
    const { data: mySavedItems } = await supabase
      .from("saved_items")
      .select("id, tmdb_id, media_type, title, poster_path")
      .eq("user_id", user.id);

    const alreadyOnList = new Set(sharedItems.map((i) => `${i.tmdb_id}-${i.media_type}`));
    addableItems = (mySavedItems ?? [])
      .filter((i) => !alreadyOnList.has(`${i.tmdb_id}-${i.media_type}`))
      .map((i) => ({ id: i.id, title: i.title, poster_path: i.poster_path }));
  }

  const boundDeleteList = deleteSharedList.bind(null, list.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{list.name}</h1>
          {list.description && <p className="mt-1 text-sm text-muted">{list.description}</p>}
          <p className="mt-2 text-xs text-muted">
            Invite code: <span className="font-mono text-foreground">{list.invite_code}</span> — share
            it so others can view and vote.
          </p>
        </div>
        {isOwner && (
          <form
            action={boundDeleteList}
            onSubmit={(e) => {
              if (!confirm("Delete this shared list for everyone? This can't be undone.")) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-rose-500/30 px-4 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
            >
              Delete list
            </button>
          </form>
        )}
      </div>

      {isOwner && (
        <div className="glass-card mb-8 rounded-2xl p-5">
          <h2 className="mb-3 font-display text-lg text-foreground">Add from my library</h2>
          {addableItems.length === 0 ? (
            <p className="text-sm text-muted">
              Everything in your library is already on this list (or your library is empty).
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {addableItems.map((item) => (
                <form
                  key={item.id}
                  action={addItemToSharedList.bind(null, list.id, item.id)}
                  className="flex w-28 flex-shrink-0 flex-col gap-2"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-background-elevated">
                    {tmdbImageUrl(item.poster_path, "w200") ? (
                      <Image
                        src={tmdbImageUrl(item.poster_path, "w200")!}
                        alt={item.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">🎞️</div>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[11px] text-foreground">{item.title}</p>
                  <button
                    type="submit"
                    className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-white/15"
                  >
                    ＋ Add
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      )}

      {sharedItems.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No items yet"
          description={
            isOwner
              ? "Add something from your library above to get started."
              : "The owner hasn't added anything to this list yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sharedItems.map((item) => (
            <SharedItemCard
              key={item.id}
              item={item}
              counts={countsByItem.get(item.id) ?? EMPTY_COUNTS}
              myVote={myVoteByItem.get(item.id)}
              listCode={list.invite_code}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
}
