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
- **Inline Submission Return Remarks**: When a document is returned during evaluation, reviewer remarks are directly coupled to the corresponding submission item (`Reviewer Return Remarks: [remarks]`), eliminating ambiguous, detached bottom banners.

### Canonical Compliance Metric & Dashboard Stats
- **Admin Dashboard Compliance Rate**: Standard institutional accreditation formula: `(approved documents capped per indicator × 100) / total required documents across all indicators in assigned scope`. The StatCard subtitle indicates `{approvedDocCount} of {totalRequiredDocs} required documents approved`, ensuring draft uploads do not distort compliance. All approved mapping queries filter `{ document: { isArchived: false, isArchivedFromRepo: false } }` to exclude both user-archived and repository-archived documents.
- **Dean Dashboard Progress by Area**: Calculated as `(approved docs × 100) / total required docs` (capped per indicator by requiredDocs, filtering `{ isArchived: false, isArchivedFromRepo: false }`). Matches the document counter badge (`approved / totalRequired`) and Faculty Portal area completion.
- **Compliance Chart (Admin/Dean)**: Per-area compliance uses the same canonical document-level formula `(approvedDocCount * 100) / totalRequiredDocs`, scoped to areas/criteria with active assigned faculty. Unassigned areas compute 0% rather than being excluded.

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
- **Portal-Tailored Views**: `UsersTable` provides configurable column visibility via `hideDepartment` and `hideStatus` props.
  - **Dean's Portal**: Streamlined exclusively for faculty account management. Suppresses redundant department filters, department table column, and secondary active/inactive status dropdowns (using the dedicated top Active/Archived tabbed view). Displays User (Avatar, Name, Email), Role, Designation, and Actions.
  - **Admin's Portal**: Full cross-role administrative view with department and role filters, displaying all system attributes.

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

### Multi-Tier Repository, Archives & Evidence Retention Architecture
Under `/faculty/submissions`, `/dean/repository`, and `/admin/repository`, multi-tier retention guarantees institutional compliance while giving users flexible personal workflow control:
- **Dean View-Only Review & Inspection Architecture**:
  - Across all portals (`/dean/submissions`, `/dean/repository`, and `/dean/areas/[id]`), the Dean is strictly restricted to view-only mode for faculty documents.
  - Deans can view files, download attachments, review version history, approve, and return with remarks, but have zero edit capabilities (cannot alter titles, descriptions, files, or tags).
- **Faculty Personal Submissions & Sidebar Archive Routing**:
  - In "My Submissions", every document across all states (**Submitted**, **Returned**, **Untagged**, **Drafts**, and **Approved**) features a complete 3-dots action suite: **View Document**, **Revise Document** (for returned items), **Submit for Review** (for draft/returned items), **Edit Tags / Resume** (or **Tag Indicators** for untagged items), and **Archive Document**.
  - Any delete or archive action executed from "My Submissions" soft-archives the document (`isArchived: true`), directly routing it to the **Archive Documents** page (`/faculty/archives`) in the main Sidebar. Documents can be restored back to active submissions at any time from `/faculty/archives`.
- **Dean Repository Deletion Isolation (`isArchivedFromRepo`)**:
  - When the Dean deletes an approved document from `/dean/repository`, it triggers `archiveDocumentFromRepository(documentId)`, setting `isArchivedFromRepo: true`.
  - The document is removed from the active Dean & Admin repositories (`where: { document: { isArchivedFromRepo: false } }`), moving to the Dean "Repository Archives" tab.
  - The document submitted by the faculty member is strictly preserved in the Faculty Portal: it remains intact in "My Submissions" and continues to appear in the submitting faculty member's approved evidence portfolio.
- **Faculty Deletion of Approved Evidence (`isDeletedByFaculty`)**:
  - When an approved document is deleted by faculty from the Approved Repository, the record is flagged with `isDeletedByFaculty: true`. The document is permanently removed from the faculty member's view, but remains safely preserved in the institutional repository for accreditation compliance.
- **Radix AlertDialog Confirmation**: All delete, archive, and permanent removal actions are strictly protected by accessible `AlertDialog` confirmation modals rather than native browser alerts.

### Indicator Confidentiality & Granular Evidence Selection
Indicators support granular confidentiality control:
- **Item-Level Confidentiality**: In addition to marking an entire indicator as confidential (`isConfidential: true`), users can select specific required evidence items as confidential (`confidentialDocs` JSON array) using checkboxes and a "Select All as Confidential" toggle.
- **Access Gating Pipeline**:
  - Dean and Admin have full access to view, download, and review all documents.
  - Document owners have full access to their own uploaded files regardless of confidentiality status.
  - Peer faculty members can view metadata (title, area, criterion, indicator, date) to track compliance, but file viewing and downloading are locked with a `🔒 Confidential` badge.
- **Search Integration**:
  - When a faculty member clicks another faculty user in Global Search, `FacultyEvidenceModal` loads their approved evidence with peer confidentiality gating applied.
  - Dean clicking a faculty user navigates to `/dean/assignments?facultyId=...` and automatically pre-selects the faculty in the assignment panel.
  - Admin clicking a faculty user navigates to `/admin/users?search=...` with clean search pre-fill.

### Cross-Faculty Tagging Selector Architecture
- In the Document Upload & Tagging Sheet (`DocumentUploadSheet`), the selector queries `getIndicatorsForSelector()`, which returns all active areas and criteria containing indicators regardless of assignment restrictions.
- Assigned faculty members are aggregated and returned per area and per criterion (`assignedFaculty: string[]`), rendered as informative badges in the tagging tree. This enables faculty to collaborate and contribute evidence to areas assigned across departments.

### Area Compliance Metric Coherence & Cache Invalidation
- **Archived Document Filtering**: `criterion.actions.ts` (`getCriteriaByArea`) and `area.actions.ts` (`AREA_LEAN_SELECT`) filter mapping queries with `{ where: { document: { isArchived: false, isArchivedFromRepo: false } } }`. Dashboard compliance functions (`_fetchDashboardStats`, `_fetchComplianceData`, `_fetchComplianceDataWithCounts`) enforce the same dual-filter on all approved mapping counts. Indicators without active non-archived approved evidence strictly evaluate to 0%, eliminating phantom completion rates on empty or cleared areas.
- **Coordinated Invalidation**: Document mutations (`deleteDocument`, `archiveDocument`, `restoreDocument`, `permanentlyDeleteDocument`, `archiveDocumentFromRepository`, `restoreDocumentToRepository`) trigger:
  1. Server path revalidations via `revalidatePath` across `/admin/areas`, `/dean/areas`, `/faculty/my-areas`, `/admin/dashboard`, `/dean/dashboard`, and repositories.
  2. TanStack Query cache invalidations across `submissionKeys`, `archiveKeys`, `areaKeys.all`, `dashboardKeys.all`, and `repository`.

### Audit Log Clearing & Retention Architecture
- The Admin and Dean audit logs pages include a protected "Clear All Logs" action.
- Executed via `clearAuditLogs()`, requiring `requireAdminOrDeanOrThrow()`.
- Deletes historical entries via `prisma.auditLog.deleteMany({})` and inserts a single tracking record with action `CLEAR_AUDIT_LOGS`, detailing who cleared the logs, their role, and the exact timestamp.

### PDF-Only Document Standard & Storage Upload Guardrails
ARMS strictly enforces a PDF-only evidence standard across all portals:
- **Client Ingestion Guardrail**: `FileUploadZone` sets `accept=".pdf,application/pdf"` and intercepts file selection/drag-and-drop. Non-PDF files (images, word processors, spreadsheets) are blocked with a clear rejection message before any network transmission to Supabase Storage.
- **Form-Level Enforcement**: `DocumentUploadSheet`, `SubmissionUploadForm`, and `NewVersionUploadSheet` enforce the PDF-only restriction.
- **Server Action Validation**: `uploadDocumentSchema`, `uploadAndMapSchema`, `uploadAndMapBatchSchema`, `saveDraftSchema`, and `uploadNewVersion` validate that filenames end with `.pdf`.

### Resilient Password Recovery & PKCE Session Architecture
Password recovery (`/forgot-password` and `/update-password`) uses a multi-tier resilient architecture:
- **Database Pre-flight Validation**: `/api/auth/forgot-password` first checks the local PostgreSQL `users` table via Prisma. Non-existent accounts return clear 404s, and deactivated accounts return 403s.
- **Admin Link Generation**: Supabase Admin API (`admin.generateLink({ type: "recovery" })`) generates an action link redirecting to `/api/auth/callback?next=/update-password`.
- **Multi-Tier Dispatch**:
  1. Primary: Custom Nodemailer using Gmail SMTP when `GMAIL_USER` and `GMAIL_APP_PASSWORD` are configured.
  2. Fallback: Supabase Auth's native `resetPasswordForEmail` service.
  3. Non-Production Dev Link: In development/demo modes, the generated link is logged to the terminal and returned as `directResetUrl` for zero-configuration testing.
- **SSR Callback & Client Mount Recovery**: `/api/auth/callback` handles PKCE code exchange on the server. In addition, `/update-password` inspects hash fragments (`#access_token=...`), query codes (`?code=...`), and Supabase error codes (`?error_description=...`), rendering clear alerts and direct links to request a new link if a token is expired.

### Active Assignment Scoping & Compliance Calculation Architecture
Accreditation completion and compliance metrics are strictly scoped to actively managed institutional areas:
- **Active Area Scoping**: Indicators are filtered so only those belonging to areas or criteria with active assigned faculty (`user: { isActive: true }`) contribute to `totalRequiredDocs` and `compliancePercent`. Unassigned areas (e.g. Area II whose assigned user was deleted) are omitted from the compliance denominator.
- **Dean Hero Metric Synchronization**: `/dean/dashboard` renders the "Overall Completion" card within the Hero section, displaying `{stats.compliancePercent}%`, `{stats.approvedDocCount} Approved`, and `{stats.totalRequiredDocs} Total Evidences`.
- **Selector Active Filtering**: `getIndicatorsForSelector` excludes unassigned areas and criteria from `DocumentUploadSheet` and area picker dialogs, ensuring faculty only tag indicators within actively assigned areas.
- **Assignment Mutation & Account Archival Invalidation**: Adding, deleting, or archiving user assignments triggers comprehensive revalidation across `/admin/assignments`, `/dean/assignments`, `/faculty/my-areas`, `/faculty/submissions`, `/faculty/dashboard`, `/dean/dashboard`, `/admin/dashboard`, and the `dashboard` cache tag.

### Dean Repository Archives Permanent Deletion & Supabase Storage Purging Architecture
When a Dean permanently deletes a document from the Repository Archives (`/dean/repository` -> "Repository Archives" tab):
- **Authorization & Security**: Protected by `requireAdminOrDean()`. Only Deans and Admins can trigger permanent institutional document removal.
- **Client Confirmation Modal**: Rendered via Radix UI `AlertDialog`. Displays a red trash icon, explicit document name, and destructive action warning banner stating the consequences (permanent deletion from database, mappings, versions, and storage).
- **Physical Storage Purging (`extractStoragePath` + `createAdminClient`)**:
  - The server action `permanentlyDeleteDocumentFromRepository` fetches the document along with its version history (`versions: { select: { fileUrl: true } }`).
  - Resolves bucket name (defaults to `documents`).
  - Helper `extractStoragePath` extracts relative storage paths from Supabase URLs, supporting public URL schemas, signed URLs, and relative paths (e.g. `/storage/v1/object/public/documents/subpath...` -> `subpath...`).
  - Uses `createAdminClient()` with the Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) to remove the files via `storage.from(bucket).remove(pathsToDelete)`, permanently erasing physical assets from Supabase Storage.
- **Database Cascade**:
  - Executes `prisma.document.delete({ where: { id: documentId } })`.
  - In PostgreSQL, foreign keys on `DocumentMapping`, `DocumentVersion`, and `DocumentTag` have `onDelete: Cascade`. This completely removes all mappings, versions, and tags in a single atomic transaction without leaving orphaned rows.
- **Audit Logging & Synchronized Revalidation**:
  - Inserts an audit log entry (`action: "PERMANENT_DELETE_DOCUMENT"`, `module: "REPOSITORY"`).
  - Triggers Next.js server path revalidation for `/dean/repository`, `/admin/repository`, `/faculty/submissions`, `/faculty/archives`, `/faculty/my-areas`, `/dean/dashboard`, `/admin/dashboard`, `/faculty/dashboard`, `/dean/areas`, `/admin/areas`, and `revalidateTag("dashboard")`.
  - In the client, TanStack Query invalidates `submissionKeys.all`, `submissionKeys.approved`, `["repository"]`, `dashboardKeys.all`, and `["archives"]`, instantly synchronizing UI state without manual page refresh.
