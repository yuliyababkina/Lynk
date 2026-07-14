import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are present. When false, db.ts
 * transparently falls back to the static arrays in src/data.ts so the
 * prototype keeps working exactly as before — nothing breaks while the
 * Supabase project is being set up.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// A harmless placeholder URL/key so createClient doesn't throw when the env
// vars are missing. The client is simply never used in that case.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
