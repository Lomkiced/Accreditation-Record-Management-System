# Architecture Document

## System Overview
The Accreditation Record Management System (ARMS) is a modern, full-stack web application built to streamline the accreditation process for educational institutions. It utilizes a robust, server-first architecture to ensure high performance, security, and developer productivity.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (SSR)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (Client-side global state), React Query (Server state caching)
- **Forms & Validation:** React Hook Form + Zod

## Design Methodology
- **Server Components (RSC):** Default to Server Components to reduce JavaScript bundle size and improve load times.
- **Client Components:** Used selectively for interactivity (hooks, state, event listeners). Denoted by the `"use client"` directive.
- **Server Actions:** All data mutations (Create, Update, Delete) are handled via Next.js Server Actions, eliminating the need for a separate API layer for internal operations.
- **Component-Driven Design:** Reusable UI components based on Radix UI primitives for accessibility.

## Data Flow
1. **Read Operations:** Server Components fetch data directly from the database using Prisma.
2. **Write Operations:** Client Components submit data to Server Actions.
3. **Validation:** Zod schemas validate data on both the client (React Hook Form) and server (Server Actions).
4. **Database:** Prisma ORM executes the validated operations against the PostgreSQL database.
5. **Revalidation:** Server Actions trigger `revalidatePath` or `revalidateTag` to update the UI instantly.

## Directory Structure
```
src/
├── actions/        # Next.js Server Actions (data mutations)
├── app/            # Next.js App Router pages and layouts
├── components/     # Reusable UI components (shadcn, layout, etc.)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions, Prisma client, Supabase client
├── store/          # Zustand global state stores
└── types/          # TypeScript type definitions and Zod schemas
```

## Performance Strategy
- **TanStack Query Caching:** Global defaults (`staleTime: 3min`, `gcTime: 10min`, `refetchOnMount: false`, `refetchOnWindowFocus: false`) prevent redundant network requests. Individual hooks may override with domain-appropriate stale times (e.g., 10min for taxonomy data, 1min for notifications).
- **Sidebar Hover Prefetching:** A centralized `usePrefetch` hook maps sidebar route paths to their TanStack Query keys/functions. `onMouseEnter` on sidebar links calls `router.prefetch()` (Next.js route warming) + `queryClient.prefetchQuery()` (data warming) for near-instant navigation.
- **Route-Level Skeletons:** Every route has a `loading.tsx` that renders page-structure-matching skeletons via `PageSkeleton` components, providing instant visual feedback during navigation.
- **Server-Side Data Cache:** Dashboard aggregation queries use `unstable_cache()` with tag-based revalidation to serve cached results across users without re-querying Postgres on every request.
- **Bundle Optimization:** Heavy libraries (recharts, jspdf, xlsx) are loaded via `next/dynamic` with `{ ssr: false }`. `next.config.mjs` enables `optimizePackageImports` for barrel-file packages (lucide-react, date-fns, framer-motion).
- **Server/Client Split:** Data-heavy pages use async Server Components for initial data fetching (via Prisma) and pass results as `initialData` to focused Client Components that manage interactivity and reactivity.

## Key Implementations
- **Document Management:** A central document uploaded once can be mapped to multiple indicators using a pivot table (`DocumentMapping`), tracking separate approval statuses per indicator.
- **Role-Based Access Control (RBAC):** Authorization checks are performed at the layout level and within every Server Action to ensure users (ADMIN, DEAN, FACULTY) can only access appropriate resources.
- **Global Upload Evidence Picker:** Faculty can upload evidence from the My Areas listing page via a cascading picker dialog (Area → Criterion → Indicator) that opens the `SubmissionUploadForm` sheet, eliminating the need to navigate into a specific area first.
- **Canonical Compliance Metric:** All compliance calculations use **indicator-level compliance** — `(indicators with ≥1 APPROVED mapping) / total indicators × 100%`. This is enforced in `getDashboardStats`, `getComplianceData`, `getComplianceDataWithCounts`, `computeAreaCompliance` (HierarchicalDrillDown), and `CriterionList`. Raw mapping-count ratios must NOT be used.
- **Progress by Area (Dean Dashboard):** A dedicated `ProgressByArea` component uses `getComplianceDataWithCounts()` to show per-area compliance as color-coded horizontal progress bars with (a) an **evidence badge** showing `provided/total` indicator counts (e.g., `3/12`), (b) a progress bar with percentage, and (c) a status badge (Complete / In Progress / Needs Attention). "Provided" = indicators with ≥1 APPROVED, SUBMITTED, or UNDER_REVIEW mapping.
- **Dashboard Total Documents (Dean/Admin):** The "Approved Documents" stat card counts only non-archived documents that have at least one APPROVED mapping — not all documents in the system.
- **Soft-Delete/Archiving:** Documents can be archived by users (setting `isArchived: true`). All active queries for submissions and repository views must explicitly filter for `{ isArchived: false }` to ensure archived documents are hidden from active lists and only appear in the dedicated Archives view. The hierarchy query (`_fetchAreasHierarchyCached`) also filters archived documents from mappings.
