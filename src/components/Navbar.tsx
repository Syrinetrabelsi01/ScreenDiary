import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="font-display text-xl font-semibold tracking-tight text-foreground"
        >
          Screen<span className="text-gradient">Diary</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-muted transition hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/search" className="text-muted transition hover:text-foreground">
              Search
            </Link>
            <Link href="/library" className="text-muted transition hover:text-foreground">
              Library
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-1.5 text-muted transition hover:border-white/20 hover:text-foreground"
              >
                Logout
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-muted transition hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-accent-rose to-accent-purple px-4 py-2 font-medium text-background transition hover:opacity-90"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
