"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 60s by default — reduces background refetches
            staleTime: 60 * 1000,
            // Keep unused data in cache for 5 minutes — instant back-navigation
            gcTime: 5 * 60 * 1000,
            // Retry once with 1s delay (exponential backoff for 2nd attempt)
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
            // Don't re-fetch when window regains focus (avoids surprise re-fetches)
            refetchOnWindowFocus: false,
            // Don't re-fetch when network reconnects unless data is stale
            refetchOnReconnect: "always",
          },
          mutations: {
            // Retry failed mutations once (network blips)
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
