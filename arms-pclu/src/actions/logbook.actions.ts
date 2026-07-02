"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin, requireUser } from "@/lib/auth/getUser"
import { z } from "zod"
import { logbookEntrySchema } from "@/lib/validations/logbook.schema"
import { revalidatePath } from "next/cache"

export type LogbookEntryWithUser = {
  id: string
  type: "INCOMING" | "OUTGOING"
  title: string
  date: Date
  fromTo: string
  purpose: string
  refNo: string | null
  fileUrl: string | null
  fileName: string | null
  status: "PENDING" | "ACKNOWLEDGED" | "REJECTED"
  adminRemarks: string | null
  acknowledgedAt: Date | null
  createdAt: Date
  user: {
    id: string
    name: string
  }
}

export async function getLogbookEntries(): Promise<LogbookEntryWithUser[]> {
  const currentUser = await requireUser()
  
  const where = currentUser.role === "ADMIN" ? {} : { userId: currentUser.id }
  
  return prisma.logbookEntry.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  })
}

export async function createLogbookEntry(data: z.infer<typeof logbookEntrySchema>) {
  try {
    const user = await requireUser()
    const validated = logbookEntrySchema.parse(data)
    
    const entry = await prisma.logbookEntry.create({
      data: {
        userId: user.id,
        ...validated,
      }
    })
    
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_LOGBOOK_ENTRY",
        module: "LOGBOOK",
        targetId: entry.id,
        details: { title: entry.title, type: entry.type }
      }
    })
    
    revalidatePath("/admin/logbook")
    return { success: true, data: entry }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Validation failed." }
    }
    return { error: "Failed to create logbook entry." }
  }
}

export async function updateLogbookStatus(id: string, status: "ACKNOWLEDGED" | "REJECTED", remarks?: string) {
  try {
    const admin = await requireAdmin()
    
    await prisma.logbookEntry.update({
      where: { id },
      data: {
        status,
        adminRemarks: remarks ?? null,
        acknowledgedAt: status === "ACKNOWLEDGED" ? new Date() : null,
      }
    })
    
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: status === "ACKNOWLEDGED" ? "ACKNOWLEDGE_LOGBOOK" : "REJECT_LOGBOOK",
        module: "LOGBOOK",
        targetId: id,
        details: { status }
      }
    })
    
    revalidatePath("/admin/logbook")
    return { success: true }
  } catch (error) {
    return { error: "Failed to update logbook status." }
  }
}
