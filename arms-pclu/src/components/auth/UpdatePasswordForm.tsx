"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { ResetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth.schema"
import Link from "next/link"

export function UpdatePasswordForm() {
  const router = useRouter()
  const { updatePassword } = useAuth()
  const supabase = React.useMemo(() => createClient(), [])

  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isVerifyingSession, setIsVerifyingSession] = React.useState(true)
  const [sessionValid, setSessionValid] = React.useState(true)

  // Verify URL parameters (hash / code) and active session on mount
  React.useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search)
          const hashStr = window.location.hash.replace(/^#/, "")
          const hashParams = new URLSearchParams(hashStr)

          // 1. Detect if Supabase passed an error redirect (e.g. otp_expired)
          const errorDesc =
            searchParams.get("error_description") ||
            hashParams.get("error_description") ||
            searchParams.get("error") ||
            hashParams.get("error")

          if (errorDesc) {
            if (isMounted) {
              setFormError(decodeURIComponent(errorDesc.replace(/\+/g, " ")))
              setSessionValid(false)
              setIsVerifyingSession(false)
            }
            return
          }

          // 2. If a PKCE code is directly present in the URL, exchange it for session
          const code = searchParams.get("code")
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
            if (exchangeError) {
              console.error("[UpdatePasswordForm] Code exchange error:", exchangeError)
              if (isMounted) {
                setFormError("The reset link has expired or is invalid. Please request a new one.")
                setSessionValid(false)
                setIsVerifyingSession(false)
              }
              return
            }
          }
        }

        // 3. Check for existing active session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Listen to onAuthStateChange in case token in hash is still initializing
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
            if (isMounted) {
              if (currentSession) {
                setSessionValid(true)
                setFormError(null)
              } else {
                setSessionValid(false)
                setFormError("No active password reset session found. Please request a new password reset link.")
              }
              setIsVerifyingSession(false)
            }
          })

          // Grace period fallback
          const timer = setTimeout(() => {
            if (isMounted && isVerifyingSession) {
              supabase.auth.getSession().then(({ data: { session: s2 } }) => {
                if (isMounted) {
                  if (!s2) {
                    setSessionValid(false)
                    setFormError("No active password reset session found. Please request a new password reset link.")
                  } else {
                    setSessionValid(true)
                    setFormError(null)
                  }
                  setIsVerifyingSession(false)
                }
              })
            }
          }, 1200)

          return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
          }
        } else {
          if (isMounted) {
            setSessionValid(true)
            setIsVerifyingSession(false)
          }
        }
      } catch (err) {
        console.error("[UpdatePasswordForm] Verification exception:", err)
        if (isMounted) {
          setIsVerifyingSession(false)
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })
  const { formState: { errors } } = form

  const onSubmit = async (values: ResetPasswordValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await updatePassword(values.newPassword)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setIsSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-slate-900 text-white">
          Password Updated
        </h2>
        <p className="text-slate-400 lg:text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your password has been successfully reset. Redirecting you to sign in...
        </p>
        <div className="pt-6 border-t border-white/10 lg:border-slate-100">
          <Link href="/login" className="text-sm font-medium text-blue-500 hover:text-blue-600 lg:text-blue-600 lg:hover:text-blue-700 transition-colors">
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-slate-900 text-white">
          Set New Password
        </h2>
        <p className="text-sm text-slate-400 mt-2 lg:text-slate-500">
          Please enter your new password below.
        </p>
      </div>

      {isVerifyingSession ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400 lg:text-slate-500">Verifying reset authorization...</p>
        </div>
      ) : !sessionValid ? (
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-red-50/10 lg:bg-red-50 border-red-500/30 lg:border-red-200 text-red-400 lg:text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm font-medium">
              {formError || "This password reset link is invalid or has expired."}
            </AlertDescription>
          </Alert>

          <Button
            asChild
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md text-sm font-semibold"
          >
            <Link href="/forgot-password">
              Request New Password Reset Link
            </Link>
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-xs font-medium text-slate-400 hover:text-white lg:text-slate-500 lg:hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-slate-200 lg:text-slate-700 font-medium">New Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password (min. 8 characters)"
                className="pl-10 pr-12 h-12 bg-white/5 lg:bg-white border-slate-700 lg:border-slate-200 text-white lg:text-slate-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all rounded-xl shadow-sm"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...form.register("newPassword")}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 lg:hover:text-slate-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400 lg:text-red-500 font-medium animate-in fade-in">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200 lg:text-slate-700 font-medium">Confirm Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className="pl-10 pr-12 h-12 bg-white/5 lg:bg-white border-slate-700 lg:border-slate-200 text-white lg:text-slate-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all rounded-xl shadow-sm"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 lg:hover:text-slate-600 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 lg:text-red-500 font-medium animate-in fade-in">{errors.confirmPassword.message}</p>
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
                Updating...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                Update password
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
