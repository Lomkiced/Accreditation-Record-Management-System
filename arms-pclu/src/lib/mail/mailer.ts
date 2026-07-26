import nodemailer from "nodemailer"

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn(
    "[ARMS:Mailer] Missing GMAIL_USER or GMAIL_APP_PASSWORD. Email sending will fail if attempted."
  )
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const mailOptions = {
    from: `"ARMS Support" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - ARMS",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          Hello,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          We received a request to reset your password for your ARMS account. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">
          If the button doesn't work, you can copy and paste the following link into your browser:
        </p>
        <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">
          <a href="${resetLink}" style="color: #3b82f6;">${resetLink}</a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 40px; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
          © ${new Date().getFullYear()} Polytechnic College of La Union. All rights reserved.
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("[ARMS:Mailer] Password reset email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[ARMS:Mailer] Error sending email:", error)
    throw error
  }
}
