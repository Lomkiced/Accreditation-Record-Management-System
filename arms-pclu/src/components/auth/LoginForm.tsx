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

// ─── Isolated sub-component — keeps useSearchParams inside its own Suspense ───
// Next.js requires the component that calls useSearchParams() to be wrapped in
// <Suspense>. Isolating it here prevents a static-render bailout on the page.
function UrlErrorBanner() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const urlError = errorParam ? (URL_ERROR_MESSAGES[errorParam] ?? null) : null

  if (!urlError) return null

  return (
    <Alert
      variant="destructive"
      className="mb-5 bg-red-50 border-red-200 text-red-800"
    >
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <AlertDescription className="text-sm">{urlError}</AlertDescription>
    </Alert>
  )
}

// ─── Main login form ──────────────────────────────────────────────────────────
export function LoginForm() {
  const { signIn } = useAuth()
  const router = useRouter()

  const [showPassword, setShowPassword] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  // Local submitting state — intentionally NOT coupled to the global auth store
  // isLoading. The global isLoading is for guarding protected routes, not the
  // login button, which caused the infinite-loading regression.
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
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

      // signIn succeeded — navigate. Router.push is a soft nav; the actual
      // role-based destination is determined inside signIn() and written to
      // the auth store, so we just push to the appropriate dashboard.
      // useAuth.signIn handles window.location.href, but we keep isSubmitting
      // true intentionally during the navigation (spinner disappears with page).
    } catch {
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      // Only reset loading on error paths. On success the page navigates away
      // and this component unmounts — no state update needed.
      if (formError !== null) {
        setIsSubmitting(false)
      }
    }
  }

  // After signIn errors, reset loading state
  React.useEffect(() => {
    if (formError) {
      setIsSubmitting(false)
    }
  }, [formError])

  return (
    <div className="w-full max-w-sm mx-auto px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
        <p className="text-sm text-slate-500 mt-1">Sign in to your ARMS account</p>
      </div>

      {/* URL-based error — isolated in its own Suspense-safe sub-component */}
      <React.Suspense fallback={null}>
        <UrlErrorBanner />
      </React.Suspense>

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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

        {/* Form error */}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
