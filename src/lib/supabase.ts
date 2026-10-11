import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isValidServiceUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username && !url.password && !url.search && !url.hash
    );
  } catch {
    return false;
  }
}

export const supabaseAvailable = isValidServiceUrl(supabaseUrl) && !!supabaseAnonKey;

if (!supabaseAvailable) {
  console.warn(
    "[void] Supabase configuration is missing or invalid. Authentication is disabled.",
  );
}

export const supabase = createClient(
  supabaseAvailable ? supabaseUrl! : "http://localhost:54321",
  supabaseAvailable ? supabaseAnonKey! : "placeholder-anon-key",
  // A disabled client must not restore old credentials or start refresh requests.
  { auth: {
    persistSession: supabaseAvailable,
    autoRefreshToken: supabaseAvailable,
    detectSessionInUrl: supabaseAvailable,
  } },
);

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  last_seen_at: string;
}
