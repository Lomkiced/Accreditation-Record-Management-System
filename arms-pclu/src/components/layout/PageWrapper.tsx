"use client"

import * as React from "react"

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="main-content">
      <div className="page-content">{children}</div>
    </main>
  )
}
