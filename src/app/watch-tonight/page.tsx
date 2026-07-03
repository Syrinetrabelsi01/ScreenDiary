import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedItemsWithMoodTags } from "@/lib/supabase/queries";
import { recommendForTonight } from "@/lib/recommend";
import { LibraryCard } from "@/components/LibraryCard";
import { EmptyState } from "@/components/EmptyState";
import {
  WATCH_TYPE_OPTIONS,
  WATCH_TIME_OPTIONS,
  MOOD_CHOICES,
  WATCH_MODE_OPTIONS,
  type WatchType,
  type WatchTime,
  type MoodChoice,
  type WatchMode,
} from "@/lib/constants";

type Params = { type?: string; time?: string; mood?: string; mode?: string };

export default async function WatchTonightPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const raw = await searchParams;
  const type: WatchType = (WATCH_TYPE_OPTIONS.find((o) => o.value === raw.type)?.value ??
    "either") as WatchType;
  const time: WatchTime = (WATCH_TIME_OPTIONS.find((o) => o.value === raw.time)?.value ??
    "any") as WatchTime;
  const mood: MoodChoice = (MOOD_CHOICES.find((o) => o.value === raw.mood)?.value ??
    "random") as MoodChoice;
  const mode: WatchMode = (WATCH_MODE_OPTIONS.find((o) => o.value === raw.mode)?.value ??
    "either") as WatchMode;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getSavedItemsWithMoodTags(supabase, user.id);

  function hrefWith(overrides: Partial<Params>) {
    const params = new URLSearchParams({ type, time, mood, mode, ...overrides });
    return `/watch-tonight?${params.toString()}`;
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          icon="🌙"
          title="Nothing to recommend yet"
          description="Your diary is still empty. Add movies or shows first so ScreenDiary can recommend something."
          actionHref="/search"
          actionLabel="Search now"
        />
      </div>
    );
  }

  const { main, backups } = recommendForTonight(entries, { type, time, mood, mode });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">
          Watch <span className="text-gradient">Tonight</span>
        </h1>
        <p className="mt-2 text-sm text-muted">Answer a few questions and I&apos;ll pick something from your diary.</p>
      </div>

      <div className="glass-card mx-auto max-w-3xl space-y-5 rounded-2xl p-6">
        <PillRow label="Movie or TV show?">
          {WATCH_TYPE_OPTIONS.map((o) => (
            <Pill key={o.value} href={hrefWith({ type: o.value })} active={type === o.value}>
              {o.label}
            </Pill>
          ))}
        </PillRow>

        <PillRow label="How much time do you have?">
          {WATCH_TIME_OPTIONS.map((o) => (
            <Pill key={o.value} href={hrefWith({ time: o.value })} active={time === o.value}>
              {o.label}
            </Pill>
          ))}
        </PillRow>

        <PillRow label="What mood are you in?">
          {MOOD_CHOICES.map((o) => (
            <Pill key={o.value} href={hrefWith({ mood: o.value })} active={mood === o.value}>
              {o.label}
            </Pill>
          ))}
        </PillRow>

        <PillRow label="Continue something, or pick new?">
          {WATCH_MODE_OPTIONS.map((o) => (
            <Pill key={o.value} href={hrefWith({ mode: o.value })} active={mode === o.value}>
              {o.label}
            </Pill>
          ))}
        </PillRow>
      </div>

      <div className="mt-10">
        {!main ? (
          <EmptyState
            icon="🗂️"
            title="Nothing matches those filters"
            description="Try a different type, mood, or time — or add more titles to your diary."
            actionHref="/watch-tonight"
            actionLabel="Reset filters"
          />
        ) : (
          <>
            <h2 className="mb-4 text-center font-display text-lg text-foreground">Tonight&apos;s pick</h2>
            <div className="mx-auto max-w-xs">
              <LibraryCard item={main.item} moodTags={main.moodTags} reason={main.reason} />
            </div>

            {backups.length > 0 && (
              <div className="mt-12">
                <h3 className="mb-4 text-center text-sm text-muted">Or maybe one of these…</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {backups.map((b) => (
                    <LibraryCard key={b.item.id} item={b.item} moodTags={b.moodTags} reason={b.reason} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PillRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-gradient-to-r from-accent-rose to-accent-purple text-background"
          : "border border-white/10 text-muted hover:border-white/20 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
