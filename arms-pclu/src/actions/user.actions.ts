"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth/getUser"

export type UserWithCounts = {
  id: string
  name: string
  email: string
  department: string
  designation: string
  status: "ACTIVE" | "INACTIVE"
  assignedAreas: number
  lastLogin: string | null
}

export async function getUsers(): Promise<UserWithCounts[]> {
  await requireAdmin()

  const users = await prisma.user.findMany({
    where: { role: "FACULTY" },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { name: "asc" },
  })
  
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    designation: user.designation,
    status: user.isActive ? "ACTIVE" : "INACTIVE",
    assignedAreas: user._count.assignments,
    lastLogin: null, // Tracked in Supabase Auth, not DB
  }))
}
