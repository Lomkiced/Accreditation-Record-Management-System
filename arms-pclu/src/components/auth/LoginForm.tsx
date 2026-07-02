"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { LoginSchema, type LoginValues } from "@/lib/validations/auth.schema"

const URL_ERROR_MESSAGES: Record<string, string> = {
  account_inactive: "Your account has been deactivated. Please contact your administrator.",
  account_not_found: "Account not found in the system. Please contact your administrator.",
  auth_callback_failed: "Authentication failed during callback. Please try again.",
  session_expired: "Your session has expired. Please sign in again.",
}

function UrlErrorBanner() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const urlError = errorParam ? (URL_ERROR_MESSAGES[errorParam] ?? null) : null

  if (!urlError) return null

  return (
    <Alert variant="destructive" className="mb-6 bg-red-50/50 border-red-200 text-red-800 animate-in fade-in slide-in-from-top-2">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <AlertDescription className="text-sm font-medium">{urlError}</AlertDescription>
    </Alert>
  )
}

export function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [showPassword, setShowPassword] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })
  const { formState: { errors } } = form

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await signIn(values.email, values.password)
      if (result.error) {
        setFormError(result.error)
        return
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      if (formError !== null) setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (formError) setIsSubmitting(false)
  }, [formError])

  return (
    <div className="w-full">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight lg:text-slate-900 text-white">
          Welcome back
        </h2>
        <p className="text-sm text-slate-400 mt-2 lg:text-slate-500">
          Sign in to your ARMS account to continue
        </p>
      </div>

      <React.Suspense fallback={null}>
        <UrlErrorBanner />
      </React.Suspense>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-200 lg:text-slate-700 font-medium">Password</Label>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-3 h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-12 h-12 bg-white/5 lg:bg-white border-slate-700 lg:border-slate-200 text-white lg:text-slate-900 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-all rounded-xl shadow-sm"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...form.register("password")}
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
          {errors.password && (
            <p className="text-xs text-red-400 lg:text-red-500 font-medium animate-in fade-in">{errors.password.message}</p>
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
              Authenticating...
            </span>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Sign in securely
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
