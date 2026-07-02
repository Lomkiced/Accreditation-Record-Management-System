"use server"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth/getUser"
import { revalidatePath } from "next/cache"

type ActionResult<T = undefined> =
  | { success: true; data?: T; error?: never }
  | { success?: never; error: string }

export async function getNotifications() {
  try {
    const user = await requireUser()
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return { success: true as const, data: notifications }
  } catch (error) {
    console.error("[getNotifications]", error)
    return { error: "Failed to load notifications." }
  }
}

export type NotificationItem = NonNullable<
  Extract<Awaited<ReturnType<typeof getNotifications>>, { success: true }>["data"]
>[number]

export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser()
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.userId !== user.id) return { error: "Not found." }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    revalidatePath("/faculty/notifications")
    revalidatePath("/admin/notifications")
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark as read." }
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const user = await requireUser()

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })

    revalidatePath("/faculty/notifications")
    revalidatePath("/admin/notifications")
    return { success: true }
  } catch (error) {
    return { error: "Failed to mark all as read." }
  }
}

