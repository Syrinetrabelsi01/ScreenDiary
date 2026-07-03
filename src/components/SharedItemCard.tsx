import Image from "next/image";
import { tmdbImageUrl } from "@/lib/utils";
import { castVote, removeItemFromSharedList } from "@/app/shared/actions";
import type { SharedListItemRow, VoteType } from "@/lib/supabase/database.types";

const VOTE_OPTIONS: { value: VoteType; label: string; emoji: string }[] = [
  { value: "want_to_watch", label: "Want to watch", emoji: "👍" },
  { value: "maybe", label: "Maybe", emoji: "🤔" },
  { value: "not_interested", label: "Not interested", emoji: "🙅" },
];

export function SharedItemCard({
  item,
  counts,
  myVote,
  listCode,
  isOwner,
}: {
  item: SharedListItemRow;
  counts: Record<VoteType, number>;
  myVote: VoteType | undefined;
  listCode: string;
  isOwner: boolean;
}) {
  const poster = tmdbImageUrl(item.poster_path, "w342");

  return (
    <div className="glass-card flex gap-4 rounded-2xl p-4">
      <div className="relative h-32 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-background-elevated">
        {poster ? (
          <Image src={poster} alt={item.title} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🎞️</div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
            {item.media_type === "movie" ? "Movie" : "TV Show"}
          </span>
          <h3 className="mt-1 font-display text-base text-foreground">{item.title}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VOTE_OPTIONS.map((opt) => (
            <form key={opt.value} action={castVote.bind(null, item.id, listCode, opt.value)}>
              <button
                type="submit"
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  myVote === opt.value
                    ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
                    : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
                }`}
              >
                {opt.emoji} {opt.label} ({counts[opt.value]})
              </button>
            </form>
          ))}
        </div>

        {isOwner && (
          <form action={removeItemFromSharedList.bind(null, item.id, listCode)}>
            <button type="submit" className="text-xs text-rose-400 hover:underline">
              Remove from list
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
