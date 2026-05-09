export type Submission = {
  id: string
  title: string
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "RETURNED"
}

