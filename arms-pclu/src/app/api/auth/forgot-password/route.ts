import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetEmail } from "@/lib/mail/mailer"
import { ForgotPasswordSchema } from "@/lib/validations/auth.schema"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = ForgotPasswordSchema.parse(body)

    const adminClient = createAdminClient()

    // Generate the recovery link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/update-password`,
      },
    })

    if (error) {
      console.error("[Auth API] Error generating recovery link:", error)
      return NextResponse.json(
        { error: "Could not generate recovery link." },
        { status: 500 }
      )
    }

    if (!data.properties?.action_link) {
      console.error("[Auth API] Recovery link properties missing.")
      return NextResponse.json(
        { error: "Could not generate recovery link." },
        { status: 500 }
      )
    }

    const resetLink = data.properties.action_link

    // Send via custom Gmail mailer
    await sendPasswordResetEmail(email, resetLink)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      )
    }
    
    // Check if it's a nodemailer error (usually has a response code)
    if (error.code === 'EAUTH' || error.responseCode) {
      console.error("[Auth API] SMTP/Email delivery error:", {
        code: error.code,
        command: error.command,
        message: error.message,
      })
      return NextResponse.json(
        { error: "Failed to send email due to server configuration. Please contact admin." },
        { status: 500 }
      )
    }

    console.error("[Auth API] Forgot password unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    )
  }
}
