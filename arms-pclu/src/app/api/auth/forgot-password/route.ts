import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetEmail } from "@/lib/mail/mailer"
import { ForgotPasswordSchema } from "@/lib/validations/auth.schema"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = ForgotPasswordSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Verify user existence in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address. Please verify your email and try again." },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact your administrator." },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    // Redirect directly to the client page so the browser can parse the #access_token hash fragment.
    const redirectTo = `${origin}/update-password`

    // 2. Generate the recovery link via Supabase Auth Admin API
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo,
      },
    })

    if (error || !data?.properties?.action_link) {
      console.error("[Auth API] Error generating recovery link:", error)
      return NextResponse.json(
        { error: error?.message || "Could not generate recovery link. Please contact your administrator." },
        { status: 500 }
      )
    }

    const resetLink = data.properties.action_link
    let emailSent = false

    // 3. Send via custom Gmail mailer if credentials are provided
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await sendPasswordResetEmail(user.email, resetLink)
        emailSent = true
      } catch (mailError: any) {
        console.error("[Auth API] SMTP delivery error:", mailError?.message || mailError)
      }
    } else {
      console.warn("[Auth API] GMAIL_USER or GMAIL_APP_PASSWORD is not configured in environment.")
    }

    // 4. Fallback: If Nodemailer didn't dispatch, attempt Supabase Auth's native reset email
    if (!emailSent) {
      try {
        const { error: sbError } = await adminClient.auth.resetPasswordForEmail(user.email, {
          redirectTo,
        })
        if (!sbError) {
          emailSent = true
          console.log("[Auth API] Dispatched reset password email via Supabase Auth service.")
        } else {
          console.warn("[Auth API] Supabase resetPasswordForEmail also skipped/failed:", sbError.message)
        }
      } catch (sbErr) {
        console.warn("[Auth API] Supabase resetPasswordForEmail exception:", sbErr)
      }
    }

    // Always log the password reset link to server console for dev / debugging / local demo
    console.log(
      `\n=================================================================\n` +
      `[AUTH API] PASSWORD RESET LINK FOR: ${user.email}\n` +
      `ACTION LINK: ${resetLink}\n` +
      `EMAIL SENT VIA PROVIDER: ${emailSent}\n` +
      `=================================================================\n`
    )

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REQUEST_PASSWORD_RESET",
        module: "AUTH",
        targetId: user.id,
        details: {
          email: user.email,
          emailSent,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      emailSent,
      // Provide direct link in non-production environments to allow instant testing
      directResetUrl: process.env.NODE_ENV !== "production" ? resetLink : undefined,
    })
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      )
    }

    console.error("[Auth API] Forgot password unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    )
  }
}
