import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      "[void] Supabase credentials missing in production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  console.error(
    "[void] Supabase credentials missing. The archive cannot remember you.",
  );
}

// Fall back to placeholder values so createClient never throws on init.
// Auth operations will fail gracefully via network errors instead.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  last_seen_at: string;
}
