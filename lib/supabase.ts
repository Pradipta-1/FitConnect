import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Server-side admin client (bypasses RLS)
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      })
    : null;

// Public client for browser / client-side usage
export const supabaseClient: SupabaseClient | null =
  supabaseUrl && (supabaseAnonKey || supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
        auth: { persistSession: true }
      })
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));
