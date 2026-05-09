import { z } from "zod"

export const userProfileSchema = z.object({
  name: z.string().min(1),
  department: z.string().min(1),
  designation: z.string().min(1),
  phone: z.string().optional(),
})

export type UserProfileInput = z.infer<typeof userProfileSchema>

