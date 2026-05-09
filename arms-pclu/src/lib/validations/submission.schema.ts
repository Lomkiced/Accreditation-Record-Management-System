import { z } from "zod"

export const submissionSchema = z.object({
  indicatorId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
})

export type SubmissionInput = z.infer<typeof submissionSchema>

