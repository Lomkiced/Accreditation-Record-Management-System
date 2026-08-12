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
            // Data stays fresh for 3 minutes by default — reduces network round-trips
            // on rapid page navigation. Individual queries can override this.
            staleTime: 3 * 60 * 1000,
            // Keep unused data in cache for 10 minutes — instant back-navigation
            gcTime: 10 * 60 * 1000,
            // ── Performance: Don't refetch on mount if data is still fresh ──
            // This is the biggest single perf fix. Without it, every page visit
            // triggers a network request even when cached data is within staleTime.
            refetchOnMount: false,
            // Retry once with a short delay
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
            // Don't re-fetch when window regains focus (avoids surprise re-fetches)
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect — staleTime already handles freshness
            refetchOnReconnect: false,
          },
          mutations: {
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
