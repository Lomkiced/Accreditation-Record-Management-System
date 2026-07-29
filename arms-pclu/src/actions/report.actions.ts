"use server"

import { prisma } from "@/lib/prisma"

export async function getComplianceReportData(areaId?: string, startDate?: Date, endDate?: Date) {
  try {
    const areaFilter = areaId && areaId !== "all" ? { id: areaId } : {}
    
    // We want to fetch all Areas -> Criteria -> Indicators, and count approved vs total mappings
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
                    ...(startDate && endDate ? {
                      createdAt: {
                        gte: startDate,
                        lte: endDate
                      }
                    } : {})
                  }
                }
              }
            }
          }
        }
      }
    })

    const reportData: any[] = []

    for (const area of areas) {
      for (const criterion of area.criteria) {
        for (const indicator of criterion.indicators) {
          const approvedCount = indicator.mappings.length
          const requiredCount = parseInt(indicator.requiredDocs || "0") || 1 // default to 1 if not parseable

          reportData.push({
            Area: area.name,
            "Sub-Area": criterion.name,
            Indicator: indicator.name,
            "Required Documents": indicator.requiredDocs || "1",
            "Approved Count": approvedCount,
            "Compliance Rate": `${Math.min(100, Math.round((approvedCount / requiredCount) * 100))}%`,
            Status: approvedCount >= requiredCount ? "Compliant" : "Needs Attention"
          })
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error generating compliance report:", error)
    return { success: false, error: "Failed to generate compliance report" }
  }
}

export async function getFacultyContributionReportData(startDate?: Date, endDate?: Date) {
  try {
    // Only fetch users who have submitted documents
    // A user has submitted documents if they have mappings with status != DRAFT
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {}

    const users = await prisma.user.findMany({
      where: {
        role: "FACULTY",
        mappings: {
          some: {
            status: { not: "DRAFT" },
            ...dateFilter
          }
        }
      },
      include: {
        assignments: true,
        mappings: {
          where: dateFilter
        }
      },
      orderBy: { name: "asc" }
    })

    const reportData = users.map(user => {
      const submitted = user.mappings.filter(m => m.status === "SUBMITTED").length
      const underReview = user.mappings.filter(m => m.status === "UNDER_REVIEW").length
      const approved = user.mappings.filter(m => m.status === "APPROVED").length
      const returned = user.mappings.filter(m => m.status === "RETURNED").length
      const totalSubmitted = submitted + underReview + approved + returned

      return {
        "Faculty Name": user.name,
        "Department": user.department,
        "Designation": user.designation,
        "Assigned Areas": user.assignments.length,
        "Total Documents Submitted": totalSubmitted,
        "Pending Review": submitted + underReview,
        "Approved Documents": approved,
        "Returned/Needs Revision": returned
      }
    })

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error generating faculty report:", error)
    return { success: false, error: "Failed to generate faculty report" }
  }
}

export async function getApprovedDocumentsReportData(areaId?: string, startDate?: Date, endDate?: Date) {
  try {
    const areaFilter = areaId && areaId !== "all" ? { areaId } : {}
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {}

    const mappings = await prisma.documentMapping.findMany({
      where: {
        status: "APPROVED",
        ...dateFilter,
        indicator: {
          criterion: areaFilter
        }
      },
      include: {
        document: true,
        user: true,
        indicator: {
          include: {
            criterion: {
              include: {
                area: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const reportData = mappings.map(mapping => ({
      "Document Title": mapping.document.title,
      "File Name": mapping.document.fileName || "N/A",
      "Uploaded By": mapping.user.name,
      "Area": mapping.indicator.criterion.area.name,
      "Sub-Area": mapping.indicator.criterion.name,
      "Indicator": mapping.indicator.name,
      "Approved Date": new Date(mapping.updatedAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }),
      "File Link": mapping.document.fileUrl || "N/A"
    }))

    return { success: true, data: reportData }
  } catch (error) {
    console.error("Error generating approved documents report:", error)
    return { success: false, error: "Failed to generate approved documents report" }
  }
}
