"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Used inside Client Components (forms, interactive widgets).
// Safe to expose: the anon key is designed to be public and is gated by RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
