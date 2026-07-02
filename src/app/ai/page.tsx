import Link from "next/link";

// Placeholder for Phase 2/3. See the "Future-ready structure" section of the
// project README for the full roadmap this page will grow into:
//   - Watch Tonight recommendations
//   - Random picker
//   - Stats dashboard
//   - AI recommendation helper
//   - AI review cleaner
//   - AI mood matcher
//   - Spoiler-free summary
//   - Shared watchlists
export default function AiPage() {
  const upcoming = [
    { emoji: "🌙", label: "Watch Tonight recommendations" },
    { emoji: "🎲", label: "Random picker" },
    { emoji: "📊", label: "Stats dashboard" },
    { emoji: "🤖", label: "AI recommendation helper" },
    { emoji: "🧹", label: "AI review cleaner" },
    { emoji: "💭", label: "AI mood matcher" },
    { emoji: "🙈", label: "Spoiler-free summary" },
    { emoji: "🤝", label: "Shared watchlists" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <span className="text-4xl">✨</span>
      <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">
        AI features are <span className="text-gradient">coming soon</span>
      </h1>
      <p className="mt-3 text-sm text-muted">
        Phase 1 is all about your personal diary. Once that foundation is solid, ScreenDiary
        will layer AI on top of it.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {upcoming.map((f) => (
          <div key={f.label} className="glass-card rounded-2xl px-4 py-6">
            <div className="text-2xl">{f.emoji}</div>
            <p className="mt-2 text-xs text-muted">{f.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="mt-10 inline-block rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
