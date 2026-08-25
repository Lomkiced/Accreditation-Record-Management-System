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

> **CRITICAL**: All portals must use the same compliance calculation:
> ```
> compliance% = (indicators with ≥1 APPROVED mapping) / totalIndicators × 100
> ```
>
> The Faculty portal's `My Areas` view may additionally factor in `requiredDocs` count for a more granular percentage, but the admin/dean dashboards and area cards must always use the indicator-level metric.

Any new compliance-related feature must reference `dashboard.actions.ts` → `_fetchComplianceData` as the canonical source of truth.
