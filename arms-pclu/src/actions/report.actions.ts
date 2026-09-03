"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminOrDean } from "@/lib/auth/getUser"

/** Parses the `requiredDocs` field into a numeric count (minimum 1). */
function parseRequiredDocsCount(requiredDocs: string | null | undefined): number {
  if (!requiredDocs) return 1
  if (!isNaN(Number(requiredDocs))) return Math.max(1, Number(requiredDocs))
  return requiredDocs.split(",").filter((s: string) => s.trim().length > 0).length || 1
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

// ─── 1. COMPLIANCE SUMMARY REPORT ─────────────────────────────────────────────
export async function getComplianceReportData(areaId?: string, startDate?: Date, endDate?: Date) {
  try {
    await requireAdminOrDean()

    const areaFilter = areaId && areaId !== "all" ? { id: areaId } : {}
    const approvalDateFilter = startDate && endDate ? {
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    } : {}
    
    // Fetch all Areas -> Criteria -> Indicators
    // Filter out archived documents from mappings!
    const areas = await prisma.area.findMany({
      where: areaFilter,
      orderBy: { order: "asc" },
      include: {
        criteria: {
          orderBy: { order: "asc" },
          include: {
            indicators: {
              orderBy: { order: "asc" },
              include: {
                mappings: {
                  where: {
                    status: "APPROVED",
                    document: { isArchived: false },
                    ...approvalDateFilter,
                  },
                  select: {
                    id: true,
                    documentId: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const reportData: any[] = []

    for (const area of areas) {
      for (const criterion of area.criteria) {
        for (const indicator of criterion.indicators) {
          // Count unique approved documents (in case of duplicate mappings)
          const approvedCount = new Set(indicator.mappings.map(m => m.documentId)).size
          const requiredCount = parseRequiredDocsCount(indicator.requiredDocs)
          const complianceRateNumber = Math.min(100, Math.round((approvedCount / requiredCount) * 100))

          reportData.push({
            Area: area.name,
            "Sub-Area": criterion.name,
            Indicator: indicator.name,
            "Required Evidence": indicator.requiredDocs?.trim() || "1 document",
            "Required Count": requiredCount,
            "Approved Count": approvedCount,
            "Compliance Rate": `${complianceRateNumber}%`,
            Status: approvedCount >= requiredCount ? "Compliant" : approvedCount > 0 ? "Partially Compliant" : "Needs Attention",
          })
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error("[getComplianceReportData] Error:", error)
    return { success: false, error: "Failed to generate compliance report." }
  }
}

// ─── 2. FACULTY CONTRIBUTION REPORT ──────────────────────────────────────────
export async function getFacultyContributionReportData(startDate?: Date, endDate?: Date) {
  try {
    await requireAdminOrDean()

    const submissionDateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    } : {}

    // Fetch ALL active faculty so Dean can see who has contributed and who has NOT
    const users = await prisma.user.findMany({
      where: {
        role: "FACULTY",
        isActive: true,
      },
      include: {
        assignments: {
          include: {
            area: {
              select: { id: true, name: true },
            },
          },
        },
        mappings: {
          where: {
            document: { isArchived: false },
            ...submissionDateFilter,
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    const reportData = users.map((user) => {
      const submitted = user.mappings.filter((m) => m.status === "SUBMITTED").length
      const underReview = user.mappings.filter((m) => m.status === "UNDER_REVIEW").length
      const approved = user.mappings.filter((m) => m.status === "APPROVED").length
      const returned = user.mappings.filter((m) => m.status === "RETURNED").length
      const totalSubmitted = submitted + underReview + approved + returned

      // Unique assigned areas
      const assignedAreaNames = Array.from(
        new Set(user.assignments.map((a) => a.area.name))
      )
      const assignedAreaCount = assignedAreaNames.length

      return {
        "Faculty Name": user.name,
        "Department": user.department || "General Faculty",
        "Designation": user.designation || "Instructor",
        "Assigned Areas Count": assignedAreaCount,
        "Assigned Areas": assignedAreaNames.length > 0 ? assignedAreaNames.join("; ") : "None Assigned",
        "Total Documents Submitted": totalSubmitted,
        "Pending Review": submitted + underReview,
        "Approved Documents": approved,
        "Returned / Revision": returned,
        "Contribution Status": totalSubmitted === 0 ? "No Submissions" : approved > 0 ? "Active Contributor" : "Submissions Pending",
      }
    })

    return { success: true, data: reportData }
  } catch (error) {
    console.error("[getFacultyContributionReportData] Error:", error)
    return { success: false, error: "Failed to generate faculty contribution report." }
  }
}

// ─── 3. APPROVED DOCUMENTS LIST ──────────────────────────────────────────────
export async function getApprovedDocumentsReportData(areaId?: string, startDate?: Date, endDate?: Date) {
  try {
    await requireAdminOrDean()

    const areaFilter = areaId && areaId !== "all" ? { areaId } : {}
    // Filter on approval timestamp (updatedAt) when document was APPROVED
    const approvalDateFilter = startDate && endDate ? {
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    } : {}

    const mappings = await prisma.documentMapping.findMany({
      where: {
        status: "APPROVED",
        document: { isArchived: false },
        ...approvalDateFilter,
        indicator: {
          criterion: areaFilter,
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            fileSize: true,
            fileUrl: true,
            version: true,
          },
        },
        user: {
          select: {
            name: true,
            department: true,
          },
        },
        indicator: {
          include: {
            criterion: {
              include: {
                area: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    const reportData = mappings.map((mapping) => ({
      "Document Title": mapping.document.title,
      "File Name": mapping.document.fileName || "N/A",
      "Version": `v${mapping.document.version}`,
      "Uploaded By": `${mapping.user.name}${mapping.user.department ? ` (${mapping.user.department})` : ""}`,
      "Area": mapping.indicator.criterion.area.name,
      "Sub-Area": mapping.indicator.criterion.name,
      "Indicator": mapping.indicator.name,
      "File Size": formatBytes(mapping.document.fileSize),
      "Approved Date": new Date(mapping.updatedAt).toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      "File Link": mapping.document.fileUrl || "N/A",
    }))

    return { success: true, data: reportData }
  } catch (error) {
    console.error("[getApprovedDocumentsReportData] Error:", error)
    return { success: false, error: "Failed to generate approved documents report." }
  }
}
