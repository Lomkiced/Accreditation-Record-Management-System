# Product Requirements Document (PRD)

## Project Overview

The **Accreditation Record Management System (ARMS)** is a centralized digital platform built for **Polytechnic College of La Union (PCLU)** to manage the PACUCOA accreditation process end-to-end. It replaces the manual, paper-based workflow of collecting, organizing, reviewing, and approving accreditation evidence across multiple areas, criteria, and indicators.

---

## Problem Statement

Manual accreditation processes suffer from:
- **Document Fragmentation** — evidence scattered across USB drives, emails, and physical folders.
- **Redundant Uploads** — the same document uploaded multiple times for different requirements.
- **No Visibility** — program heads and deans lack real-time visibility into submission progress.
- **Audit Risk** — no centralized trail of who uploaded, reviewed, or approved what and when.

---

## Goals

| # | Goal                              | Description                                                                                       |
| - | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1 | **Digitize Workflow**             | Replace paper-based document submission and review with a web-based system.                       |
| 2 | **Unified Hierarchy**             | Provide a clear, navigable structure: Area → Criterion → Indicator → Documents.                   |
| 3 | **Reduce Redundancy**             | Allow one uploaded document to be mapped to multiple indicator requirements simultaneously.         |
| 4 | **Real-Time Tracking**            | Enable all stakeholders to see submission status in real time (Draft → Submitted → Approved).      |
| 5 | **Compliance Visibility**         | Give deans and admins instant compliance dashboards showing progress per area.                     |
| 6 | **Accountability & Audit Trail**  | Log all critical actions (uploads, reviews, approvals) with timestamps and user attribution.       |

---

## Target Audience

| Role        | Responsibilities                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **Faculty** | Upload documents, map them to assigned indicators, track approval status, manage assigned areas.                      |
| **Dean**    | Review faculty submissions, approve/return documents, monitor area-level compliance, manage taxonomy, assign faculty. |
| **Admin**   | Manage system-wide settings, user accounts (Admin/Dean), view global compliance, institutional repository, audit logs. |

---

## MVP Scope

### Core Features

1. **Authentication & Authorization**
   - Supabase Auth (email/password)
   - Role-based routing: `/admin/*`, `/dean/*`, `/faculty/*`
   - Middleware-enforced session validation
   - **Resilient Password Recovery Flow**:
     - Database pre-verification checking user existence and active status before token generation.
     - Dual-mode email dispatch: primary Nodemailer via Gmail SMTP when configured, automatic fallback to Supabase Auth's native `resetPasswordForEmail`.
     - Direct dev/demo reset link returned in non-production environments to allow zero-configuration demonstration and local evaluation.
     - Robust URL and token handling on `/update-password` with PKCE code exchange and intuitive expired-link messaging.
   - Force-change password on first login for newly provisioned accounts.

2. **Taxonomy Management (Dean)**
   - CRUD for Areas, Criteria, Indicators
   - Drag-and-drop reordering
   - Required document specification per indicator

3. **Task Assignment (Dean)**
   - Assign faculty to Areas or specific Criteria via a responsive 680px Assignment Modal with explicit scope selection (Entire Area vs Specific Criteria).
   - Assignment conflict prevention: criteria/areas already assigned to other active faculty members cannot be reassigned until released.
   - Multiline criterion display with real-time assignment status badges and quick action controls (Select All / Deselect All).
   - Assignment deletion protected by an explicit confirmation modal.
   - Faculty sees only assigned areas in their portal.

4. **Document Repository & Archives**
   - **Central Repository (Dean & Admin)**: Centralized storage of verified accreditation documents. The Dean and Admin Portals display **approved documents only** (`status: APPROVED`, non-archived).
   - **Repository Archives & Deletion Semantics**:
     - **Dean Repository Deletion (Soft-Archive)**: When the Dean deletes an approved document from the repository, it moves to the Repository Archives (`isArchivedFromRepo: true`), disappearing from the active Dean & Admin repositories. The document submitted by the faculty member is strictly preserved in the Faculty Portal: it is NOT deleted and remains fully accessible in both "My Submissions" and the faculty member's approved evidence.
     - **Dean Repository Archive Toggle**: Dean repository includes dedicated "Active Repository" and "Repository Archives" tabs with item count badges, restore capabilities, and deletion protected by accessible Radix `AlertDialog` confirmation modals.
     - **Permanent Deletion from Repository Archives (Dean)**: In the "Repository Archives" tab, Deans can permanently delete an archived repository document. This action:
       1. Prompts an explicit Radix UI `AlertDialog` confirmation modal with destructive warning styling.
       2. Completely deletes the document record from the Supabase Database (`prisma.document.delete`), cascading to all associated `DocumentMapping`, `DocumentVersion`, and `DocumentTag` records.
       3. Completely purges all associated physical file assets from Supabase Storage (`documents` bucket) via the service role client, including both the active `fileUrl` and historical version snapshots in `DocumentVersion`.
       4. Revalidates all relevant Next.js server paths and invalidates TanStack Query caches across submissions, repositories, and dashboards.
   - **Faculty Approved Repository**: Under Faculty Submissions (`/faculty/submissions`), a dedicated "Approved Repository" tab mirrors the Dean/Admin repository view, allowing faculty to explore all verified institutional evidence grouped by accreditation area.
     - **Personal Approved Repository Archives**: Faculty Approved Repository includes its own "Active Repository" and "Repository Archives" toggle.
     - **Faculty Deletion of Approved Evidence**: When a faculty member deletes an approved document, it is removed from their personal active list and moved to archives. When permanently deleted from archives, `isDeletedByFaculty: true` ensures it is permanently removed from their personal view while remaining preserved in the institutional repository for Dean and Admin compliance evaluation.
   - **Faculty Archives & Confirmation Modals**: All deletion and archiving actions trigger an explicit, accessible Radix `AlertDialog` confirmation modal.
   - File versioning with history and restore capabilities.
   - Indicator-based compliance mapping.

5. **Document Mapping & Uploads (Faculty)**
   - **PDF-Only Upload Standard**: Across all document upload workflows (individual upload, batch upload, and returned document version re-upload), the system strictly permits PDF files only (`.pdf`, `application/pdf`). Documents (`.docx`, `.xlsx`, `.pptx`) and images (`.jpg`, `.png`) are strictly disallowed and rejected at both client drag-and-drop and server validation layers.
    - **Dean View-Only Review & Faculty Action Integrity**: When the Dean views submitted documents, the interface is strictly view-only (view file, download, approve, return with remarks). Deans cannot edit faculty documents or tags.
    - **Faculty 3-Dots Action Suite & Sidebar Archive Routing**: In the Faculty Portal under "My Submissions", every document across all states (**Submitted**, **Returned**, **Untagged**, **Drafts**, and **Approved**) features complete 3-dots actions: **View Document**, **Revise Document** (for returned items), **Submit for Review** (for draft/returned items), **Edit Tags / Resume** (or **Tag Indicators** for untagged items), and **Archive Document**. Deleting or archiving any document safely soft-archives it (`isArchived: true`), routing it to the **Archive Documents** page (`/faculty/archives`) in the main Sidebar where faculty can restore it back to active submissions at any time or permanently delete it.
    - **Cross-Faculty Tagging Selector & Active Scoping**: In the tagging selector, areas and criteria assigned to active faculty members are fully visible and selectable, displaying assigned faculty badges on each area and criterion. Areas that have no active faculty assignment (e.g., Area II whose assigned user was deleted, or unassigned areas) are strictly excluded from the choices. Newly assigned areas immediately appear without stale cache delays.
    - **Indicator-Aware Selector**: The tagging selector automatically excludes areas and criteria that do not have any indicators defined, preventing invalid or orphan tagging.
   - **Multi-File Batch Upload**: Faculty can select and upload multiple evidence files at once.
   - **In-Place File Updates**: Updating a file revisions the existing document in-place (`version + 1` with `DocumentVersion` snapshot) rather than creating a duplicate document.
   - **Indicator-Scoped Evidence Duplication Prevention**:
     - Automatically blocks duplicate evidence uploads and mappings within a single indicator.
     - If a document with the same title already exists under the target indicator, the upload/mapping is blocked with an explicit error: `"Duplicate file detected. This document already exists."`
     - Duplication checks are strictly restricted to that specific indicator: documents with identical titles across different indicators remain permissible.
   - **Multi-Tier Independent Storage Quotas & Repository Tracking**:
     - The Faculty Repository and Dean/Admin Repository operate with independent storage allocations and independent usage tracking (Dean and Admin share the central institutional repository).
     - Default limits: Faculty Repository allocated 100 MB per faculty member; Dean/Admin Repository allocated 1 GB institutional storage (system-configurable).
     - Pre-upload quota guardrails: Upload attempts exceeding available storage are blocked before physical asset transfer.
     - Visual storage meters & RBAC Isolation: Faculty Submissions renders the faculty personal repository storage meter (100 MB quota). The institutional repository storage meter (1 GB quota) is strictly restricted to Dean and Admin roles and completely hidden from Faculty users in the Approved Repository view. Server action `getRepositoryStorageQuota` enforces strict Dean/Admin RBAC (`requireAdminOrDean`).
   - **Single-Deduction Exhibit Storage Engine (Multi-Tagging & Cross-Faculty Deduplication)**:
     - Exhibits tagged across multiple indicators consume storage ONLY ONCE (e.g., a 15 MB syllabus tagged to 5 indicators consumes only 15 MB of the uploader's quota, not 75 MB).
     - Cross-Faculty Tagging Storage Attribution: When Faculty A links/tags their document to indicators assigned to Faculty B, the storage is strictly deducted from Faculty A (the owner), never from Faculty B.
     - Physical storage deduplication ensures zero multiplication of storage consumption across indicators or faculty boundaries.
   - **Area-Owner Centric Evidence Tagging & Folder Routing**:
     - When evidence is tagged or mapped to an indicator, the mapping is dynamically assigned to the **Area Owner** (the faculty member actively assigned to that Criterion or Area).
     - When faculty completes tagging, if the tagged area is assigned to them, the system routes directly into their assigned Area folder (`/faculty/my-areas/[areaId]`). If tagged to an Area assigned to another faculty member (e.g. Faculty A tagging an area assigned to Faculty B), the evidence routes automatically to Faculty B's account and appears under Faculty B's assigned Area, while remaining removed from Faculty A's area view. Faculty A is confirmed of the successful routing without being dumped into an unassigned folder.
   - **Decoupled Cross-Area Document Tagging & Reference-Counted Storage Lifecycle**:
     - When an uploader tags an exhibit to secondary Areas assigned to peer faculty, the system creates decoupled `Document` records with `originalUploaderId: currentUser.id` and `userId: assignedAreaOwnerId`, initialized in `DRAFT` status with their own evidence mappings.
     - **Independent Archival & Deletion**: Archiving or deleting a document in `My Submissions` (`/faculty/submissions`) or `Archives` (`/faculty/archives`) strictly isolates changes to the uploader's own record. Tagged copies in secondary Areas remain completely active and intact in `DRAFT` status under their respective assigned areas (`/faculty/my-areas/[id]`).
     - **Autonomous Area Owner Submission & Versioning**: Assigned Area Owners retain full permissions to edit document metadata, upload new versions, and submit their tagged copy (`submitMapping` / `submitAllMappings`) to the Dean for review, independently of the original uploader's actions.
     - **Reference-Counted Physical Storage Cleanup**: Supabase Storage physical assets are preserved as long as at least one active database reference exists across all areas. Physical deletion is strictly executed only when the reference count drops to 0 (`deleteStorageFileIfOrphaned`).
   - **Real-Time Cache & Storage Synchronization**:
     - Immediate TanStack Query cache invalidations (`storageQuotaKeys`, `submissionKeys`, `areaKeys`, `dashboardKeys`) and Next.js path revalidations ensure real-time UI synchronization across all storage meters, area views, and dashboards when documents are uploaded, tagged across multiple indicators, submitted, archived, or restored, enabling seamless testing of space limits per exhibit and indicator-scoped duplication avoidance.
   - Per-mapping status workflow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / RETURNED`.
   - Evidence upload via cascading picker (Area → Criterion → Indicator) and direct indicator upload.
   - **Contextual Return Remarks**: When a submission is returned, reviewer remarks are directly coupled beneath the respective document entry (`Reviewer Return Remarks: [remarks]`) rather than floating as ambiguous system banners.

6. **Submission Review & Taxonomy Management (Dean & Admin)**
   - View pending submissions, approve or return with remarks and rating.
   - CRUD for Areas, Criteria, and Indicators with drag-and-drop reordering.
   - **Granular Confidential Evidence Selection**: In Add/Edit Indicator, users can select specific confidential documents from the required evidence list via individual checkboxes and a "Select All as Confidential" toggle.
   - **Peer Evidence Confidentiality Gating**: When Faculty A views or searches approved documents of Faculty B, confidential items display a `🔒 Confidential` badge, with file viewing and downloading strictly locked and restricted to the document owner, Dean, and Admin.

7. **Global Search Engine & Performance (All Portals)**
   - Ultra-fast global search in the top navigation header across all portals. Clean placeholder text with active `Ctrl+K` shortcut listener.
   - Searches both **documents** (by title and filename) and **faculty members** (by name, email, department, designation).
   - **Role-Aware Redirection**:
     - Dean clicking a faculty user navigates directly to Area Assignments (`/dean/assignments?facultyId=...`), automatically pre-selecting that faculty member so the `AssignmentPanel` opens directly.
     - Admin clicking a user navigates to User Management (`/admin/users?search=...`).
     - Faculty clicking a peer opens a dedicated `FacultyEvidenceModal` displaying their approved evidence portfolio with confidentiality restrictions enforced.
   - High performance: pre-mounted search dialog, 150ms debounce, 5-minute TanStack Query caching.

8. **Dashboards & Metric Semantics**
    - **Faculty Dashboard**: In the "Overall Completion" card, the metric displays `{totalIndicators} Total Evidences` to accurately represent cumulative accreditation evidence.
    - **Dean Dashboard Overall Completion Card**: Re-enabled in the hero section displaying `{stats.compliancePercent}%` with animated progress bar, `{stats.approvedDocCount} Approved`, and `{stats.totalRequiredDocs} Total Evidences`.
    - **Admin Compliance Rate Card**: Accurately reports `{stats.approvedDocCount} of {stats.totalRequiredDocs} required documents approved`.
    - **Assigned Area Denominator Rule**: Across both Admin and Dean dashboards, the required documents denominator strictly counts only areas with active assigned faculty (`user.isActive === true`). Unassigned areas (e.g., Area II whose faculty was deleted) are strictly excluded from the required documents denominator.
    - **User Archival Assignment Cleanup**: Archiving or deleting a user immediately clears their records from `prisma.assignment`, ensuring formerly assigned areas revert to unassigned status and are removed from compliance denominators and tagging choices.
    - Area completion percentage accurately computed based only on non-archived approved document mappings (`where: { document: { isArchived: false, isArchivedFromRepo: false } }`). Empty or deleted areas strictly report 0%.
    - Invalidation of area and dashboard query caches on document deletion, archiving, restoring, assignment mutations, and approval.

9. **User Management (Dean & Admin)**
   - **Dean's Portal**: Tailored exclusively for faculty account administration (`/dean/users`). Pre-fills and filters on `?search=` query parameter from global search.
   - **Admin's Portal**: Full system-wide user administration across Admin, Dean, and Faculty roles with comprehensive department and role filters.
   - Both portals query PostgreSQL directly for ultra-fast, sub-second rendering without blocking on external auth APIs.

10. **Audit Trail & Maintenance**
    - Comprehensive audit logging for all critical operations (creates, updates, reviews, deletes).
    - Human-readable semantic activity logs in the UI.
    - **Clear Audit Logs**: Admin and Dean portals feature an explicit "Clear All Logs" action protected by a confirmation modal, deleting historical logs and creating an initial `CLEAR_AUDIT_LOGS` audit record.
    - In-app notification system with read/unread tracking.

10. **Reports & Exports**
    - Official accreditation reports generated as non-editable institutional PDF documents with official PCLU letterhead, PACUCOA formatting, and certification blocks.
    - Simplified user-friendly "Report Settings" configuration panel.
    - Interactive on-screen data preview before download.
    - 3 canonical reports:
      1. **Compliance Summary Report**: Accurate indicator-level compliance using canonical logic (`parseRequiredDocsCount`, capped approved counts, non-archived filter).
      2. **Faculty Contribution Report**: Accurate submission activity across all active faculty members (including non-contributing faculty) and unique assigned areas.
      3. **Approved Documents List**: Detailed verified evidence register sorted by approval timestamp with direct viewing metadata.

11. **User Management**
    - **Dean**: Manage Faculty accounts (CRUD).
    - **Admin**: Manage Admin and Dean accounts; view Faculty (read-only).
    - Accurate **Last Login** tracking synchronized from Supabase Auth (`last_sign_in_at`) and audit activity.
12. **Institutional Enterprise UI/UX Identity**
    - **Unified Role Vector Iconography**: Simple, unified, and recognizable SVG vector icons (`ShieldCheck` for Admin, `GraduationCap` for Dean, `BookOpen` for Faculty, `User` for Default User) enclosed in identical dark charcoal circular frames (`bg-slate-900 border-slate-700/80`). Strict prohibition of gaming/RPG visual elements (flames, glowing drop-shadows, fantasy gradients).
    - **Corporate Navy/Blue Institutional Theming**: Zero tolerance for novelty tints (such as violet/purple for Dean). The entire suite adheres to Corporate Deep Navy (`#0F172A`) and Precision Blue (`#2563EB`).

---

## Technical Requirements

| Area          | Requirement                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix), Framer Motion               |
| Backend       | Next.js Server Actions, Prisma ORM                                                                 |
| Database      | PostgreSQL (Supabase-hosted)                                                                       |
| Auth/Storage  | Supabase Auth (SSR cookies), Supabase Storage (file uploads)                                       |
| Validation    | Zod schemas (dual client + server validation)                                                      |
| State Mgmt    | TanStack React Query (server state), Zustand (client state)                                        |
| Performance   | Page loads < 2s, prefetched sidebar navigation, server-side caching with `unstable_cache`          |
| Security      | Auth checks in every Server Action, role-based query filtering, CSRF protection via Server Actions |

---

## Success Metrics

| Metric                      | Target                                              |
| --------------------------- | --------------------------------------------------- |
| Page Load Time              | < 2 seconds (including server-side data fetch)      |
| Faculty Adoption            | > 80% of active faculty use the system within 1 semester |
| Document Redundancy         | < 10% duplicate file uploads (vs. pre-ARMS baseline) |
| Compliance Visibility       | 100% of areas have real-time compliance % visible    |
| Audit Coverage              | 100% of CRUD operations logged with user attribution |
| Data Integrity              | Zero data loss during versioning and mapping updates |
| Routing Performance         | < 500ms perceived navigation (with progress bar)    |

---

## Out of Scope (for MVP)

- Native mobile application (responsive web only).
- Third-party LMS integrations.
- AI-based document analysis or auto-classification.
- Multi-institution tenancy.
- Offline document submission.
- Advanced analytics / predictive compliance.
