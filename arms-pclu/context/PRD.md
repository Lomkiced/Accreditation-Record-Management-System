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
   - Assign faculty to Areas or specific Criteria
   - Faculty sees only assigned areas in their portal

4. **Document Repository & Archives**
   - **Central Repository (Dean & Admin)**: Centralized storage of verified accreditation documents. The Dean's Portal Repository strictly displays **approved documents only** (`status: APPROVED`, non-archived).
   - **Faculty Archives**: Soft-deleted document vault designed for high document volume; supports real-time multi-attribute search, responsive pagination, grid/table view modes, and bulk metadata visibility.
   - File versioning with history and restore capabilities.
   - Tag-based organization.

5. **Document Mapping (Faculty)**
   - Map uploaded documents to specific indicators
   - Per-mapping status workflow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / RETURNED`
   - Evidence upload via cascading picker (Area → Criterion → Indicator)

6. **Submission Review (Dean)**
   - View pending submissions
   - Approve or return with remarks and rating
   - Bulk status management

7. **Dashboards**
   - **Admin**: Stat cards, pending submissions table, hierarchical evidence drill-down
   - **Dean**: Stat cards, progress by area (with indicator counts), pending submissions, compliance overview
   - **Faculty**: Assigned areas with per-area completion percentage

8. **Audit Trail & Notifications**
   - Comprehensive audit logging for all critical operations (creates, updates, reviews, deletes).
   - Human-readable semantic activity logs in the UI (filtering out database CUIDs, UUIDs, and technical correlation hashes).
   - In-app notification system with read/unread tracking.
   - Activity feed on dashboards. (Raw log export is deprecated and omitted).

9. **Reports & Exports**
   - Official accreditation reports generated as **tamper-proof, non-editable PDF documents** with official PCLU letterhead, PACUCOA formatting, and certification blocks.
   - Interactive on-screen data preview before download.
   - 3 canonical reports:
     1. **Compliance Summary Report**: Accurate indicator-level compliance using canonical logic (`parseRequiredDocsCount`, capped approved counts, non-archived filter).
     2. **Faculty Contribution Report**: Accurate submission activity across all active faculty members (including non-contributing faculty) and unique assigned areas.
     3. **Approved Documents List**: Detailed verified evidence register sorted by approval timestamp with direct viewing metadata.

10. **User Management**
    - **Dean**: Manage Faculty accounts (CRUD)
    - **Admin**: Manage Admin and Dean accounts; view Faculty (read-only)
    - Password reset capability for managed users

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
