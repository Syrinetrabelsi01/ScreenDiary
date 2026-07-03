"use client";

export function DeleteButton({
  action,
  label = "Delete from library",
  confirmMessage = "Remove this title from your diary? This can't be undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-rose-500/30 px-4 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
      >
        {label}
      </button>
    </form>
  );
}
