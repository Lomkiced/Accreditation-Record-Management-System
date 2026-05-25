"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/authStore"
import { 
  checkRateLimit, 
  clearRateLimit 
} from '@/lib/auth/rateLimit'

export function useAuth() {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const {
    user,
    isLoading,
    isAuthenticated,
    setUser,
    setLoading,
    clearUser,
  } = useAuthStore()

  const initializingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (initializingRef.current) return
    initializingRef.current = true

    const initializeAuth = async () => {
      console.log("[useAuth] initializeAuth called")
      const timeout = setTimeout(() => {
        if (mountedRef.current) {
          console.warn("[useAuth] timeout reached, clearing auth")
          clearUser()
        }
      }, 8000)

      try {
        console.log("[useAuth] calling supabase.auth.getUser()")
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser()

        console.log("[useAuth] getUser result:", {
          userId: authUser?.id,
          error: error?.message,
        })

        if (error || !authUser) {
          clearTimeout(timeout)
          if (mountedRef.current) clearUser()
          return
        }

        const controller = new AbortController()
        const fetchTimeout = setTimeout(() => controller.abort(), 5000)

        try {
          console.log("[useAuth] fetching /api/auth/me")
          const response = await fetch("/api/auth/me", {
            signal: controller.signal,
            cache: "no-store",
          })

          console.log("[useAuth] /api/auth/me status:", response.status)

          clearTimeout(fetchTimeout)

          if (!mountedRef.current) return

          if (response.ok) {
            const dbUser = await response.json()
            console.log("[useAuth] dbUser received:", {
              id: dbUser.id,
              role: dbUser.role,
              isActive: dbUser.isActive,
            })
            setUser(dbUser)
          } else {
            const errorBody = await response.text()
            console.error("[useAuth] /api/auth/me failed:", errorBody)
            await supabase.auth.signOut()
            clearUser()
          }
        } catch (fetchError) {
          clearTimeout(fetchTimeout)
          console.error("[useAuth] fetch error:", fetchError)
          if (mountedRef.current) clearUser()
        }
      } catch (error) {
        console.error("[useAuth] getUser error:", error)
        if (mountedRef.current) clearUser()
      } finally {
        clearTimeout(timeout)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[useAuth] auth state change:", event)

      if (event === "SIGNED_OUT") {
        if (mountedRef.current) clearUser()
        return
      }

      if (event === "SIGNED_IN" && session?.user) {
        try {
          const response = await fetch("/api/auth/me", {
            cache: "no-store",
          })
          if (response.ok && mountedRef.current) {
            const dbUser = await response.json()
            setUser(dbUser)
          } else if (mountedRef.current) {
            clearUser()
          }
        } catch {
          if (mountedRef.current) clearUser()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [clearUser, setUser, supabase.auth])

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true)

      // Check rate limit before attempting login
      const rateLimitCheck = checkRateLimit(
        email.trim().toLowerCase()
      )

      if (!rateLimitCheck.allowed) {
        setLoading(false)
        const minutesLeft = rateLimitCheck.lockedUntil
          ? Math.ceil(
              (rateLimitCheck.lockedUntil - Date.now()) / 60000
            )
          : 30
        return {
          error: `Too many failed login attempts. ` +
                 `Please try again in ${minutesLeft} minute(s).`,
        }
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) {
          setLoading(false)
          // Note: don't clear rate limit on failure
          // It will auto-clear after the window expires
          if (error.message.includes("Invalid login credentials")) {
            const remaining = rateLimitCheck.remainingAttempts - 1
            return {
              error: remaining > 0
                ? `Invalid email or password. ` +
                  `${remaining} attempt(s) remaining.`
                : `Invalid email or password. ` +
                  `Account will be locked after next attempt.`,
            }
          }
          return { error: error.message }
        }

        if (!data.user) {
          setLoading(false)
          return { error: "Login failed. Please try again." }
        }

        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        })

        if (!response.ok) {
          await supabase.auth.signOut()
          setLoading(false)
          return { error: "Account not found. Contact your administrator." }
        }

        const dbUser = await response.json()

        if (!dbUser.isActive) {
          await supabase.auth.signOut()
          setLoading(false)
          return {
            error: "Your account is deactivated. Contact your administrator.",
          }
        }

        setUser(dbUser)

        // Clear rate limit on successful login
        clearRateLimit(email.trim().toLowerCase())

        const destination =
          dbUser.role === "ADMIN" ? "/admin/dashboard" : "/faculty/dashboard"

        window.location.href = destination

        return { error: null }
      } catch (error) {
        setLoading(false)
        console.error("[useAuth] signIn error:", error)
        return { error: "Unexpected error. Please try again." }
      }
    },
    [setLoading, setUser, supabase]
  )

  const signOut = useCallback(async () => {
    try {
      clearUser()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("[useAuth] signOut error:", error)
      router.push("/login")
    }
  }, [clearUser, router, supabase])

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    isAdmin: user?.role === "ADMIN",
    isFaculty: user?.role === "FACULTY",
  }
}
