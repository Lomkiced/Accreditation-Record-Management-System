export type LogbookEntry = {
  id: string
  title: string
  type: "INCOMING" | "OUTGOING"
  status: "PENDING" | "ACKNOWLEDGED" | "REJECTED"
}

