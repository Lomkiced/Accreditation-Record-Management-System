"use client"

import { useSessionTimeout } from "@/hooks/useSessionTimeout"

/**
 * Thin client wrapper that activates the session timeout monitor.
 * Rendered inside both admin and faculty layouts.
 */
export function SessionManager() {
  useSessionTimeout()
  return null
}
