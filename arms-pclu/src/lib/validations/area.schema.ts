import { z } from "zod"

export const areaSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

export type AreaInput = z.infer<typeof areaSchema>

