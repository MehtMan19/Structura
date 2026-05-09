# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # Install dependencies (or pnpm install)
npm run dev    # Start Vite dev server
npm run build  # Production build
```

No test runner is configured. No lint command is configured.

## Architecture

**Structura** is a frontend-only React SPA for legal contract management and negotiation. All deal data is currently mocked within component files — there is no backend or API integration (Supabase is noted as a future integration for Precedents/Market Clauses pages).

### Routing (`src/app/routes.tsx`)
- `/` → Dashboard (Deal Desk with KPI metrics, charts)
- `/active-deals` → Active Deals list with filtering
- `/deal/:id` → Deal Workspace (redline negotiation view)
- `/precedents` → Placeholder (Supabase integration needed)
- `/market` → Placeholder (historical deals data needed)

### Layout (`src/app/components/Layout.tsx`)
Persistent dark sidebar (slate-900) + main content area. All pages render inside this layout.

### Key Pages
- **Dashboard**: Recharts bar/pie charts, deal summary table with risk filtering, stats cards
- **ActiveDeals**: Searchable/filterable deal list, starred deals toggle
- **DealWorkspace**: Clause-by-clause redline view with AI suggestions panel (two tabs: Copilot / Power), version history, risk indicators per clause

### Tech Stack
- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS 4** (configured via `@tailwindcss/vite` plugin, not PostCSS)
- **shadcn/ui** over **Radix UI** primitives — 46 components in `src/app/components/ui/`
- **React Router 7** for routing
- **Recharts** for data visualization
- **Lucide React** for icons
- **Motion.js** for animations

### Styling
- Design tokens (OKLCH colors, border radius, chart colors, sidebar palette) are in `src/styles/theme.css` as CSS variables — never hardcode colors
- `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) for conditional class names
- Dark mode is supported via `next-themes`

### State Management
No global state library. All state is local `useState` within components. Mock deal data lives inside the page components themselves.
