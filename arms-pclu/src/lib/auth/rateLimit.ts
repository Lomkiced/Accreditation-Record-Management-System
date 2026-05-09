/**
 * In-memory rate limiter for login attempts.
 *
 * Limits: 5 attempts per 15-minute window.
 * Lockout: 30 minutes after the 5th failed attempt.
 *
 * NOTE: This is a per-process in-memory store.
 * For production with multiple instances, replace with
 * Upstash Redis or a shared cache.
 */

interface AttemptRecord {
  count: number
  lastAttempt: number
  lockedUntil: number | null
}

const loginAttempts = new Map<string, AttemptRecord>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const LOCKOUT_MS = 30 * 60 * 1000 // 30 minutes

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  lockedUntil: number | null
}

/**
 * Check whether a login attempt is allowed for the given identifier
 * (typically the user's email address).
 *
 * Call this BEFORE calling Supabase signInWithPassword.
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now()
  const key = identifier.trim().toLowerCase()
  const record = loginAttempts.get(key)

  // First attempt ever
  if (!record) {
    loginAttempts.set(key, { count: 1, lastAttempt: now, lockedUntil: null })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1, lockedUntil: null }
  }

  // Currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil }
  }

  // Lock has expired — reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.set(key, { count: 1, lastAttempt: now, lockedUntil: null })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1, lockedUntil: null }
  }

  // Window has expired — reset count
  if (now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, lastAttempt: now, lockedUntil: null })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1, lockedUntil: null }
  }

  // Increment within window
  record.count += 1
  record.lastAttempt = now

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
    lockedUntil: null,
  }
}

/**
 * Clear the rate limit record for an identifier.
 * Call this on successful login.
 */
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier.trim().toLowerCase())
}

/**
 * Record a failed attempt without the full check logic.
 * Useful when Supabase itself rejects credentials.
 */
export function recordFailedAttempt(identifier: string): RateLimitResult {
  return checkRateLimit(identifier)
}
