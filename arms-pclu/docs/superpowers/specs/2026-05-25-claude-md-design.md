# CLAUDE.md Creation Design Specification

## Purpose
Create a CLAUDE.md file that provides guidance to Claude Code when working with the Accreditation Record Management System (ARMS-PCLU) codebase, enabling future AI assistants to quickly understand and work effectively with the project.

## Scope
This specification covers the creation of a single CLAUDE.md file in the repository root that includes:
- Essential development commands
- High-level code architecture and structure
- Key technologies and patterns used
- Database schema highlights
- Common development practices specific to this codebase

## Architecture Overview
The CLAUDE.md file will be organized into logical sections:
1. Development Commands - npm scripts and CLI tools
2. Code Architecture - project structure and organization
3. Key Technologies - frameworks, libraries, and tools used
4. Database Schema - core Prisma model highlights
5. Common Patterns - established conventions in the codebase

## Content Details

### Development Commands Section
Will include:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio

### Code Architecture Section
Will describe:
- `/app` directory with Next.js App Router and role-based layouts
- `/src` directory organization (actions, components, hooks, lib, store, types, validations)
- Authentication flow and role-based access control
- File organization principles

### Key Technologies Section
Will list:
- Next.js 14.2.30 (App Router)
- TypeScript
- Prisma ORM with PostgreSQL
- Supabase for authentication
- TanStack React Query and Zustand for state management
- Zod for validation
- Radix UI + Tailwind CSS for UI components
- Additional libraries for charts, file handling, notifications

### Database Schema Section
Will highlight:
- Centralized Document repository with versioning
- Many-to-many DocumentMapping between Documents and Indicators
- Role-based User model (ADMIN/FACULTY)
- Accreditation hierarchy (Area → Criterion → Indicator)
- Assignment, Logbook, Notification, AuditLog, and Tagging systems

### Common Patterns Section
Will cover:
- Server actions in `/src/actions` for data mutations
- Custom hooks in `/src/hooks` for data fetching
- UI component patterns following shadcn/ui
- Authentication utilities in `/src/lib/auth`
- File upload handling through Supabase storage

## Success Criteria
- File created at repository root as `CLAUDE.md`
- Contains accurate, actionable information for Claude Code
- Follows the required prefix format from the init command
- Provides clear development guidance without being overly verbose
- Focuses on "big picture" architecture rather than granular file details
- Excludes generic development practices and obvious instructions

## Constraints
- Must not repeat information or include obvious instructions
- Should avoid listing every component/file structure (focus on patterns)
- Must not make up information not present in the codebase
- Should reference existing documentation like README.md if available (none found)
- Must prefix file with the specified header text

## Assumptions
- The codebase structure observed during exploration is stable and representative
- Prisma schema accurately reflects the current database design
- Package.json scripts represent the standard development workflow
- Technology stack identified from dependencies is accurate and current