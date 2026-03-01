import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[void] Supabase credentials are missing. " +
      "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your " +
      ".env file (or deployment environment). The archive cannot remember you.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  last_seen_at: string;
}
