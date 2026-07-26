"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { ForgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth.schema"

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  })
  const { formState: { errors } } = form

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await requestPasswordReset(values.email)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setIsSuccess(true)
        setCooldown(60) // Start 60-second cooldown
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-slate-900 text-white">
          Check your email
        </h2>
        <p className="text-slate-400 lg:text-slate-500 max-w-sm mx-auto leading-relaxed">
          We&apos;ve sent a password reset link to <span className="font-semibold text-slate-300 lg:text-slate-700">{form.getValues().email}</span>.
        </p>
        
        <div className="flex flex-col items-center gap-3 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            disabled={cooldown > 0 || isSubmitting}
            onClick={() => form.handleSubmit(onSubmit)()}
            className="w-full max-w-[200px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                Sending...
              </span>
            ) : cooldown > 0 ? (
              `Resend email in ${cooldown}s`
            ) : (
              "Resend email"
            )}
          </Button>
        </div>

        <div className="pt-6 border-t border-white/10 lg:border-slate-100">
          <Link href="/login" className="text-sm font-medium text-blue-500 hover:text-blue-600 lg:text-blue-600 lg:hover:text-blue-700 flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-slate-900 text-white">
          Reset Password
        </h2>
        <p className="text-sm text-slate-400 mt-2 lg:text-slate-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200 lg:text-slate-700 font-medium">Email address</Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3 h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="you@pclu.edu.ph"
              className="pl-10 h-12 bg-white/5 lg:bg-white border-slate-700 lg:border-slate-200 text-white lg:text-slate-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all rounded-xl shadow-sm"
              autoComplete="email"
              disabled={isSubmitting}
              {...form.register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 lg:text-red-500 font-medium animate-in fade-in">{errors.email.message}</p>
          )}
        </div>

        {formError && (
          <Alert variant="destructive" className="bg-red-50/10 lg:bg-red-50 border-red-500/30 lg:border-red-200 text-red-400 lg:text-red-800 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm font-medium">{formError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-200 mt-4 text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Send reset link
            </>
          )}
        </Button>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white lg:text-slate-500 lg:hover:text-slate-800 flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
