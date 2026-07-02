import Link from "next/link";

export function EmptyState({
  icon = "🎬",
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-2xl px-8 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-3 rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-5 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
