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
| **Admin**   | Manage system-wide settings, user accounts (Admin/Dean), view global compliance, manage tags, audit logs.             |

---

## MVP Scope

### Core Features

1. **Authentication & Authorization**
   - Supabase Auth (email/password)
   - Role-based routing: `/admin/*`, `/dean/*`, `/faculty/*`
   - Middleware-enforced session validation
   - Password reset + force-change flow

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
     - **Dean Repository Deletion**: When the Dean deletes an approved document from the repository, it moves to the Repository Archives (`isArchivedFromRepo: true`), disappearing from the active Dean & Admin repositories. The document submitted by the faculty member is strictly preserved in the Faculty Portal: it is NOT deleted and remains fully accessible in both "My Submissions" and the faculty member's approved evidence.
     - **Dean Repository Archive Toggle**: Dean repository includes dedicated "Active Repository" and "Repository Archives" tabs with item count badges, restore capabilities, and deletion protected by accessible Radix `AlertDialog` confirmation modals.
    - **Faculty Approved Repository**: Under Faculty Submissions (`/faculty/submissions`), a dedicated "Approved Repository" tab mirrors the Dean/Admin repository view, allowing faculty to explore all verified institutional evidence grouped by accreditation area.
      - **Personal Approved Repository Archives**: Faculty Approved Repository includes its own "Active Repository" and "Repository Archives" toggle.
      - **Faculty Deletion of Approved Evidence**: When a faculty member deletes an approved document, it is removed from their personal active list and moved to archives. When permanently deleted from archives, `isDeletedByFaculty: true` ensures it is permanently removed from their personal view while remaining preserved in the institutional repository for Dean and Admin compliance evaluation.
    - **Faculty Archives & Confirmation Modals**: All deletion and archiving actions trigger an explicit, accessible Radix `AlertDialog` confirmation modal.
    - File versioning with history and restore capabilities.
    - Tag-based organization.

5. **Document Mapping & Uploads (Faculty)**
    - Map uploaded documents to specific indicators.
    - **Dean View-Only Review & Faculty Action Integrity**: When the Dean views submitted documents, the interface is strictly view-only (view file, download, approve, return with remarks). Deans cannot edit faculty documents or tags. In the Faculty Portal ("My Submissions"), "Edit Tags / Resume" is always accessible so faculty can manage tags and resume draft mappings at any time. "Archive Document" is removed from "My Submissions" as document archiving is managed within the Approved Repository.
    - **Cross-Faculty Tagging Selector**: In the tagging selector, areas and criteria assigned to other faculty members are fully visible and selectable, displaying assigned faculty badges on each area and criterion to enhance collaboration across accreditation teams.
    - **Indicator-Aware Selector**: The tagging selector automatically excludes areas and criteria that do not have any indicators defined, preventing invalid or orphan tagging.
   - **Multi-File Batch Upload**: Faculty can select and upload multiple evidence files at once.
   - **In-Place File Updates**: Updating a file revisions the existing document in-place (`version + 1` with `DocumentVersion` snapshot) rather than creating a duplicate document.
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
   - Area completion percentage accurately computed based only on non-archived approved document mappings (`where: { document: { isArchived: false, isArchivedFromRepo: false } }`). Empty or deleted areas strictly report 0%.
   - Invalidation of area and dashboard query caches on document deletion, archiving, restoring, and approval.

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
    - Password reset capability for managed users.

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
