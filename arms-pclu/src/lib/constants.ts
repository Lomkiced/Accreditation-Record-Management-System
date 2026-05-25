export const APP_NAME = "ARMS"
export const COLLEGE_NAME = "Polytechnic College of La Union"

export const PACUCOA_AREAS = [
  "Area 1: Purposes and Objectives",
  "Area 2: Faculty",
  "Area 3: Instruction",
  "Area 4: Library",
  "Area 5: Laboratories",
  "Area 6: Physical Plant and Facilities",
  "Area 7: Student Personnel Services",
  "Area 8: Administration",
]

export const SUBMISSION_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "SUBMITTED", label: "Submitted", color: "bg-blue-100 text-blue-800" },
  { value: "UNDER_REVIEW", label: "Under Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "APPROVED", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "RETURNED", label: "Returned", color: "bg-red-100 text-red-800" },
]

export const LOGBOOK_TYPES = [
  { value: "INCOMING", label: "Incoming", color: "bg-blue-100 text-blue-800" },
  { value: "OUTGOING", label: "Outgoing", color: "bg-green-100 text-green-800" },
]

export const LOGBOOK_STATUSES = [
  { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "ACKNOWLEDGED", label: "Acknowledged", color: "bg-green-100 text-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-100 text-red-800" },
]

export const ACCEPTED_FILE_TYPES = [".pdf", ".docx", ".xlsx", ".jpg", ".png"]
export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
