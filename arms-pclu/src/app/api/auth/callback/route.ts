import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Handles Supabase Auth PKCE code exchange.
 * Required for SSR auth flow with @supabase/ssr.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/login"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed`
  )
}
