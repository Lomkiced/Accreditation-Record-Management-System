"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

const IDLE_TIMEOUT_MS = 60 * 60 * 1000   // 60 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000  // Warn 5 minutes before

/**
 * Monitors user idle time and signs them out after 60 minutes.
 * Shows a warning toast 5 minutes before expiry.
 * Resets on any user interaction event.
 *
 * Add this hook inside a client layout component.
 */
export function useSessionTimeout() {
  const { isAuthenticated, signOut } = useAuth()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningToastId = useRef<string | number | null>(null)

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
  }

  const resetTimers = () => {
    clearTimers()
    if (!isAuthenticated) return

    // Schedule warning toast 5 min before expiry
    warningRef.current = setTimeout(() => {
      warningToastId.current = toast.warning(
        "Your session will expire in 5 minutes. Please save your work.",
        { duration: 30_000, id: "session-warning" }
      )
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)

    // Schedule auto sign-out at full timeout
    timeoutRef.current = setTimeout(async () => {
      toast.dismiss("session-warning")
      toast.error("Session expired. You have been signed out.", { duration: 6000 })
      await signOut()
    }, IDLE_TIMEOUT_MS)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers()
      return
    }

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ]

    const handleActivity = () => resetTimers()

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    resetTimers()

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      clearTimers()
    }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}
