# 🎨 Frontend Redesign Prompt — "Gestion" School Management Platform (Vue.js)

---

## Context

I have a fully functional Vue.js school management web app called **Gestion**. It currently covers:

- **Authentication** — Login, Forgot Password, Reset Password, Welcome splash screen
- **Admin role** — Dashboard (stats + recent users), Department Management (CRUD), Course Management (CRUD), User Management (CRUD with role switching, activate/deactivate)
- **Teacher / formateur_principal role** — Hours Management (record hours entries, CRUD), Courses view, Department view, Users view
- **Student / étudiant role** — "Mes heures de cours" (hours summary with bar + pie charts, filters, PDF export)

The app uses a **role-based navigation** system: the navbar items change depending on whether the logged-in user is `admin`, `formateur`, `formateur_principal`, or `etudiant`.

The backend and all logic are complete and working. **Only the frontend presentation layer needs to be redesigned.** Do not change any API calls, route names, data structures, store logic, or component business logic — only markup, styles, layout, and visual components.

---

## Design Mandate

Redesign every page and component to feel **fresh, modern, and professional** — like a 2025 SaaS dashboard product. The redesign must be:

- **Inspired by the existing layout** (don't reinvent the information architecture — keep the same pages, same flows, same data tables)
- **Consistent across all roles and all pages** (same design language from login to dashboard to hours management)
- **Light/Dark mode ready** — implement a toggle (stored in localStorage or Pinia), with a carefully designed dark palette (not just color inversion)
- **Fully responsive** — mobile-first, works on tablet and desktop

Use **PrimeVue** (latest v4) as the component library with the **Aura or Lara preset**, supplemented by **TailwindCSS** utility classes for layout and spacing.

---

## Page-by-Page Redesign Instructions

### 1. Welcome / Splash Screen
- Full-screen gradient background (keep the soft blue-purple blobs concept but make it richer)
- Animated logo entrance (fade + slide up)
- Auto-redirect to Login after 1.5s or show a subtle "Enter" CTA button

### 2. Login Page
- Keep the two-panel split layout (left branding panel + right form panel)
- Left panel: bold gradient (blue → indigo), app logo, tagline, 3 feature bullets with animated icons
- Right panel: clean card with `PrimeVue InputText`, `Password` component (with show/hide toggle), and a styled primary `Button`
- Add a smooth loading state on the Sign In button
- Consistent brand font (suggest: Inter or Plus Jakarta Sans via Google Fonts)

### 3. Forgot Password & Reset Password
- Centered card, same background as Login (gradient blobs)
- Use a `Stepper` or visual progress indicator (Step 1: Enter email → Step 2: Enter code + new password)
- PrimeVue `InputOtp` for the reset code input if applicable
- Clear validation feedback inline (not just alert popups)

### 4. Main Layout (post-login shell)
Replace the current top-only navbar with a **hybrid layout**:
- **Collapsible left sidebar** (icon + label, collapses to icon-only on toggle) using PrimeVue `PanelMenu` or a custom nav
- **Top bar** remains for: app logo/name, global search (optional), light/dark toggle, user avatar + name, logout button
- Sidebar sections adapt to the user's role (admin sees Departments/Courses/Users; teacher sees Courses/Hours/Users; student sees Departments/Courses/Hours)
- Active route is highlighted with a colored left border accent + background fill
- Sidebar footer: user avatar, name, role badge, logout icon

### 5. Dashboard (Admin)
- Stat cards: redesign the 3 counters (Utilisateurs / Départements / Cours) as elevated `Card` components with an icon, colored accent bar, and a subtle trend indicator
- "Utilisateurs récents" section: transform the plain list into a proper `DataTable` with avatar initials, role badge (colored by role), and a quick-action "View" button
- Add a welcome banner with the admin's name and today's date

### 6. Department Management
- Replace the raw HTML table with a PrimeVue `DataTable` with: sorting, a global search/filter input, row hover highlight
- "Create Department" opens a `Dialog` / `Drawer` panel instead of expanding inline on the same page (cleaner UX)
- Edit and Delete buttons replaced with icon buttons (`Button` with `icon` prop only) inside a `ButtonGroup` or `SplitButton`
- Empty state illustration when no departments exist

### 7. Course Management
- Same pattern as Department Management: `DataTable` + `Dialog` for create/edit
- Add a `Tag` component to display the department name as a colored badge
- Student count displayed with a small `Badge` component

### 8. User Management
- `DataTable` with: avatar initials column, role `Tag` (color-coded: admin=red, formateur=blue, formateur_principal=indigo, etudiant=green), status badge (Active=green, Inactive=grey)
- Inline role-change `Select` replaced with a proper `Dialog`-based edit form
- Activate/Deactivate as a `ToggleSwitch` component
- Delete with a `ConfirmDialog` (PrimeVue) instead of a plain browser confirm

### 9. Hours Management (Teacher view — record + list)
- Two-column layout preserved: left = form card, right = entries table
- Form: PrimeVue `Select` for course, `DatePicker`, `InputNumber` for hours, `Textarea` for description
- Entries table: PrimeVue `DataTable` with inline edit (pencil opens a `Popover` or `Dialog`)
- Row delete with `ConfirmPopover`

### 10. Hours Management (Student view — stats)
- Move the "Mes heures de cours" stat block to the top as a hero card (Total hours, big number, gradient accent)
- Filters row: PrimeVue `Select` + `DatePicker` range + Export PDF button (styled with icon)
- Charts: replace native Chart.js with PrimeVue `Chart` wrappers, style with brand colors
- Course cards at the bottom: use `Card` components with a colored icon, course name, and hour count

---

## Global Design System Rules

- **Primary color**: Blue `#3B82F6` (Tailwind blue-500) — use for CTAs, active states, links
- **Accent / secondary**: Indigo `#6366F1` — use for role badges, highlights
- **Typography**: Inter (Google Fonts), sizes: heading `text-2xl font-bold`, subheading `text-lg font-semibold`, body `text-sm`
- **Border radius**: `rounded-xl` for cards, `rounded-lg` for inputs and buttons
- **Shadows**: `shadow-sm` default, `shadow-md` on hover for interactive cards
- **Spacing**: consistent 24px page padding, 16px between cards, 8px between form fields
- **Dark mode**: background `#0F172A` (slate-900), card `#1E293B` (slate-800), text `#F1F5F9` (slate-100)
- **Transitions**: all hover/focus states with `transition-all duration-200`
- **Empty states**: every list/table has an illustrated or icon-based empty state message
- **Toast notifications**: replace all `alert()` calls with PrimeVue `Toast` (top-right, auto-dismiss 3s)

---

## Tech Stack Constraints

- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router 4** (existing routes unchanged)
- **Pinia** (existing stores unchanged)
- **PrimeVue v4** with Aura or Lara theme preset
- **TailwindCSS v3** for layout utilities
- **Chart.js** via PrimeVue Chart component wrapper
- No changes to axios calls, API endpoints, or store actions/getters

---

## Deliverable

Refactor all `.vue` files (pages + layout components + shared components) to implement the above. Produce:
1. An updated `App.vue` and `MainLayout.vue` with the new sidebar + topbar shell
2. All page components restyled (no logic changes)
3. A `useTheme.js` composable (or Pinia store) for light/dark mode
4. Any new shared components needed (e.g. `StatCard.vue`, `PageHeader.vue`, `EmptyState.vue`)
