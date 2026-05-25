# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run prisma:generate` - Generate Prisma client after schema changes
- `npm run prisma:studio` - Open Prisma Studio GUI for database inspection

## Code Architecture

### Project Structure
- `/app` - Next.js App Router with role-based layouts:
  - `(admin)` - Admin interface routes
  - `(faculty)` - Faculty interface routes  
  - `(auth)` - Authentication routes
  - `/api` - API routes (auth, seeding)
- `/src` - Source code organization:
  - `/actions` - Server actions for data mutations
  - `/components` - Reusable UI components (organized by feature)
  - `/hooks` - Custom React hooks for data fetching
  - `/lib` - Utilities (Prisma, Supabase, auth helpers)
  - `/store` - Zustand stores for UI state
  - `/types` - TypeScript type definitions
  - `/validations` - Zod schemas for form validation

### Key Technologies
- **Framework**: Next.js 14.2.30 (App Router)
- **Language**: TypeScript
- **ORM**: Prisma with PostgreSQL
- **Authentication**: Supabase (via `@supabase/ssr` and `@supabase/supabase-js`)
- **State Management**: TanStack React Query (client state), Zustand (UI state)
- **Validation**: Zod
- **UI Components**: Radix UI primitives + Tailwind CSS
- **Data Tables**: TanStack React Table
- **Forms**: React Hook Form + Zod resolver
- **Notifications**: Sonner
- **Charts**: Recharts
- **File Handling**: jsPDF, xlsx for export

### Database Schema Highlights (Prisma)
- Centralized document repository (`Document`) with versioning
- Many-to-many mapping between documents and accreditation indicators (`DocumentMapping`)
- Role-based access control (ADMIN/FACULTY)
- Accreditation hierarchy: Areas → Criteria → Indicators
- Assignment system linking faculty to areas/criteria
- Logbook for tracking official communications
- Notification system
- Audit trail for administrative actions
- Tagging system for document categorization

### Common Development Patterns
- Server actions in `/src/actions` handle data mutations with form validation
- Custom hooks in `/src/hooks` encapsulate React Query data fetching
- UI components follow shadcn/ui patterns with Radix primitives
- Authentication checks via `getUser()` utility in `/src/lib/auth`
- File uploads handled through Supabase storage with sanitization