/**
 * Environment variable validation.
 * Throws at startup if any required variable is missing,
 * ensuring we fail fast rather than silently at runtime.
 */
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `[ARMS] Missing required environment variable: ${key}\n` +
        `Please add it to your .env file.`
    )
  }
  return value
}

export const env = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  DIRECT_URL: requireEnv("DIRECT_URL"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const
