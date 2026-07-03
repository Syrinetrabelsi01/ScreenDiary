"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function MobileNav({ onLogout }: { onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-foreground transition hover:border-white/20"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-white/5 bg-background/95 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <form action={onLogout}>
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted transition hover:bg-white/5 hover:text-foreground"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
