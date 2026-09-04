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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      USER (Browser)                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                           â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                 â”‚
â”‚  â”‚ Server Comp  â”‚â”€â”€â”€â–¶â”‚  Prisma Query     â”‚â”€â”€â–¶ PostgreSQL  â”‚
â”‚  â”‚ (RSC / Page) â”‚    â”‚  (Direct DB read) â”‚                â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚        â”‚ props                                            â”‚
â”‚        â–¼                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                 â”‚
â”‚  â”‚ Client Comp  â”‚â”€â”€â”€â–¶â”‚  Server Action    â”‚â”€â”€â–¶ Prisma â”€â”€â–¶ DBâ”‚
â”‚  â”‚ ("use client")â”‚   â”‚  ("use server")   â”‚                â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚        â”‚                     â”‚                            â”‚
â”‚   React Query          revalidateTag()                   â”‚
â”‚   cache/invalidate     revalidatePath()                  â”‚
â”‚                                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Read Path
1. Server Component renders on the server.
2. Prisma executes query directly against PostgreSQL.
3. HTML is streamed to browser; data passed to Client Components as props/initialData.

### Write Path
1. Client Component calls a Server Action via form submission or direct invocation.
2. Server Action validates auth â†’ validates input (Zod) â†’ executes Prisma mutation.
3. Server Action calls `revalidateTag()` / `revalidatePath()` to bust caches.
4. React Query's `invalidateQueries()` triggers client-side refetch.

## Directory Structure

```
src/
â”œâ”€â”€ actions/           # Server Actions (data mutations + cached queries)
â”‚   â”œâ”€â”€ area.actions.ts
â”‚   â”œâ”€â”€ assignment.actions.ts
â”‚   â”œâ”€â”€ audit.actions.ts
â”‚   â”œâ”€â”€ auth.actions.ts
â”‚   â”œâ”€â”€ criterion.actions.ts
â”‚   â”œâ”€â”€ dashboard.actions.ts
â”‚   â”œâ”€â”€ document.actions.ts
â”‚   â”œâ”€â”€ indicator.actions.ts
â”‚   â”œâ”€â”€ notification.actions.ts
â”‚   â”œâ”€â”€ report.actions.ts
â”‚   â”œâ”€â”€ repository.actions.ts
â”‚   â”œâ”€â”€ search.actions.ts
â”‚   â”œâ”€â”€ submission.actions.ts
â”‚   â”œâ”€â”€ tag.actions.ts
â”‚   â””â”€â”€ user.actions.ts
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ (admin)/       # Admin portal routes
â”‚   â”œâ”€â”€ (auth)/        # Login, forgot-password, etc.
â”‚   â”œâ”€â”€ (dean)/        # Dean portal routes
â”‚   â”œâ”€â”€ (faculty)/     # Faculty portal routes
â”‚   â”œâ”€â”€ api/           # REST API endpoints (auth callbacks, etc.)
â”‚   â”œâ”€â”€ globals.css
â”‚   â””â”€â”€ layout.tsx     # Root layout (Inter font, Providers)
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ areas/         # Area, Criterion, Indicator UI components
â”‚   â”œâ”€â”€ assignments/   # Assignment management
â”‚   â”œâ”€â”€ auth/          # Login forms
â”‚   â”œâ”€â”€ dashboard/     # StatCard, ProgressByArea, HierarchicalDrillDown, etc.
â”‚   â”œâ”€â”€ documents/     # Document upload sheets
â”‚   â”œâ”€â”€ layout/        # Sidebar, Header, global layout components
â”‚   â”œâ”€â”€ notifications/ # Notification bell, list
â”‚   â”œâ”€â”€ profile/       # User profile forms
â”‚   â”œâ”€â”€ reports/       # Compliance report generation
â”‚   â”œâ”€â”€ repository/    # Document repository panels
â”‚   â”œâ”€â”€ shared/        # PageHeader, ConfirmDialog, PageSkeleton, etc.
â”‚   â”œâ”€â”€ submissions/   # Submission upload/review forms
â”‚   â”œâ”€â”€ tags/          # Tag management
â”‚   â”œâ”€â”€ ui/            # shadcn/ui primitives (Button, Input, Dialog, etc.)
â”‚   â”œâ”€â”€ users/         # UserFormPanel, UsersTable
â”‚   â””â”€â”€ Providers.tsx  # React Query + Sonner providers
â”œâ”€â”€ hooks/             # Custom React hooks (useAreas, useUsers, usePrefetch, etc.)
â”œâ”€â”€ lib/               # Prisma client, Supabase client, utilities
â”œâ”€â”€ store/             # Zustand stores (authStore)
â””â”€â”€ types/             # TypeScript interfaces & Zod schemas
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

### Document Management & Uploads
- A document is uploaded and can be mapped to multiple indicators via `DocumentMapping`.
- **Multi-File Batch Upload**: In the Faculty Portal, users can select and batch-upload multiple files concurrently. Each file is transferred to Supabase Storage and created as an active evidence submission under the target indicator without artificial throttling.
- **In-Place Versioning Updates**: When updating an existing document submission, the system modifies the existing `Document` record in-place (`version + 1`), captures a version snapshot in `DocumentVersion`, resets the mapping status to `SUBMITTED`, and notifies reviewers. It strictly avoids creating duplicate `Document` records.

### Canonical Compliance Metric & Dashboard Stats
- **Admin Dashboard Compliance Rate**: Standard institutional accreditation formula: `(approved documents capped per indicator × 100) / total required documents across all indicators`. The StatCard subtitle indicates `{approvedDocCount} of {totalRequiredDocs} required documents approved`, ensuring draft uploads do not distort compliance.
- **Dean Dashboard Progress by Area**: Calculated as `(approved docs × 100) / total required docs` (capped per indicator by requiredDocs, filtering `isArchived: false`). Matches the document counter badge (`approved / totalRequired`) and Faculty Portal area completion.

### Task Assignment Collision Prevention & Modal Architecture
- Assignment queries verify active assignments across all faculty.
- `AssignmentModal` utilizes a 680px responsive layout with explicit **Assignment Scope cards** ("Entire Area" vs "Specific Criteria").
- Multi-line criterion title layout with clean badges for existing assignees and quick actions ("Select all" / "Clear").
- If a Criterion or Area is already assigned to a faculty member, the system blocks duplicate collisions.
- Deletions in `AssignmentPanel` require confirmation via an `AlertDialog` before execution.

### Global Search Engine & Routing Performance Optimization
- `search.actions.ts` provides unified search querying both non-archived documents (by title and filename) and active faculty members (by name, email, department, designation).
- `GlobalSearchDialog` is directly pre-mounted in `TopHeader` (eliminating `next/dynamic` chunk download latency on user click), debounced at 150ms, cached in TanStack Query for 5 minutes (`staleTime: 1000 * 60 * 5`), with smooth background fetch indicators and `Ctrl+K` keyboard shortcut support.
- Fast client routing: `AuthGuard` initializes authentication state synchronously from the Zustand store, preventing full-screen skeleton flash delays during client-side navigation.

### User Management & Fast Indexed Queries
- `user.actions.ts` executes high-speed, direct Prisma queries to list active and archived faculty/admin users.
- Inaccurate auth `lastLogin` fetching via `adminSupabase.auth.admin.listUsers()` has been eliminated, reducing page load times from several seconds to milliseconds with 0 external network round-trips.

### Soft-Delete/Archiving
- **Documents**: Can be archived (`isArchived: true`). All active queries explicitly filter for `{ isArchived: false }`. The hierarchy cache also filters archived documents from mappings.
- **Users**: Can be archived (`isActive: false`). Archiving disables the user's Supabase Auth account (ban) and hides them from active user lists. All their documents, mappings, and submissions are preserved. Archived users can be restored or permanently deleted from the Archived Users view.

### Dashboard Stats
- "Approved Documents" counts non-archived documents with ≥1 APPROVED mapping — not all documents in the system.
- "Pending Reviews" counts only mappings with SUBMITTED or UNDER_REVIEW status whose parent document is NOT archived.

### Dean Repository Architecture (Approved Only)
The Dean's Repository route (`/dean/repository`) is fed by `getApprovedSubmissions()`, querying exclusively `{ status: "APPROVED", document: { isArchived: false } }`. Mappings are grouped by document ID so that each document row in `RepositoryTable` represents verified accreditation evidence, with filtered criteria and indicator associations.

### Institutional PDF Export Architecture
Accreditation report exports use `jspdf` and `jspdf-autotable` (`src/lib/reportPdfGenerator.ts`) to produce client-side rendered, read-only PDF files. The configuration UI provides a simplified, user-friendly "Report Settings" interface. The PDF engine includes:
- Polytechnic College of La Union (PCLU) official letterhead.
- Automated pagination ("Page X of Y").
- Pre-styled table themes matching the ARMS slate/navy palette.
- Date, generation scope, and authorized role verification blocks.

### Audit Log Sanitization Pipeline
Audit log records are processed via `formatAuditDetails` in `audit.actions.ts` before transmission to client components. The pipeline:
1. Translates internal action codes into human-readable sentences.
2. Strips all database CUIDs, UUIDs, and system correlation hashes.
3. Formats metadata (faculty names, document titles, indicator codes, and review remarks) for clear compliance auditing.

### Faculty Archives High-Volume Architecture
The Faculty Archives (`/faculty/archives`) is built for scalability and clarity:
- Streamlined professional UI displaying the total archived documents counter.
- Multi-attribute search filters across title, filename, indicators, and tags.
- Responsive pagination controls item rendering limits.
- Dual presentation modes: Responsive Card Grid and High-Density Table.

