# Coding Rules & Implementation Guidelines

> **Proper Documentation = Faster Development, Fewer Bugs, and Maintainable Code.**

All development on ARMS must strictly follow these principles. Violations should be caught during code review and fixed before merge.

---

## 1. SOLID Principles

### Single Responsibility Principle (SRP)
- **Components**: One component = one visual concern. A `UserFormPanel` handles user form rendering; a `UsersTable` handles table display. Never mix.
- **Server Actions**: Each action file focuses on one entity domain (e.g., `document.actions.ts` handles only document-related mutations).
- **Hooks**: Each custom hook encapsulates one specific concern (e.g., `useUsers` for user data, `useDeleteUser` for deletion mutation).

### Open/Closed Principle (OCP)
- Components should be **open for extension** (via props, composition) but **closed for modification**.
- Use the `mode` prop pattern (e.g., `AreaCard mode="admin" | "dean"`) to extend behavior without modifying core logic.
- Use `allowedRoles` prop to restrict role options without changing `UserFormPanel` internals.
- Use column visibility props (e.g., `UsersTable hideDepartment hideStatus`) to adapt tables across portals while preserving shared data structures.

### Liskov Substitution Principle (LSP)
- Component prop types must be consistent. If a component accepts `IndicatorRow`, any data shape matching that interface should work correctly.
- Lean mapping shapes (`{ status: string }`) and full mapping shapes (`FullMapping`) must both work in `IndicatorTable`.

### Interface Segregation Principle (ISP)
- Don't force components to depend on data they don't use.
- Server Action responses follow `ActionResult<T> = { success: true, data: T } | { error: string }`.
- Use specific `select` clauses in Prisma queries — never `select *` equivalent.

### Dependency Inversion Principle (DIP)
- Components depend on TypeScript interfaces, not concrete implementations.
- Data fetching is abstracted through React Query hooks (e.g., `useAreas()`), not direct Server Action calls in components.
- Auth checking is abstracted through `requireAdmin()`, `requireAdminOrDean()`, `requireUser()`.

---

## 2. DRY — Don't Repeat Yourself

### The Rule of 4
> If a function, UI pattern, business logic, or data transformation is repeated **4 times or more**, it **MUST** be extracted into a shared resource.

| Repeated Thing          | Extract To                                    |
| ----------------------- | --------------------------------------------- |
| UI pattern / snippet    | `src/components/shared/` (e.g., `PageHeader`, `ConfirmDialog`, `StatCard`) |
| Business logic          | `src/lib/utils.ts` or domain-specific utility |
| Data fetching pattern   | Custom React Query hook in `src/hooks/`       |
| Validation schema       | `src/lib/validations/*.schema.ts`             |
| Type definition         | `src/types/*.types.ts`                        |
| Status config map       | Shared constant (e.g., `STATUS_CONFIG`)       |

### Current Extractions
- `PageHeader` — shared across all portal pages.
- `ConfirmDialog` — shared delete/confirm dialogs.
- `StatCard` — dashboard stat cards.
- `AreaCard` — used in both Dean and Admin areas with `mode` prop.
- `IndicatorTable` — used across area detail views.
- `UserFormPanel` — shared user create/edit form with `allowedRoles` restriction.
- `UsersTable` — shared user list table.

---

## 3. KISS — Keep It Simple, Stupid

### Guidelines
- **No over-engineering**: Write the simplest solution that solves the problem. Refactor later only when complexity demands it.
- **Standard patterns**: Use Next.js App Router conventions. Don't invent custom routing solutions.
- **Explicit naming**: `handleDocumentUpload` over `doUpload`. `getComplianceDataWithCounts` over `fetchData2`.
- **Flat component trees**: Avoid deeply nested component hierarchies. Prefer composition over inheritance.
- **No premature abstraction**: If a pattern appears only 1–3 times, keep it inline. Extract only at 4+.

---

## 4. Technical Guidelines

### TypeScript
- **Strict typing is mandatory**. No `any` unless absolutely necessary and documented with a comment explaining why.
- Define clear interfaces for all component props and function parameters.
- Use `Extract<>`, `Awaited<>`, `ReturnType<>` for deriving types from Server Action returns instead of duplicating.

### Data Validation
- All external input (forms, URL params) validated using **Zod** schemas.
- Schemas live in `src/lib/validations/`.
- Client-side: React Hook Form's `zodResolver`.
- Server-side: Manual `.parse()` or `.safeParse()` at the top of Server Actions.

### Server Actions
- Handle all DB writes via `"use server"` functions.
- **Auth first**: Always call `requireAdmin()` / `requireAdminOrDean()` / `requireUser()` at the top.
- **Return standardized shapes**: `{ success: true, data: T }` or `{ error: string }`.
- **Never expose raw Prisma errors** to the client. Catch, log, return human-readable messages.
- **Cache invalidation**: Call `revalidateTag()` or `revalidatePath()` after mutations.

### Client Components
- Minimize `"use client"` surface area. Server Components should do the heavy data fetching.
- Pass server-fetched data as `initialData` to client components.
- Use React Query for cache management and optimistic updates.

### Error Handling
- **Fail gracefully**: Never let the UI crash. Always provide fallback content.
- **Server Actions**: `try/catch` wrapping all Prisma calls. Return `{ error: "..." }` on failure.
- **Client**: Use `sonner` toasts for user-facing success/error messages. Never use `alert()`.

### Performance
- Lazy-load heavy dependencies (`recharts`, `jspdf`, `xlsx`) with `next/dynamic`.
- Use `React.memo()` for list item components that render in large lists.
- Set appropriate `staleTime` values per hook (structure data: 10min, activity data: 1min).
- Use `unstable_cache()` with tags for server-side aggregation queries.

---

## 5. Code Organization

### File Naming
- Components: `PascalCase.tsx` (e.g., `AreaCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAreas.ts`)
- Actions: `kebab-or-dot.actions.ts` (e.g., `document.actions.ts`)
- Schemas: `kebab-or-dot.schema.ts` (e.g., `auth.schema.ts`)
- Types: `kebab-or-dot.types.ts` (e.g., `document.types.ts`)

### Import Order
1. React / Next.js imports
2. Third-party library imports
3. Internal aliases (`@/components/`, `@/actions/`, `@/hooks/`, etc.)
4. Relative imports
5. Type-only imports

### Comments
- Preserve all existing comments unrelated to your changes.
- Use `// ── Section Name ──` comment style for visual sectioning in large files.
- Document **why**, not **what**. Code should be self-documenting for the "what".

---

## 6. Compliance Metric Consistency

> **CRITICAL**: All portals must use consistent and accurate metrics:
>
> 1. **Area Progress (Dean & Faculty)**:
>    `area_progress% = (approved docs × 100) / total required docs`
>    Where "approved docs" = sum of APPROVED mappings per indicator (capped at `requiredDocs` per indicator, non-archived), and "total required docs" = sum of `requiredDocs` across all indicators in the area.
>
> 2. **Admin Dashboard Overall Compliance Rate**:
>    `compliance_rate% = (approved docs capped per indicator × 100) / total required docs across all indicators`
>    Subtitle must explicitly state `X of Y required documents approved` (never dividing by uploaded documents, ensuring draft submissions do not lower compliance rate).

Any new compliance-related feature must reference `dashboard.actions.ts` as the canonical source of truth.

---

## 7. Report Data Integrity & Export Standards

- **Soft-Delete Filter Mandatory**: Every report query must explicitly filter `{ document: { isArchived: false } }`. Mappings of archived documents must never be counted or listed.
- **Canonical Count Parser**: Indicator document counts must always be parsed with `parseRequiredDocsCount()` (supporting both numeric counts and comma-separated lists), never raw `parseInt()`.
- **Approval Timestamp Invariant**: Reports filtering by approval date must filter against mapping `updatedAt`, not draft `createdAt`.
- **Non-Editable Export Format**: Accreditation reports intended for institutional distribution must be generated and downloaded as institutional, read-only PDF files using `jspdf` and `jspdf-autotable`. The configuration interface must use intuitive terminology ("Report Settings").

---

## 8. Audit Log Sanitization & Security

- **No Raw Identifiers in UI**: Audit log `details` displayed in the UI must never render raw database CUIDs (`cm...`), UUIDs, or internal `correlationId` hashes.
- **Semantic Formatting**: Audit log details must be rendered as clean, natural-language activity sentences.
- **Payload Cleanliness**: When calling `prisma.auditLog.create()`, prefer human-readable attributes (e.g., `documentTitle`, `indicatorName`, `facultyName`) over isolated foreign key IDs.

---

## 9. Dean Repository Invariant

- **Exclusively Approved Evidence**: The Dean's Portal Repository is strictly reserved for verified, approved accreditation evidence. The data source must exclusively query `{ status: "APPROVED", document: { isArchived: false } }`. Unapproved drafts, pending reviews, and returned documents must never appear in the central repository.

---

## 10. In-Place Document Updates vs. Creation

- **No Duplicate Documents on Re-upload**: When faculty updates an existing evidence item, the action MUST update the existing `Document` record in-place (`version + 1`) and create a `DocumentVersion` snapshot. It must NEVER call `prisma.document.create()` or orphan previous mappings.
- **Multi-File Batch Uploads**: New evidence uploads may accept multiple files simultaneously, processing each file cleanly through storage and creating separate mappings under the target indicator without artificial single-file blockers.

---

## 11. Task Assignment Exclusivity & Destructive Action Safeguards

- **No Overlapping Assignments**: An Area or Criterion can only be actively assigned to one faculty member at a time. The assignment picker must disable already-assigned items and display the current assignee.
- **Explicit Scope Disambiguation**: Assignment modals must present explicit Scope choices ("Entire Area" vs "Specific Criteria") with clear disabled states and collision warnings.
- **Destructive Deletion Confirmation**: All assignment removals in the Dean's Portal require an explicit confirmation modal dialog (`AlertDialog`) detailing the affected faculty and scope before execution.

---

## 12. Client Navigation & Query Performance Standards

- **Eager AuthGuard State Hydration**: `AuthGuard` must evaluate initial authenticated state synchronously from Zustand store to prevent layout flash or routing delay on client navigations.
- **Fast User Queries**: User administration endpoints query PostgreSQL directly without blocking on external authentication APIs. Tables display verified system attributes without inaccurate timestamp estimates.
- **Global Search Optimization**: The global search dialog must be pre-mounted in layout with debouncing (<= 150ms) and client-side caching (staleTime >= 5min) to deliver instantaneous results.

---

## 13. Submission Feedback & UI Attribution Integrity

- **Contextual Anchoring**: Reviewer return remarks must be directly coupled to the specific document row (`Reviewer Return Remarks: [remarks]`), never detached as floating warning banners at the bottom of criteria blocks.
- **Production Data Cleanliness**: Test remarks and debug indicators must never be persisted in production databases or surfaced in production environments.

---

## 14. Modal Confirmation Standard (No Native Alerts)

- **Strict Prohibition of `window.confirm()` and `window.alert()`**: Native browser alerts block the thread and provide inconsistent styling. All destructive or state-altering user actions (such as document deletion, archiving, submitting for review, clearing audit logs, and removing assignments) **MUST** use accessible Radix UI `AlertDialog` components.
- **Clear Copy**: Confirmation dialogs must clearly describe the exact scope of the action, the consequences, and provide explicit confirmation button labels (e.g., "Yes, Clear All Logs", "Archive Document").

---

## 15. Institutional Approved Evidence Retention & Multi-Tier Architecture

- **Approved Evidence Preservation**: Approved documents are institutional assets required for accreditation compliance evaluation.
- **Dean View-Only on Faculty Submissions**: When the Dean views documents submitted by faculties (across `/dean/submissions`, `/dean/repository`, and `/dean/areas/[id]`), the Dean is strictly restricted to view-only mode (view file, download, preview, approve, and return with remarks). The Dean cannot edit documents, files, or tags.
- **Faculty Submissions Actions & Sidebar Archive Routing ("My Submissions")**:
  - In the Faculty Portal under "My Submissions" (`/faculty/submissions`), all documents across all categories (**Submitted**, **Returned**, **Untagged**, **Drafts**, and **Approved**) feature a comprehensive 3-dots action menu:
    - **View Document**: Opens the uploaded file in a new tab.
    - **Revise Document**: Available on returned submissions to upload a new version.
    - **Submit for Review**: Available on draft and returned submissions to submit to Dean.
    - **Edit Tags / Resume** (or **Tag Indicators** for untagged items): Allows modifying indicator mappings at any time.
    - **Archive Document**: Soft-archives the document (`isArchived: true`), safely routing it to the **Archive Documents** page (`/faculty/archives`) in the main Sidebar.
  - **Zero Permanent Loss from Submissions**: Deleting or archiving any document from "My Submissions" moves it to `/faculty/archives` where faculty can restore it back to active submissions at any time or permanently delete it. All archive actions are protected by accessible Radix `AlertDialog` confirmation modals.
- **Dean Repository Deletion Isolation (`isArchivedFromRepo`)**: When the Dean deletes an approved document from `/dean/repository`, the system flags `isArchivedFromRepo: true`. It is removed from the active Dean & Admin repositories and moved to the Repository Archives tab. The document submitted by the faculty member is NOT deleted in the Faculty Portal; it remains fully preserved in "My Submissions" and in the faculty owner's approved evidence.
- **Faculty Deletion of Approved Evidence (`isDeletedByFaculty`)**: If a faculty member deletes an approved document from their personal submissions or personal archives, the backend flags `isDeletedByFaculty: true`. The document is permanently removed from the faculty member's view, while the record and its approved mappings remain safely preserved in the institutional repository for Dean and Admin compliance evaluation.
- **Repository Archive Tabs & Confirmation Modals**: Both the Faculty Approved Repository and the Dean Repository feature dedicated "Active Repository" and "Repository Archives" toggle tabs with accessible Radix UI `AlertDialog` confirmation modals before deletion or archiving.
- **Dean Repository Archives Permanent Deletion & Supabase Storage Purging**:
  - In the Dean Repository Archives (`/dean/repository` -> "Repository Archives" tab), Deans have the ability to permanently delete an archived document.
  - **Confirmation Dialog**: Permanent deletion is protected by an accessible Radix UI `AlertDialog` confirmation modal featuring red destructive styling, explicit document title confirmation, and an irreversible action warning.
  - **Database Cascade**: Calling `permanentlyDeleteDocumentFromRepository` deletes the record via `prisma.document.delete({ where: { id } })`, cleanly cascading deletion to all dependent `DocumentMapping`, `DocumentVersion`, and `DocumentTag` entries in PostgreSQL.
  - **Storage Cleanup**: Supabase Storage physical assets associated with the document (both current `doc.fileUrl` and historical version paths in `doc.versions`) are automatically purged from the `documents` storage bucket via `createAdminClient()`.
  - **Auditing & Invalidation**: Permanently deleting an institutional document generates an audit log entry (`PERMANENT_DELETE_DOCUMENT`, module `REPOSITORY`) and executes revalidations across server paths (`/dean/repository`, `/admin/repository`, `/faculty/submissions`, `/faculty/archives`, `/dean/dashboard`, `/admin/dashboard`, `/faculty/dashboard`, `/dean/areas`, `/admin/areas`) and TanStack Query keys (`submissionKeys.all`, `submissionKeys.approved`, `["repository"]`, `dashboardKeys.all`, `["archives"]`).

---

## 16. Indicator Confidentiality & Granular Evidence Selection

- **Granular Confidentiality**: In addition to marking an entire indicator as confidential (`isConfidential: true`), users can select specific required evidence items as confidential (`confidentialDocs` JSON array) using individual checkboxes and a master "Select All as Confidential" toggle in the indicator modal.
- **Peer Faculty Access Control**:
  - Dean and Admin have full access to view, download, and audit all evidence files.
  - The uploading faculty owner has full access to view and manage their own files.
  - Peer faculty members can view metadata (title, area, criterion, indicator, date) to track institutional coverage, but the file viewing link and download actions **MUST** be locked and disabled, accompanied by a clear `🔒 Confidential` badge.

---

## 17. Area Metric Coherence & Cache Synchronization

- **Archived Document Filtering**: All area compliance, criterion mapping queries, and drill-down components must explicitly filter `{ where: { document: { isArchived: false, isArchivedFromRepo: false } } }`. Empty or deleted areas must strictly display 0% completion.
- **Cache Invalidation Pipeline**: Any document lifecycle event (delete, archive, restore, permanent delete, approval) must coordinate both:
  1. Next.js App Router server path revalidation (`revalidatePath`).
  2. TanStack React Query cache invalidation (`areaKeys.all`, `dashboardKeys.all`, `submissionKeys`, `archiveKeys`, and `repository`).

---

## 18. Collaborative Cross-Faculty Tagging Architecture

- **Broad Collaboration Access**: In the Document Upload Sheet (`DocumentUploadSheet`), the tagging selector must not restrict faculty to only their own assigned areas. It must display all active areas and criteria that contain indicators.
- **Assigned Faculty Badging**: Areas and criteria must display clear badges indicating which faculty member is assigned, fostering transparent coordination across accreditation teams.

---

## 19. PDF-Only Document Standard & Resilient Password Recovery Architecture

- **PDF-Only Upload Standard**:
  - Across all document entry points (Upload Document, Batch Upload, Tagging, and Version Re-upload), the system **strictly permits PDF files only** (`.pdf`, `application/pdf`).
  - Office documents (`.docx`, `.xlsx`, `.pptx`) and images (`.jpg`, `.png`, `.webp`, `.gif`) are strictly prohibited and rejected at both client and server boundaries.
  - Client drag-and-drop zones (`FileUploadZone`, `DocumentUploadSheet`, `SubmissionUploadForm`, `NewVersionUploadSheet`) reject non-PDF selections before storage upload.
  - Server actions (`uploadDocumentSchema`, `uploadAndMapSchema`, `uploadAndMapBatchSchema`, `saveDraftSchema`, `uploadNewVersion`) strictly validate file extensions.
- **Resilient Password Recovery Flow**:
  - **Database Pre-verification**: `/api/auth/forgot-password` verifies user existence and account activation in Prisma DB before invoking Supabase Auth, returning descriptive 404/403 alerts rather than cryptic errors.
  - **Multi-Tier Delivery**:
    1. Primary: Custom Nodemailer via Gmail SMTP when credentials (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) are configured.
    2. Fallback: Supabase Auth native `resetPasswordForEmail` service.
    3. Dev / Evaluation Support: Generates recovery action link, logs directly to server terminal, and supplies `directResetUrl` in non-production responses for instant password resets during capstone defense, demonstrations, or environments without active SMTP servers.
  - **Auth Session Recovery**: `/update-password` detects Supabase verify redirects (`#access_token=...`), PKCE codes (`?code=...`), and error parameters (`?error_description=...`), ensuring clean error presentation and graceful token exchanges.

---

## 20. Active Assignment Scoping, Dashboard Compliance Metrics & User Lifecycle Integrity

- **Assigned Area Denominator Rule**:
  - In Admin and Dean dashboard compliance computations (`getDashboardStats`), the required documents denominator strictly counts only areas/criteria with active assigned faculty (`user.isActive === true`).
  - Unassigned areas (e.g., Area II whose assigned faculty was deleted) and areas without active faculty must NOT be counted in the required documents denominator.
  - Formula: `compliancePercent = (approvedDocCount * 100) / totalRequiredDocsInAssignedScope`.
- **Dean Dashboard Overall Completion Card**:
  - Hero section in `/dean/dashboard` includes the "Overall Completion" card, displaying `{stats.compliancePercent}%` with an animated progress bar, `{stats.approvedDocCount} Approved`, and `{stats.totalRequiredDocs} Total Evidences`.
- **Tagging Selector Accuracy**:
  - `getIndicatorsForSelector` and faculty area pickers strictly filter out unassigned areas and criteria. Unassigned areas (such as Area II) must never appear in tagging choices.
  - Newly assigned areas to active faculty immediately become selectable across tagging and evidence upload sheets.
- **User Archival Assignment Cleanup & Cache Invalidation**:
  - When a user account is archived (`archiveUserAccount`) or deleted (`deleteUserAccount`), all assignments associated with that user are immediately deleted from `prisma.assignment`.
  - Mutations must revalidate `/admin/assignments`, `/dean/assignments`, `/faculty/my-areas`, `/faculty/submissions`, `/faculty/dashboard`, `/dean/dashboard`, `/admin/dashboard`, and `revalidateTag("dashboard")`.
