# Design System & Guidelines

## Branding Identity

**ARMS — Accreditation Record Management System** for Polytechnic College of La Union (PCLU).

The design conveys **professionalism, trustworthiness, and academic authority** while remaining highly usable for non-technical faculty members. The interface prioritizes **clarity, speed, and zero-ambiguity workflows** — every screen should tell the user exactly what to do next.

### Design Principles
1. **Clarity Over Creativity** — Every element serves a purpose. No decorative clutter.
2. **Progressive Disclosure** — Show essentials first; details on demand (accordions, drill-downs).
3. **Consistent Feedback** — Every action (upload, approve, delete) provides immediate visual + toast feedback.
4. **Accessibility First** — All components built on Radix primitives; keyboard-navigable; WCAG 2.1 AA compliant.

---

## Theme

| Property       | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Mode           | **Light** (primary), dark mode variables available for future use  |
| Canvas BG      | `#F8FAFC` (Slate 50) — soft contrast against white content cards   |
| Card BG        | `#FFFFFF` with `border: 1px solid #E2E8F0` and subtle `shadow-sm` |
| Border Radius  | `--radius: 0.5rem` (8px). Cards use `rounded-xl` (12px).          |

---

## Colors

### Brand Palette

| Token          | Value       | Usage                                     |
| -------------- | ----------- | ----------------------------------------- |
| `brand`        | `#3B82F6`   | Primary buttons, links, active states     |
| `brand-hover`  | `#2563EB`   | Button hover, link hover                  |
| `navy`         | `#0F172A`   | Sidebar background, heavy headings        |
| `navy-light`   | `#1E293B`   | Sidebar hover states                      |
| `navy-lighter` | `#334155`   | Secondary text in sidebar                 |

### Semantic Colors

| Token             | Value                  | Usage                                  |
| ----------------- | ---------------------- | -------------------------------------- |
| `primary`         | `hsl(221.2 83.2% 53.3%)` | Focus rings, primary actions        |
| `destructive`     | `hsl(0 84.2% 60.2%)`  | Delete buttons, error states           |
| `muted`           | `hsl(210 40% 96.1%)`  | Disabled states, secondary backgrounds |
| `border`          | `hsl(214.3 31.8% 91.4%)` | All borders                         |

### Status Colors (Mapping Workflow)

| Status          | Background          | Text              | Usage                 |
| --------------- | ------------------- | ----------------- | --------------------- |
| Draft           | `bg-slate-100`      | `text-slate-600`  | Unmapped / initial    |
| Submitted       | `bg-blue-100`       | `text-blue-700`   | Awaiting review       |
| Under Review    | `bg-amber-100`      | `text-amber-700`  | Being evaluated       |
| Approved        | `bg-emerald-100`    | `text-emerald-700`| Completely provided   |
| Returned        | `bg-red-100`        | `text-red-700`    | Needs revision        |

### Compliance Progress Colors

| Range        | Color          | Label            |
| ------------ | -------------- | ---------------- |
| 100%         | `emerald-500`  | Complete         |
| 50% – 99%   | `blue-500`     | In Progress      |
| 0% – 49%    | `red-500`      | Needs Attention  |

---

## Typography

| Property         | Value                                                |
| ---------------- | ---------------------------------------------------- |
| Primary Font     | **Inter** (Google Fonts CDN)                         |
| Fallback Stack   | `Inter, sans-serif`                                  |
| Weights Used     | 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold), 800 (extra-bold) |
| Rendering        | `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale` |

### Type Scale

| Element               | Class / Size                         | Weight    |
| --------------------- | ------------------------------------ | --------- |
| Page Title (H1)       | `text-xl font-bold`                  | 700       |
| Section Header (H2)   | `text-base font-semibold`            | 600       |
| Card Header (H3)      | `font-semibold text-slate-800`       | 600       |
| Body Text              | `text-sm text-slate-700`             | 400       |
| Caption / Subtitle     | `text-xs text-slate-500`             | 400–500   |
| Stat Number            | `text-3xl font-bold text-slate-900`  | 700       |
| Badge / Pill           | `text-[10px] font-bold`             | 700       |

---

## Spacing & Layout

### Dashboard Layout (Fixed)

```
┌──────────────────────────────────────────────┐
│ Sidebar (240px fixed, full height, z-40)     │
├──────────────────────────────────────────────┤
│ Header (64px fixed, left: 240px, z-30)       │
├──────────────────────────────────────────────┤
│ Main Content (ml: 240px, pt: 64px)           │
│   └── .page-content (p-6, max-w-[1400px])   │
└──────────────────────────────────────────────┘
```

### Spacing Tokens

| Token        | Value  | Usage                                      |
| ------------ | ------ | ------------------------------------------ |
| `p-4` / `p-5`| 16–20px | Card padding                              |
| `gap-3`      | 12px   | Flex/grid gaps between cards               |
| `gap-4`      | 16px   | Section spacing                            |
| `mb-6`       | 24px   | Between major dashboard sections           |
| `space-y-4`  | 16px   | Vertical stack spacing                     |

---

## Component Standards

### Cards (`.arms-card`)
```css
.arms-card {
  @apply bg-white rounded-xl border border-slate-200 shadow-sm;
}
```

### Custom Scrollbars
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
```

### Buttons
- **Primary**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Ghost**: `variant="ghost"` from shadcn/ui
- **Destructive**: `bg-red-600 hover:bg-red-700 text-white`
- **Outline**: `variant="outline"` with contextual border color

### Badges / Pills
- Status: `text-[10px] font-bold px-2 py-0.5 rounded-full border`
- Count: `text-xs font-semibold px-2.5 py-1 rounded-full`

---

## Animations

### Motion Library
- **framer-motion**: Used for progress bar fills, accordion expand/collapse, compliance rings.
- **tailwindcss-animate**: Used for dialog/dropdown enter/exit transitions.

### Guidelines
- All hover states use `transition-colors duration-200`.
- Progress bars: `duration: 1s, ease: "easeOut"` with staggered delays.
- Accordions: `duration: 0.2s, ease: "easeInOut"`.
- Never use animation for critical UI feedback (errors, confirmations) — use immediate visual change.

---

## Accessibility

| Requirement              | Implementation                                              |
| ------------------------ | ----------------------------------------------------------- |
| Keyboard Navigation      | All interactive elements built on Radix UI primitives       |
| Focus Indicators         | Prominent focus rings using primary brand color              |
| Screen Reader Support    | Semantic HTML, ARIA labels via Radix, descriptive tooltips   |
| Color Contrast           | WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for large text)   |
| Touch Targets            | Minimum 44x44px for interactive elements                     |
| Form Validation          | Inline error messages below inputs; `aria-invalid` states   |

---

## Anti-Patterns (Avoid)

- ❌ Generic browser-default fonts — always use Inter.
- ❌ Raw hex colors — use Tailwind semantic tokens (`text-slate-700`, not `#334155`).
- ❌ Inline styles — use Tailwind classes or CSS custom properties.
- ❌ Decorative animations that delay user actions.
- ❌ Placeholder images — generate or use real content.
- ❌ Inconsistent border-radius — cards: `rounded-xl`, pills: `rounded-full`, inputs: `rounded-md`.

---

## High-Volume Archive UI Pattern

When presenting archived records (e.g., Faculty Archives):
- **Streamlined Stats**: Single prominent, professional counter card/pill for **Total Archived Documents** (eliminating secondary clutter such as storage size and activity timestamps).
- **Search & Filter Controls**:
  - Full-width search bar with leading search icon and instant clear button (`✕`).
  - Sort selector: Date Archived, Title, File Size.
  - View mode toggle: High-Density Data Table vs. Responsive Grid Cards.
- **Pagination Standard**:
  - Bottom-anchored pagination with item range indicator (`Showing 1 to 12 of 148 documents`).
  - Page size selector (`12 / 24 / 48 per page`).
  - First, Previous, Next, Last and numbered buttons with active highlight (`bg-blue-600 text-white`).
- **Empty & No-Result States**: Distinct visual feedback and clear action for "No documents archived" vs. "No documents match your search".

---

## Global Search UI Pattern

The top navigation header features an omni-search modal (`Cmd+K` or search button):
- **Unified Query**: Searches across both documents and faculty members.
- **Grouped Presentation**: Clean section headers separating **Documents** and **Faculty Members** with result counts.
- **Rich Result Items**:
  - Documents display title, status pill, area name, faculty uploader, and date.
  - Faculty members display avatar initials, full name, department, designation, and assigned areas count.
- **Direct Actions**: Clicking a document opens/previews the file; clicking a faculty member displays their contact info or navigates to assignments/profile.

---

## Institutional PDF Export Standards

Accreditation PDF exports must adhere to formal institutional publication standards:
- **Configuration Panel**: Labeled with accessible, clear terminology ("Report Settings") rather than technical parameter jargon.
- **Primary Header**: Polytechnic College of La Union (PCLU) centered navy header (`#0F172A`), subtitle "Accreditation Record Management System (ARMS)".
- **Color Accent**: Deep Navy (`#0F172A`) header bars with white bold text; alternate rows in soft slate tint (`#F8FAFC`).
- **Typography**: Clean Helvetica/Arial tabular fonts with strict cell padding and text truncation to avoid overflow.
- **Metadata Summary**: 2-column or 3-column key-value grid for Scope, Date Range, Generated By, and Total Record Count.
- **Official Certification Footer**: "Official PCLU Accreditation Record - Non-Editable Document" with page numbering "Page X of Y" and system generation timestamp.

---

## Task Assignment Modal Standards

When assigning accreditation responsibilities to faculty:
- **Spacious Width**: Minimum `sm:max-w-[680px]` to comfortably display verbose PACUCOA criterion names without artificial truncation or badge overlap.
- **Explicit Scope Selector Cards**: Clear two-card toggle between **Entire Area** and **Specific Criteria**, preventing user confusion over whether unselected criteria imply whole-area delegation.
- **Collision Feedback**: Clear contextual alert banners and disabled states when an area or individual criteria are already delegated to other faculty members.
- **Criterion Item Design**: Multi-line natural word wrapping with `items-start` top-aligned checkboxes, hover state elevation, distinct assigned-state badges, and batch selection links ("Select all" / "Clear").

---

## Streamlined Users Table Standards

- **Core Academic Columns**: Displays Name (with avatar initials and email), Role badge, Department, Designation, and Status badge.
- **Zero Technical Latency**: Omit volatile and inaccurate authentication sync timestamps (`lastLogin`) to ensure instantaneous table rendering and uncluttered, readable user administration.

