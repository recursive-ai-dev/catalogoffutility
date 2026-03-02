import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      "[void] Supabase credentials missing. The archive cannot initialize in production.",
    );
  }
  console.error(
    "[void] Supabase credentials missing. The archive cannot remember you.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "placeholder-anon-key",
);

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  last_seen_at: string;
}
