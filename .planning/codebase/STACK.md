---
generated: 2026-04-02
focus: tech
---

# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.x — All application code (`src/**/*.ts`, `src/**/*.tsx`)
- JavaScript (ES modules) — Utility scripts (`scripts/supabase-keepalive.mjs`)

## Runtime

**Environment:**
- Node.js 20.x (specified in GitHub Actions workflow)

**Package Manager:**
- pnpm (version 10 in CI, `pnpm/action-setup@v4`)
- Lockfile: present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- Next.js `15.5.14` — Full-stack framework, App Router, Server Actions
- React `19.1.0` — UI library (exact version pinned)
- React DOM `19.1.0` — DOM renderer (exact version pinned)

**Build/Dev:**
- Turbopack — Not explicitly enabled; no `--turbopack` flag in dev script
- TypeScript `^5` — Strict mode enabled (`"strict": true` in `tsconfig.json`)
- ESLint `^9` with `eslint-config-next 15.5.14` — Linting (`pnpm lint`)
- Vitest `^4.1.2` — Test runner (`pnpm test`)
- Drizzle Kit `^0.31.10` — Database migrations CLI

## Key Dependencies

### Framework & UI
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `15.5.14` | App framework |
| `react` | `19.1.0` | UI library |
| `react-dom` | `19.1.0` | DOM rendering |
| `tailwindcss` | `^4` | Utility-first CSS |
| `@tailwindcss/postcss` | `^4` | PostCSS integration for Tailwind v4 |
| `clsx` | `^2.1.1` | Conditional class names |
| `tailwind-merge` | `^3.5.0` | Class merge without conflicts |
| `lucide-react` | `^1.7.0` | SVG icon library |
| `sonner` | `^2.0.7` | Toast notifications |
| `date-fns` | `^4.1.0` | Date formatting utilities |

### Rich Text Editor
| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/react` | `^3.21.0` | React adapter for TipTap |
| `@tiptap/starter-kit` | `^3.21.0` | Core editor extensions (bold, italic, headings, etc.) |
| `@tiptap/extension-image` | `^3.21.0` | Image node extension |
| `@tiptap/extension-placeholder` | `^3.21.0` | Placeholder text |
| `@tiptap/extension-table-of-contents` | `^3.21.0` | Auto-generated TOC from headings |
| `@tiptap/extension-underline` | `^3.21.0` | Underline formatting |
| `@tiptap/pm` | `^3.21.0` | ProseMirror bindings |

### PDF Generation
| Package | Version | Purpose |
|---------|---------|---------|
| `@react-pdf/renderer` | `^4.3.2` | Primary PDF engine (interior + cover PDFs) |

### Document Import
| Package | Version | Purpose |
|---------|---------|---------|
| `mammoth` | `^1.12.0` | `.docx` → HTML conversion |
| `pdfjs-dist` | `^5.6.205` | PDF text extraction (legacy build used server-side) |

### Database
| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.45.2` | ORM with type-safe query builder |
| `postgres` | `^3.4.8` | PostgreSQL driver (used by Drizzle) |
| `drizzle-kit` | `^0.31.10` | Migration generation and management |

### Storage & External Services
| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.101.1` | Supabase Storage SDK (admin client) |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `nanoid` | `^5.1.7` | Unique ID generation for uploaded files |
| `slugify` | `^1.6.8` | String slugification |
| `zod` | `^4.3.6` | Runtime schema validation |
| `archiver` | `^7.0.1` | ZIP archive creation for export bundles |
| `server-only` | `^0.0.1` | Prevents server modules from running on client |

### Drag-and-Drop
| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | `^6.3.1` | Core drag-and-drop primitives |
| `@dnd-kit/sortable` | `^10.0.0` | Sortable list preset |
| `@dnd-kit/utilities` | `^3.2.2` | DnD helper utilities |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^4.1.2` | Test runner |
| `@vitejs/plugin-react` | `^6.0.1` | React support in Vitest |
| `@testing-library/react` | `^16.3.2` | React component testing utilities |
| `@testing-library/jest-dom` | `^6.9.1` | Custom DOM matchers |
| `jsdom` | `^29.0.1` | DOM simulation environment |

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript — strict mode, `bundler` module resolution, `@/*` path alias to `./src/*` |
| `next.config.ts` | Next.js — `sql.js` as server-external package, browser fallbacks for `fs/path/module` disabled |
| `drizzle.config.ts` | Drizzle Kit — PostgreSQL dialect, schema at `src/infrastructure/db/schema/index.ts`, migrations at `./drizzle` |
| `vitest.config.ts` | Vitest — jsdom environment, setup file at `tests/setup.ts`, `@` alias to `./src` |
| `postcss.config.mjs` | PostCSS — `@tailwindcss/postcss` plugin only |
| `.env.local` | Local environment variables (present, not committed) |
| `.github/workflows/supabase-keepalive.yml` | Scheduled CI keepalive for Supabase free-tier connection |

## TypeScript Configuration

```json
{
  "strict": true,
  "target": "ES2017",
  "module": "esnext",
  "moduleResolution": "bundler",
  "jsx": "preserve",
  "paths": { "@/*": ["./src/*"] }
}
```

Path alias `@/` maps to `src/` — used consistently across all imports.

## Environment Variables

| Variable | Required | Used In |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `src/infrastructure/db/client.ts`, `drizzle.config.ts`, `scripts/supabase-keepalive.mjs` |
| `SUPABASE_URL` | Yes (or `NEXT_PUBLIC_SUPABASE_URL`) | `src/lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Fallback for `SUPABASE_URL` | `src/lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `src/lib/supabase.ts` (admin storage operations) |

No `.env.example` file present — variables are documented only in source code and CI config.

## Notable Webpack Configuration

`next.config.ts` marks `sql.js` as a server-external package to prevent it from being bundled by webpack. Browser-side fallbacks for `fs`, `path`, and `module` are set to `false` to avoid bundling Node built-ins on the client.

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm 10+
- PostgreSQL-compatible database (Supabase recommended)

**Production:**
- Vercel (inferred from Next.js 15 + Supabase setup)
- Supabase project for PostgreSQL + Storage
- `maxDuration = 300` set on PDF generation routes (requires Vercel Pro for >60s)

---

*Stack analysis: 2026-04-02*
