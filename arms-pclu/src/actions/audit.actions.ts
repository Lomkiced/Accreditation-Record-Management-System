"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/getUser"

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
}

export async function getAuditLogs(): Promise<ActionResult<AuditLogWithUser[]>> {
  try {
    await requireAdmin()

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 1000 // Limit to last 1000 logs for performance
    })

    const formattedLogs: AuditLogWithUser[] = logs.map(log => {
      // Parse details to a readable string if possible
      let detailsString = "-"
      if (log.details) {
        try {
          if (typeof log.details === "string") {
            const parsed = JSON.parse(log.details)
            detailsString = Object.entries(parsed)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          } else if (typeof log.details === "object") {
             detailsString = Object.entries(log.details as object)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          }
        } catch {
           detailsString = String(log.details)
        }
      }

      return {
        id: log.id,
        timestamp: new Date(log.createdAt).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }),
        user: log.user.name,
        action: log.action.replace(/_/g, " "),
        module: log.module.replace(/_/g, " "),
        details: detailsString,
      }
    })

    return { success: true, data: formattedLogs }
  } catch (error) {
    console.error("[getAuditLogs]", error)
    return { error: "Failed to load audit logs." }
  }
}
