import { z } from "zod"

export const logbookEntrySchema = z.object({
  type: z.enum(["INCOMING", "OUTGOING"]),
  title: z.string().min(1),
  date: z.coerce.date(),
  fromTo: z.string().min(1),
  purpose: z.string().min(1),
  refNo: z.string().optional(),
})

export type LogbookEntryInput = z.infer<typeof logbookEntrySchema>

