"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/authStore"

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser } = useAuthStore()
  const initialized = useRef(false)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    try {
      const storedAuth = sessionStorage.getItem("arms-auth")
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth)
        if (parsed?.state?.isLoading === true) {
          sessionStorage.removeItem("arms-auth")
          console.log("[AuthInitializer] cleared corrupted auth state")
        }
      }
    } catch {
      sessionStorage.removeItem("arms-auth")
    }

    if (initialized.current) return
    initialized.current = true

    const initialize = async () => {
      const timeout = setTimeout(() => {
        console.warn("[AuthInitializer] timeout — forcing clearUser")
        clearUser()
      }, 8000)

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          clearUser()
          clearTimeout(timeout)
          return
        }

        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        })

        if (res.ok) {
          const dbUser = await res.json()
          setUser(dbUser)
        } else {
          clearUser()
        }
      } catch (err) {
        console.error("[AuthInitializer] error:", err)
        clearUser()
      } finally {
        clearTimeout(timeout)
      }
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        clearUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [clearUser, setUser])

  return <>{children}</>
}
