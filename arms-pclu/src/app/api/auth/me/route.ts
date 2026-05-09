import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[/api/auth/me] auth error:", authError.message)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        authId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!dbUser) {
      console.error("[/api/auth/me] no prisma user for authId:", user.id)
      return NextResponse.json(
        { error: "User profile not found. Contact administrator." },
        { status: 404 }
      )
    }

    if (!dbUser.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    return NextResponse.json(dbUser, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[/api/auth/me] unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
