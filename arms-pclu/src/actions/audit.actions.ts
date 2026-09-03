"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDeanOrThrow } from "@/lib/auth/getUser"

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

export type AuditLogWithUser = {
  id: string
  timestamp: string
  user: string
  action: string
  module: string
  details: string
  rawDate: string
}

// ─── AUDIT DETAILS HUMANIZER & SANITIZER ───────────────────────────────────────
// Eliminates internal CUIDs, UUIDs, correlation hashes, and technical keys,
// transforming audit details into clear, readable, natural compliance summaries.

function isHashOrId(val: unknown): boolean {
  if (typeof val !== "string") return false
  // Check for CUID pattern (e.g. cm5...) or UUID pattern
  if (/^cm[a-z0-9]{20,}$/i.test(val)) return true
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) return true
  return false
}

function camelToTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function formatAuditLogDetails(action: string, rawDetails: any): string {
  if (!rawDetails) return "-"

  let detailsObj: Record<string, any> = {}

  if (typeof rawDetails === "string") {
    try {
      detailsObj = JSON.parse(rawDetails)
    } catch {
      // If it's a simple string, check if it's a hash
      if (isHashOrId(rawDetails)) return "-"
      return rawDetails
    }
  } else if (typeof rawDetails === "object" && rawDetails !== null) {
    detailsObj = rawDetails
  } else {
    return String(rawDetails)
  }

  const act = action.toUpperCase()

  // 1. SUBMISSION & DOCUMENT WORKFLOWS
  if (act === "SUBMIT_DOCUMENT" || act === "RESUBMIT_DOCUMENT") {
    const doc = detailsObj.documentTitle || detailsObj.title
    const ind = detailsObj.indicatorName
    if (doc && ind) {
      return `Submitted "${doc}" for Indicator: ${ind}`
    } else if (doc) {
      return `Submitted document "${doc}" for review`
    }
  }

  if (act === "SAVE_DRAFT") {
    const doc = detailsObj.documentTitle || detailsObj.title
    const ind = detailsObj.indicatorName
    if (doc && ind) {
      return `Draft saved: "${doc}" for Indicator: ${ind}`
    } else if (doc) {
      return `Draft saved for document "${doc}"`
    }
  }

  if (act === "REVIEW_STARTED") {
    const doc = detailsObj.documentTitle || detailsObj.title
    const ind = detailsObj.indicatorName
    return `Review commenced for "${doc || "Document"}"${ind ? ` (${ind})` : ""}`
  }

  if (act === "REVIEW_MAPPING") {
    const status = detailsObj.status || "REVIEWED"
    const doc = detailsObj.documentTitle || detailsObj.title
    const ind = detailsObj.indicatorName
    const remarks = detailsObj.remarks
    let base = `${status}: "${doc || "Document"}"`
    if (ind) base += ` (${ind})`
    if (remarks && remarks.trim()) base += ` — Remarks: "${remarks.trim()}"`
    return base
  }

  if (act === "UPLOAD_DOCUMENT") {
    const title = detailsObj.title || detailsObj.documentTitle
    const fileName = detailsObj.fileName
    return `Uploaded document "${title || "New Document"}"${fileName ? ` (${fileName})` : ""}`
  }

  if (act === "UPLOAD_NEW_VERSION") {
    const title = detailsObj.title || detailsObj.documentTitle
    const ver = detailsObj.newVersion || detailsObj.version
    return `Uploaded Version ${ver || "2"} for "${title || "Document"}"`
  }

  if (act === "ARCHIVE_DOCUMENT") {
    const title = detailsObj.title || detailsObj.documentTitle
    return `Archived document "${title || "Document"}"`
  }

  if (act === "RESTORE_DOCUMENT") {
    const title = detailsObj.title || detailsObj.documentTitle
    return `Restored document "${title || "Document"}" to active vault`
  }

  if (act === "PERMANENT_DELETE_DOCUMENT") {
    const title = detailsObj.title || detailsObj.documentTitle
    return `Permanently deleted document "${title || "Document"}"`
  }

  // 2. ASSIGNMENTS
  if (act === "CREATE_ASSIGNMENT") {
    const faculty = detailsObj.facultyName
    const area = detailsObj.areaName
    const crit = detailsObj.criterionName
    if (faculty && area) {
      return `Assigned ${faculty} to ${area}${crit ? ` (${crit})` : ""}`
    }
  }

  if (act === "DELETE_ASSIGNMENT") {
    const faculty = detailsObj.facultyName
    const area = detailsObj.areaName
    if (faculty && area) {
      return `Removed assignment of ${faculty} from ${area}`
    }
  }

  // 3. USER MANAGEMENT & AUTH
  if (act === "CREATE_FACULTY_ACCOUNT") {
    const name = detailsObj.name || detailsObj.targetName
    const dept = detailsObj.department
    const email = detailsObj.email || detailsObj.targetEmail
    return `Created faculty account for ${name || "User"}${dept ? ` (${dept})` : ""}${email ? ` [${email}]` : ""}`
  }

  if (act === "ARCHIVE_USER_ACCOUNT") {
    const name = detailsObj.targetName || detailsObj.name
    const role = detailsObj.targetRole || detailsObj.role
    return `Archived user account for ${name || "User"}${role ? ` (${role})` : ""}`
  }

  if (act === "RESTORE_USER_ACCOUNT") {
    const name = detailsObj.targetName || detailsObj.name
    return `Restored user account for ${name || "User"}`
  }

  if (act === "DELETE_USER_ACCOUNT") {
    const name = detailsObj.targetName || detailsObj.name
    return `Permanently deleted user account for ${name || "User"}`
  }

  if (act === "ACTIVATE_ACCOUNT") {
    const name = detailsObj.targetName || detailsObj.name
    return `Activated account for ${name || "User"}`
  }

  if (act === "DEACTIVATE_ACCOUNT") {
    const name = detailsObj.targetName || detailsObj.name
    return `Deactivated account for ${name || "User"}`
  }

  if (act === "RESET_PASSWORD") {
    const name = detailsObj.targetName || detailsObj.name
    const email = detailsObj.targetEmail || detailsObj.email
    return `Password reset for ${name || "User"}${email ? ` (${email})` : ""}`
  }

  if (act === "CHANGE_PASSWORD") {
    return "User updated their account password"
  }

  if (act === "UPDATE_PROFILE") {
    if (Array.isArray(detailsObj.updatedFields)) {
      return `Updated profile fields: ${detailsObj.updatedFields.join(", ")}`
    }
    return "User updated profile details"
  }

  if (act === "UPDATE_FACULTY_PROFILE") {
    const name = detailsObj.name || detailsObj.targetName
    const dept = detailsObj.department
    return `Updated faculty profile for ${name || "User"}${dept ? ` (${dept})` : ""}`
  }

  // 4. TAXONOMY (Areas, Criteria, Indicators, Tags)
  if (act.includes("AREA")) {
    const name = detailsObj.name || detailsObj.areaName
    const op = act.includes("CREATE") ? "Created" : act.includes("UPDATE") ? "Updated" : act.includes("DELETE") ? "Deleted" : "Modified"
    return `${op} Area "${name || "Area"}"`
  }

  if (act.includes("CRITERION")) {
    const name = detailsObj.name || detailsObj.criterionName
    const op = act.includes("CREATE") ? "Created" : act.includes("UPDATE") ? "Updated" : act.includes("DELETE") ? "Deleted" : "Modified"
    return `${op} Criterion "${name || "Criterion"}"`
  }

  if (act.includes("INDICATOR")) {
    const name = detailsObj.name || detailsObj.indicatorName
    const op = act.includes("CREATE") ? "Created" : act.includes("UPDATE") ? "Updated" : act.includes("DELETE") ? "Deleted" : "Modified"
    return `${op} Indicator "${name || "Indicator"}"`
  }

  if (act.includes("TAG")) {
    const name = detailsObj.name || detailsObj.tagName
    const op = act.includes("CREATE") ? "Created" : act.includes("UPDATE") ? "Updated" : act.includes("DELETE") ? "Deleted" : "Modified"
    return `${op} Tag "${name || "Tag"}"`
  }

  // ─── GENERAL FALLBACK SANITIZER ──────────────────────────────────────
  // Filter out any IDs, correlationId, cuid, uuid, or meaningless tokens
  const cleanEntries = Object.entries(detailsObj)
    .filter(([key, val]) => {
      if (typeof key !== "string") return false
      const lowerKey = key.toLowerCase()
      // Filter out technical ID keys
      if (lowerKey === "id" || lowerKey.endsWith("id") || lowerKey.endsWith("_id")) return false
      if (lowerKey.includes("correlation") || lowerKey === "cid" || lowerKey.includes("token") || lowerKey.includes("password")) return false
      if (lowerKey === "timestamp") return false
      if (val === null || val === undefined || val === "") return false
      if (isHashOrId(val)) return false
      return true
    })
    .map(([key, val]) => {
      const label = camelToTitleCase(key)
      let displayVal = String(val)
      if (Array.isArray(val)) {
        displayVal = val.join(", ")
      } else if (typeof val === "object") {
        displayVal = JSON.stringify(val)
      }
      return `${label}: ${displayVal}`
    })

  if (cleanEntries.length > 0) {
    return cleanEntries.join(" • ")
  }

  // Default clean human-readable action representation
  return action.replace(/_/g, " ").toLowerCase().replace(/^./, s => s.toUpperCase())
}

// ─── GET AUDIT LOGS ───────────────────────────────────────────────────────────
export async function getAuditLogs(): Promise<ActionResult<AuditLogWithUser[]>> {
  try {
    await requireAdminOrDeanOrThrow()

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit to last 1000 logs for performance
    })

    const formattedLogs: AuditLogWithUser[] = logs.map((log) => {
      const detailsString = formatAuditLogDetails(log.action, log.details)

      return {
        id: log.id,
        timestamp: new Date(log.createdAt).toLocaleString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric",
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit", 
          hour12: false,
        }),
        user: log.user.name,
        action: log.action.replace(/_/g, " "),
        module: log.module.replace(/_/g, " "),
        details: detailsString,
        rawDate: log.createdAt.toISOString(),
      }
    })

    return { success: true, data: formattedLogs }
  } catch (error) {
    console.error("[getAuditLogs] Error:", error)
    return { error: "Failed to load audit logs." }
  }
}
