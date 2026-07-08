import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ─── Supabase Admin Client Factory (service_role) ───────────────────────────
// Creates a fresh admin client per invocation to avoid stale singleton issues
// on Vercel serverless cold starts. The Supabase JS client is lightweight —
// no persistent connections are maintained, so per-call creation is safe.
//
// This is the ONLY admin client factory — all server-side admin operations
// must import from here (never create ad-hoc service-role clients).

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    console.error(
      "[ARMS:createAdminClient] NEXT_PUBLIC_SUPABASE_URL is missing.",
      {
        available_env_keys: Object.keys(process.env)
          .filter((k) => k.includes("SUPABASE") || k.includes("NEXT_PUBLIC"))
          .join(", "),
      }
    )
    throw new Error(
      "[ARMS] Missing NEXT_PUBLIC_SUPABASE_URL. " +
        "Ensure it is set in Vercel Environment Variables (available at build & runtime)."
    )
  }

  if (!key) {
    console.error(
      "[ARMS:createAdminClient] SUPABASE_SERVICE_ROLE_KEY is missing.",
      {
        url_present: !!url,
        anon_key_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    )
    throw new Error(
      "[ARMS] Missing SUPABASE_SERVICE_ROLE_KEY. " +
        "Ensure it is set in Vercel Environment Variables (server-side only, NOT prefixed with NEXT_PUBLIC_)."
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
