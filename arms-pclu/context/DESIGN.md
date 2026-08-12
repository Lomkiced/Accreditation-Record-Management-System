# Design System & Guidelines

## Branding Identity
The Accreditation Record Management System (ARMS) design is crafted to be professional, trustworthy, and highly usable for academic faculty and administrators. The interface avoids clutter, focusing on clarity, speed, and intuitive navigation.

## Theme
- **Base:** Light mode optimized (with built-in dark mode variables for future scalability).
- **Background:** `#F8FAFC` (Slate 50) for the main application canvas, providing a soft contrast against white content cards.

## Colors
Our color palette leverages Tailwind's Slate and Blue palettes to convey an academic and administrative tone.

- **Primary (Brand):** 
  - Base: `#3B82F6` (Blue 500)
  - Hover: `#2563EB` (Blue 600)
- **Navy (Layout & Typography):**
  - Default: `#0F172A` (Slate 900)
  - Light: `#1E293B` (Slate 800)
  - Lighter: `#334155` (Slate 700)
- **Semantic Colors:**
  - Destructive: `hsl(0 84.2% 60.2%)`
  - Muted: `hsl(210 40% 96.1%)`
  - Border: `hsl(214.3 31.8% 91.4%)`

## Typography
- **Primary Font:** Inter (Google Fonts)
- The typography hierarchy emphasizes readability, utilizing weights (300, 400, 500, 600, 700, 800) to establish clear distinction between headers, sub-headers, and body text.
- Anti-aliasing is enabled globally for crisp rendering.

## Spacing & Layout
The application follows a standard dashboard layout structure defined in `globals.css`:
- **Sidebar:** Fixed at `240px` width on the left (`.sidebar-fixed`).
- **Header:** Fixed at `64px` height at the top, offsetting the sidebar (`.header-fixed`).
- **Main Content:** Offsets both sidebar and header (`.main-content`), ensuring content is always accessible.
- **Max Width:** Content within pages is constrained to `1400px` (`.page-content`) to maintain readability on ultra-wide displays.

## Common UI Components
We utilize custom classes for repeated UI patterns to ensure consistency:
- **Cards (`.arms-card`):** White background, rounded corners (`xl`), subtle slate border, and light shadow.
- **Statistics (`.stat-number`):** Large text (3xl), bold font weight, deep slate color.
- **Scrollbars:** Custom minimal scrollbar styling (`4px` width, `#CBD5E1` thumb) to replace default browser scrollbars for a premium feel.

## Animations
Micro-animations are utilized to enhance the user experience without being distracting.
- Using `tailwindcss-animate` and `framer-motion` for smooth transitions on dropdowns, dialogs, and route changes.
- Hover states always include a brief transition (e.g., `transition-colors duration-200`).

## Accessibility
- All interactive components are built on top of Radix UI primitives (`@radix-ui/react-*`), ensuring out-of-the-box keyboard navigation, screen reader support, and focus management.
- Focus rings are prominent and use the primary brand color to clearly indicate the currently focused element.
