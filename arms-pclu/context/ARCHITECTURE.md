# Architecture Document

## System Overview

The **Accreditation Record Management System (ARMS)** is a production-grade, full-stack web application built for **Polytechnic College of La Union (PCLU)** to digitize, track, and streamline the PACUCOA accreditation process. It follows a **server-first, component-driven architecture** using the Next.js App Router, enabling fast initial loads, minimal client-side JS, and type-safe data flow from database to UI.

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Framework      | Next.js 14 (App Router)                                 |
| Language       | TypeScript (strict mode)                                |
| Database ORM   | Prisma 6                                                |
| Database       | PostgreSQL (hosted on Supabase)                         |
| Authentication | Supabase Auth (SSR cookie-based sessions)               |
| Styling        | Tailwind CSS 3 + shadcn/ui (Radix primitives)           |
| Server State   | TanStack React Query 5 (caching + invalidation)         |
| Client State   | Zustand 5 (auth store, session timeout)                 |
| Forms          | React Hook Form 7 + Zod 3 (dual client/server validate) |
| Animations     | Framer Motion 12 + tailwindcss-animate                  |
| Charts         | Recharts 2                                              |
| Exports        | jsPDF + jspdf-autotable, xlsx                           |

## Design Methodology

### Server Components First (RSC)

- **Default:** All page components are async React Server Components (RSC).
- **Client Components:** Used only when interactivity is required (`"use client"` directive). Kept minimal by passing server-fetched data as `initialData` props.
- **Server Actions (`"use server"`):** All data mutations flow through Server Actions in `src/actions/`. No separate REST API layer for internal operations.

### Component-Driven Design

- Reusable components built on Radix UI primitives for built-in accessibility (keyboard nav, screen reader, focus management).
- UI consistency enforced through shared component library in `src/components/shared/` and `src/components/ui/`.

### Role-Based Access Control (RBAC)

Three roles: `ADMIN`, `DEAN`, `FACULTY`.

- **Route-level:** `(admin)`, `(dean)`, `(faculty)` route groups with layout-level auth guards.
- **Middleware:** Edge middleware (`src/middleware.ts`) validates Supabase sessions and redirects unauthenticated users.
- **Server Action-level:** Every Server Action calls `requireAdmin()`, `requireAdminOrDean()`, or `requireUser()` before executing business logic.

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      USER (Browser)                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐    ┌──────────────────┐                 │
│  │ Server Comp  │───▶│  Prisma Query     │──▶ PostgreSQL  │
│  │ (RSC / Page) │    │  (Direct DB read) │                │
│  └─────────────┘    └──────────────────┘                 │
│        │ props                                            │
│        ▼                                                  │
│  ┌─────────────┐    ┌──────────────────┐                 │
│  │ Client Comp  │───▶│  Server Action    │──▶ Prisma ──▶ DB│
│  │ ("use client")│   │  ("use server")   │                │
│  └─────────────┘    └──────────────────┘                 │
│        │                     │                            │
│   React Query          revalidateTag()                   │
│   cache/invalidate     revalidatePath()                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Read Path
1. Server Component renders on the server.
2. Prisma executes query directly against PostgreSQL.
3. HTML is streamed to browser; data passed to Client Components as props/initialData.

### Write Path
1. Client Component calls a Server Action via form submission or direct invocation.
2. Server Action validates auth → validates input (Zod) → executes Prisma mutation.
3. Server Action calls `revalidateTag()` / `revalidatePath()` to bust caches.
4. React Query's `invalidateQueries()` triggers client-side refetch.

## Directory Structure

```
src/
├── actions/           # Server Actions (data mutations + cached queries)
│   ├── area.actions.ts
│   ├── assignment.actions.ts
│   ├── audit.actions.ts
│   ├── auth.actions.ts
│   ├── criterion.actions.ts
│   ├── dashboard.actions.ts
│   ├── document.actions.ts
│   ├── indicator.actions.ts
│   ├── notification.actions.ts
│   ├── report.actions.ts
│   ├── repository.actions.ts
│   ├── search.actions.ts
│   ├── submission.actions.ts
│   ├── tag.actions.ts
│   └── user.actions.ts
├── app/
│   ├── (admin)/       # Admin portal routes
│   ├── (auth)/        # Login, forgot-password, etc.
│   ├── (dean)/        # Dean portal routes
│   ├── (faculty)/     # Faculty portal routes
│   ├── api/           # REST API endpoints (auth callbacks, etc.)
│   ├── globals.css
│   └── layout.tsx     # Root layout (Inter font, Providers)
├── components/
│   ├── areas/         # Area, Criterion, Indicator UI components
│   ├── assignments/   # Assignment management
│   ├── auth/          # Login forms
│   ├── dashboard/     # StatCard, ProgressByArea, HierarchicalDrillDown, etc.
│   ├── documents/     # Document upload sheets
│   ├── layout/        # Sidebar, Header, global layout components
│   ├── notifications/ # Notification bell, list
│   ├── profile/       # User profile forms
│   ├── reports/       # Compliance report generation
│   ├── repository/    # Document repository panels
│   ├── shared/        # PageHeader, ConfirmDialog, PageSkeleton, etc.
│   ├── submissions/   # Submission upload/review forms
│   ├── tags/          # Tag management
│   ├── ui/            # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   ├── users/         # UserFormPanel, UsersTable
│   └── Providers.tsx  # React Query + Sonner providers
├── hooks/             # Custom React hooks (useAreas, useUsers, usePrefetch, etc.)
├── lib/               # Prisma client, Supabase client, utilities
├── store/             # Zustand stores (authStore)
└── types/             # TypeScript interfaces & Zod schemas
```

## Performance Strategy

| Technique                    | Details                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React Query Caching**      | Global defaults: `staleTime: 3min`, `gcTime: 10min`, `refetchOnMount: false`, `refetchOnWindowFocus: false`. Per-hook overrides where needed.    |
| **Sidebar Hover Prefetch**   | `usePrefetch` hook calls `router.prefetch()` + `queryClient.prefetchQuery()` on sidebar link hover for near-instant navigation.                  |
| **Server-Side Data Cache**   | Dashboard aggregations use `unstable_cache()` with tag-based revalidation (60s TTL). Shared across users.                                        |
| **Route Skeletons**          | Every route has `loading.tsx` rendering structure-matching skeletons via `PageSkeleton` components.                                               |
| **Bundle Optimization**      | Heavy packages (recharts, jspdf, xlsx) loaded via `next/dynamic({ ssr: false })`. `optimizePackageImports` for barrel-file libs.                  |
| **Server/Client Split**      | Async Server Components fetch data, pass `initialData` to focused Client Components. Minimizes client JS bundle.                                  |
| **Global Progress Bar**      | `nextjs-toploader` provides instant visual feedback during route transitions, improving perceived performance.                                    |

## Key Implementations

### Document Management
A document is uploaded once and can be mapped to multiple indicators via the `DocumentMapping` pivot table. Each mapping tracks its own approval status independently — a single document can be APPROVED for one indicator and UNDER_REVIEW for another.

### Canonical Compliance Metric
All compliance calculations across all portals use a unified formula:
```
compliance% = (indicators with ≥1 APPROVED mapping) / totalIndicators × 100
```
This is enforced in `getDashboardStats`, `getComplianceData`, `getComplianceDataWithCounts`, `computeAreaCompliance` (HierarchicalDrillDown), `AreaCard`, and `CriterionList`.

> **Faculty Portal Exception:** The Faculty "My Areas" view factors in `requiredDocs` per indicator to compute a granular per-requirement percentage. This means a single indicator can have multiple required documents, and completion is measured against how many of those are APPROVED. All admin/dean views use the indicator-level metric for consistency.

### Progress by Area (Dean Dashboard)
`ProgressByArea` component displays per-area compliance with:
- **Indicator badge**: `provided/total` (e.g., `3/12`) — "provided" = indicators with ≥1 APPROVED, SUBMITTED, or UNDER_REVIEW mapping.
- **Progress bar**: animated horizontal bar with percentage.
- **Status badge**: Complete / In Progress / Needs Attention.

### Hierarchical Evidence Drill-Down (Admin Dashboard)
`HierarchicalDrillDown` shows a 3-level accordion (Area → Criterion → Indicator → Documents) with compliance rings, document counts, and per-mapping status badges.

### Soft-Delete/Archiving
Documents can be archived (`isArchived: true`). All active queries explicitly filter for `{ isArchived: false }`. The hierarchy cache also filters archived documents from mappings.

### Dashboard Stats
"Approved Documents" counts non-archived documents with ≥1 APPROVED mapping — not all documents in the system.

### Global Upload Evidence Picker
Faculty can upload evidence from the My Areas listing via a cascading Area → Criterion → Indicator picker dialog, eliminating deep navigation.
