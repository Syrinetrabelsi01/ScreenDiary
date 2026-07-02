import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-32">
        <span className="glass-card rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-muted">
          🎬 A cozy home for everything you watch
        </span>

        <h1 className="mt-8 font-display text-5xl leading-tight text-foreground sm:text-7xl">
          Screen<span className="text-gradient">Diary</span>
        </h1>

        <p className="mt-4 text-lg text-muted sm:text-xl">Your personal movie and TV diary.</p>

        <p className="mt-6 max-w-2xl text-balance text-sm leading-relaxed text-muted sm:text-base">
          Search movies and shows, save them to your own library, track what you&apos;re
          watching episode by episode, rate what you finish, tag it with the mood it gave
          you, and write the notes only you will read. ScreenDiary is the diary Letterboxd
          and your Netflix history never gave you.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-8 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="glass-card rounded-full px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-white/10"
          >
            Log in
          </Link>
        </div>

        <div className="mt-20 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { emoji: "🔎", label: "Search movies & TV" },
            { emoji: "📚", label: "Personal library" },
            { emoji: "📺", label: "Episode tracking" },
            { emoji: "💭", label: "Moods & notes" },
          ].map((f) => (
            <div key={f.label} className="glass-card rounded-2xl px-4 py-6 text-center">
              <div className="text-2xl">{f.emoji}</div>
              <p className="mt-2 text-xs text-muted">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
