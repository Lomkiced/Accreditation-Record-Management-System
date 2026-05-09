"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { LoginSchema, type LoginValues } from "@/lib/validations/auth.schema"

// Maps URL ?error= params to user-friendly messages
const URL_ERROR_MESSAGES: Record<string, string> = {
  account_inactive:
    "Your account has been deactivated. Please contact your administrator.",
  account_not_found:
    "Account not found in the system. Please contact your administrator.",
  auth_callback_failed:
    "Authentication failed during callback. Please try again.",
  session_expired: "Your session has expired. Please sign in again.",
}

export function LoginForm() {
  const { signIn, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const [showPassword, setShowPassword] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Resolve URL error param to message
  const urlError = errorParam ? (URL_ERROR_MESSAGES[errorParam] ?? null) : null

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const {
    formState: { isSubmitting, errors },
  } = form

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    const result = await signIn(values.email, values.password)
    if (result.error) {
      setFormError(result.error)
    }
    // On success: useAuth handles redirect automatically
  }

  const isPending = isSubmitting || isLoading

  return (
    <div className="w-full max-w-sm mx-auto px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
        <p className="text-sm text-slate-500 mt-1">Sign in to your ARMS account</p>
      </div>

      {/* URL-based error (e.g. inactive account redirect) */}
      {urlError && (
        <Alert
          variant="destructive"
          className="mb-5 bg-red-50 border-red-200 text-red-800"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-sm">{urlError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@pclu.edu.ph"
              className="pl-9"
              autoComplete="email"
              disabled={isPending}
              {...form.register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-9 pr-9"
              autoComplete="current-password"
              disabled={isPending}
              {...form.register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Form error (wrong credentials / rate-limit / network) */}
        {formError && (
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-200 text-red-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm">{formError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          Having trouble? Contact your system administrator.
        </p>
      </div>
    </div>
  )
}
