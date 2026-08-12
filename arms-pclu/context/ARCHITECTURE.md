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

## Key Implementations
- **Document Management:** A central document uploaded once can be mapped to multiple indicators using a pivot table (`DocumentMapping`), tracking separate approval statuses per indicator.
- **Role-Based Access Control (RBAC):** Authorization checks are performed at the layout level and within every Server Action to ensure users (ADMIN, DEAN, FACULTY) can only access appropriate resources.
- **Global Upload Evidence Picker:** Faculty can upload evidence from the My Areas listing page via a cascading picker dialog (Area → Criterion → Indicator) that opens the `SubmissionUploadForm` sheet, eliminating the need to navigate into a specific area first.
- **Progress by Area (Dean Dashboard):** A dedicated `ProgressByArea` component replaces the `HierarchicalDrillDown` on the Dean dashboard, showing per-area compliance as color-coded horizontal progress bars with status badges (Complete / In Progress / Needs Attention).
