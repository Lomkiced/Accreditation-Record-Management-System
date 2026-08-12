# Coding Rules & Implementation Guidelines

To ensure the ARMS project remains maintainable, scalable, and bug-free, all development must adhere to the following principles.

## 1. SOLID Principles
- **Single Responsibility:** Components, functions, and files should do one thing and do it well. Keep Server Actions strictly focused on their specific mutation.
- **Open/Closed:** Write code that is open for extension but closed for modification. Utilize polymorphic components where necessary.
- **Dependency Inversion:** Depend on abstractions (types/interfaces), not concretions.

## 2. DRY (Don't Repeat Yourself)
- **The Rule of 4:** If a function, UI pattern, or complex business logic is repeated 4 times or more, it MUST be extracted into a shared resource.
  - UI snippets -> `src/components/shared/`
  - Business logic -> `src/lib/utils.ts` or custom hooks (`src/hooks/`)
  - Shared data fetching -> Extracted Server Actions or React Query hooks.

## 3. KISS (Keep It Simple, Stupid)
- Avoid over-engineering. Write straightforward, readable code.
- Prefer standard Next.js App Router patterns over custom convoluted routing.
- Keep business logic clear. Use explicit naming conventions for variables and functions (e.g., `handleDocumentUpload` rather than `doUpload`).

## 4. Technical Guidelines
- **Strict Typing:** TypeScript is mandatory. Avoid `any` types. Define clear interfaces for all component props and function parameters.
- **Data Validation:** All external input (forms, API params) must be validated using `Zod` schemas before processing.
- **Server Actions:** 
  - Handle all DB writes (Create, Update, Delete) via Next.js Server Actions.
  - Always validate authorization (user roles) at the top of the Server Action.
  - Return standardized response objects: `{ success: boolean, data?: any, error?: string }`.
- **Client Components:**
  - Keep `"use client"` files as small as possible. Use them only when interactivity or client-side hooks (`useState`, `useEffect`, `useForm`) are required.
- **Error Handling:** 
  - Fail gracefully.
  - Catch database errors in Server Actions and return human-readable error messages.
  - Use `sonner` toasts on the client to communicate success and failure states to the user.
