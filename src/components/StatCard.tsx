export function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number | string;
  emoji: string;
}) {
  return (
    <div className="glass-card flex items-center gap-4 rounded-2xl px-5 py-4">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="font-display text-2xl leading-none text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
