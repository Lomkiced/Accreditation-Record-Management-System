import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ─── Singleton Supabase Admin Client (service_role) ─────────────────────────
// Re-uses a single client instance per process/serverless invocation.
// This is the ONLY admin client factory — all server-side admin operations
// must import from here (never create ad-hoc service-role clients).

let _adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      "[ARMS] Missing NEXT_PUBLIC_SUPABASE_URL. " +
        "Ensure it is set in Vercel Environment Variables (available at build time)."
    )
  }
  if (!key) {
    throw new Error(
      "[ARMS] Missing SUPABASE_SERVICE_ROLE_KEY. " +
        "Ensure it is set in Vercel Environment Variables (server-side only, NOT prefixed with NEXT_PUBLIC_)."
    )
  }

  _adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _adminClient
}
