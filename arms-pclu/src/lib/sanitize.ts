/**
 * Input sanitization utilities.
 * Use on all user-supplied text before storing to the database.
 */

/**
 * Sanitizes a general string input:
 * - Trims whitespace
 * - Removes basic HTML injection chars (< >)
 * - Caps at 1000 characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .substring(0, 1000)
}

/**
 * Sanitizes an email address:
 * - Trims whitespace
 * - Lowercases
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitizes a name field:
 * - Trims, removes HTML chars, caps at 100 chars
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[<>]/g, "")
    .substring(0, 100)
}
