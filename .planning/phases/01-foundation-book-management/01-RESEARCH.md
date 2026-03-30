# Phase 1: Foundation & Book Management - Research

**Researched:** 2026-03-30
**Domain:** Next.js 15.5 App Router + Drizzle ORM + SQLite + KDP Specification Registry
**Confidence:** HIGH

## Summary

Phase 1 is the greenfield foundation for the entire Publik application. It encompasses: scaffolding the Next.js project, setting up the database with Drizzle ORM + SQLite, building a centralized KDP specification registry (trim sizes, paper types, ink types, cover finishes, margins, bleed), and implementing Book CRUD with a dashboard UI. This phase establishes every architectural pattern that subsequent phases will follow.

The most critical research finding is that KDP specifications (trim sizes, paper/ink options, margin tables, bleed calculations, spine width formulas) are now fully verified from the official KDP help center (scraped successfully on 2026-03-30). The margin values previously flagged as LOW confidence in STATE.md are now **HIGH confidence** — they match the official KDP documentation exactly. The specification registry must be the first domain module built because every future phase (content editor, PDF generation, cover generation) reads from it.

**Primary recommendation:** Build the KDP spec registry as a pure TypeScript module in `src/domain/kdp/` with zero framework dependencies, then layer Drizzle ORM schema, Server Actions, and UI on top.

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase — this is a greenfield phase with no prior user decisions constraining the research scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOOK-01 | User can create a new book project with a title | Drizzle schema + Server Actions + form UI pattern |
| BOOK-02 | User can edit book project details (title, description) | Server Actions with Zod validation, optimistic UI |
| BOOK-03 | User can delete a book project | Soft delete pattern with confirmation dialog |
| BOOK-04 | User can select trim size from KDP-supported options | KDP spec registry with 17 paperback trim sizes (official data) |
| BOOK-05 | User can select paper type (white/cream) and ink type (B&W/color) | KDP spec registry: 4 ink/paper combos with page count limits |
| BOOK-06 | User can select cover finish (glossy/matte) | Simple enum field on book model |
| UX-01 | User can see a dashboard listing all book projects | Next.js App Router page with Server Component data fetching |
| UX-03 | UI is in English | All UI strings in English; no i18n needed for v1 |
</phase_requirements>

## Standard Stack

### Core (Phase 1 only — subset of full stack)
| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| Next.js | 15.5.14 | Full-stack web framework | Latest 15.5 patch; App Router, Server Actions, Server Components |
| React | 19.x | UI library | Ships with Next.js 15.5 |
| TypeScript | 5.x | Type safety | Next.js first-class support |
| Tailwind CSS | 4.2.2 | Styling | Latest v4, stable |
| Drizzle ORM | 0.45.2 | Database ORM | TypeScript-first, SQLite support |
| better-sqlite3 | 12.8.0 | SQLite driver | Synchronous, zero-config, perfect for dev |
| drizzle-kit | 0.31.10 | Schema migrations | `push` for dev, `generate` + `migrate` for prod |
| zod | 4.3.6 | Runtime validation | Form validation, Drizzle integration via drizzle-zod |
| lucide-react | 1.7.0 | Icon library | Tree-shakeable SVG icons |
| sonner | 2.0.7 | Toast notifications | Save/delete confirmations |
| clsx | 2.1.1 | Class name utility | Conditional class composition |
| tailwind-merge | 3.5.0 | Tailwind class merging | Prevents class conflicts with `cn()` utility |
| date-fns | 4.1.0 | Date formatting | Created/modified timestamps |
| @types/better-sqlite3 | 7.6.13 | TypeScript types for SQLite | Type safety for database driver |

### NOT installed in Phase 1 (deferred)
| Library | Reason | Phase |
|---------|--------|-------|
| TipTap | Content editor not needed until Phase 2 | Phase 2 |
| @react-pdf/renderer | PDF generation not needed until Phase 6 | Phase 6 |
| mammoth | Document import not needed until Phase 3 | Phase 3 |
| Better Auth | Auth not needed for personal/single-user dev | Phase TBD |
| uploadthing | File upload not needed until Phase 5 | Phase 5 |
| pdf-lib | PDF post-processing not needed until Phase 6 | Phase 6 |

**Installation:**
```bash
# Scaffold Next.js project
pnpm create next-app@15.5 . --typescript --tailwind --eslint --app --src-dir

# Database
pnpm add drizzle-orm better-sqlite3
pnpm add -D drizzle-kit @types/better-sqlite3

# Validation & utilities
pnpm add zod lucide-react sonner clsx tailwind-merge date-fns
```

**Version verification:** All versions verified against npm registry on 2026-03-30. Next.js 15.5.14 is the latest 15.5.x patch. Latest overall is 16.2.1 but we use 15.5 per stack decision.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js 15.5 | Next.js 16.x | Breaking changes (async params, caching semantics), less community resources |
| Drizzle ORM | Prisma | Heavier binary, slower cold starts; Drizzle is lighter for SQLite |
| SQLite | PostgreSQL from day 1 | Adds infrastructure complexity for personal tool |

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)
```
src/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (English, Tailwind, sonner)
│   ├── page.tsx                 # Redirect to /dashboard
│   ├── (dashboard)/             # Route group for dashboard
│   │   ├── layout.tsx           # Dashboard layout (sidebar/nav)
│   │   ├── page.tsx             # Book list (UX-01)
│   │   ├── books/
│   │   │   ├── new/page.tsx     # Create book form (BOOK-01)
│   │   │   └── [bookId]/
│   │   │       ├── page.tsx     # Book overview/edit (BOOK-02)
│   │   │       └── actions.ts   # Server Actions for book CRUD
│   │   └── ...
│   └── api/                     # (minimal — Server Actions preferred)
│
├── domain/                      # Framework-agnostic business logic
│   ├── kdp/                     # KDP specification registry
│   │   ├── trim-sizes.ts        # All 17 paperback trim sizes
│   │   ├── paper-types.ts       # White/cream paper, B&W/color ink options
│   │   ├── cover-finishes.ts    # Glossy/matte enum
│   │   ├── margins.ts           # Margin calculation by page count + bleed
│   │   ├── bleed.ts             # Bleed calculation
│   │   └── index.ts             # Re-exports
│   └── book/                    # Book entity
│       ├── book.ts              # Book type definitions
│       └── book-validator.ts    # Zod schemas for create/update
│
├── infrastructure/              # Database & config
│   ├── db/
│   │   ├── client.ts            # Drizzle + better-sqlite3 connection
│   │   ├── schema/
│   │   │   ├── books.ts         # Books table definition
│   │   │   └── index.ts         # Re-exports all schemas
│   │   └── seed.ts              # Optional seed data
│   └── drizzle.config.ts        # Drizzle Kit configuration
│
├── components/                  # React UI components
│   ├── ui/                      # Shared UI primitives (cn(), button, input, etc.)
│   ├── books/                   # Book-specific components
│   │   ├── book-card.tsx        # Book card for dashboard grid
│   │   ├── book-form.tsx        # Create/edit book form
│   │   ├── delete-book-dialog.tsx  # Confirmation dialog
│   │   └── kdp-options-form.tsx # Trim size, paper, ink, cover finish selectors
│   └── layout/                  # Dashboard layout components
│       ├── sidebar.tsx
│       └── header.tsx
│
└── lib/
    ├── utils.ts                 # cn() utility (clsx + tailwind-merge)
    └── constants.ts             # App-wide constants
```

### Pattern 1: Server Actions for CRUD

**What:** Use Next.js Server Actions instead of API routes for all mutations. Server Actions provide type safety, progressive enhancement, and simpler code than REST endpoints.

**When to use:** All data mutations (create, update, delete books).

**Example:**
```typescript
// src/app/(dashboard)/books/[bookId]/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { eq } from "drizzle-orm"
import { bookUpdateSchema } from "@/domain/book/book-validator"

export async function updateBook(bookId: string, formData: FormData) {
  const validated = bookUpdateSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    trimSizeId: formData.get("trimSizeId"),
    paperType: formData.get("paperType"),
    inkType: formData.get("inkType"),
    coverFinish: formData.get("coverFinish"),
  })

  await db.update(books).set(validated).where(eq(books.id, bookId))
  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/books/${bookId}`)
}
```

### Pattern 2: KDP Specification Registry (Pure TypeScript)

**What:** All KDP formatting rules live in `src/domain/kdp/` as exported constants and pure functions. Zero framework dependencies. Importable from anywhere — Server Actions, client components, test files.

**When to use:** Any code that needs KDP dimensions, constraints, or calculations.

**Example:**
```typescript
// src/domain/kdp/trim-sizes.ts

export interface TrimSize {
  id: string
  label: string          // Display name: "6\" x 9\""
  widthIn: number        // Width in inches
  heightIn: number       // Height in inches
  widthCm: number        // Width in cm
  heightCm: number       // Height in cm
  isLarge: boolean       // >6.12" width OR >9" height
  maxPages: Record<PaperInkCombo, number>
}

export type PaperInkCombo =
  | "bw-white"
  | "bw-cream"
  | "standard-color-white"
  | "premium-color-white"

export const KDP_TRIM_SIZES: TrimSize[] = [
  {
    id: "5x8",
    label: '5" × 8"',
    widthIn: 5, heightIn: 8,
    widthCm: 12.7, heightCm: 20.32,
    isLarge: false,
    maxPages: {
      "bw-white": 828, "bw-cream": 776,
      "standard-color-white": 600, "premium-color-white": 828,
    },
  },
  // ... all 17 sizes from official KDP docs
]
```

```typescript
// src/domain/kdp/margins.ts

export type BleedSetting = "bleed" | "no-bleed"

export interface MarginSet {
  insideIn: number   // gutter margin
  outsideIn: number  // minimum outside margin
  topIn: number      // minimum top margin
  bottomIn: number   // minimum bottom margin
}

export function getMargins(pageCount: number, bleed: BleedSetting): MarginSet {
  const outsideMin = bleed === "bleed" ? 0.375 : 0.25

  let inside: number
  if (pageCount <= 150) inside = 0.375
  else if (pageCount <= 300) inside = 0.5
  else if (pageCount <= 500) inside = 0.625
  else if (pageCount <= 700) inside = 0.75
  else inside = 0.875

  return {
    insideIn: inside,
    outsideIn: outsideMin,
    topIn: outsideMin,
    bottomIn: outsideMin,
  }
}
```

### Pattern 3: Drizzle Schema with SQLite

**What:** Define the books table using Drizzle's `sqliteTable` with proper types and constraints.

**When to use:** All database table definitions.

**Example:**
```typescript
// src/infrastructure/db/schema/books.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),           // nanoid or cuid
  title: text("title").notNull(),
  description: text("description"),
  trimSizeId: text("trim_size_id").notNull().default("6x9"),
  paperType: text("paper_type", { enum: ["white", "cream"] }).notNull().default("white"),
  inkType: text("ink_type", { enum: ["bw", "standard-color", "premium-color"] }).notNull().default("bw"),
  coverFinish: text("cover_finish", { enum: ["glossy", "matte"] }).notNull().default("matte"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),         // soft delete
})
```

```typescript
// src/infrastructure/db/client.ts
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

const sqlite = new Database("publik.db")
export const db = drizzle(sqlite, { schema })
```

### Anti-Patterns to Avoid

- **API routes for CRUD:** Use Server Actions instead. They're simpler, type-safe, and require less boilerplate in Next.js 15.
- **Hardcoding KDP specs in components:** All KDP data must live in `src/domain/kdp/` and be imported. Never inline trim sizes or margin values in JSX.
- **Client-side database queries:** Database access is server-only. Use Server Components for reads and Server Actions for writes.
- **Skipping soft delete:** Use a `deletedAt` column instead of hard deletes. Users may accidentally delete books, and recovery is valuable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schemas | Type-safe, composable, integrates with Drizzle via `drizzle-zod` |
| Class name merging | Manual string concatenation | `cn()` from `clsx` + `tailwind-merge` | Prevents Tailwind class conflicts, handles conditional classes |
| Toast notifications | Custom toast system | `sonner` | One-line API, built-in promise states, recommended by shadcn/ui |
| Icon SVGs | Inline SVGs or icon font | `lucide-react` | Tree-shakeable, consistent design, 1500+ icons |
| ID generation | `Math.random()` or `crypto.randomUUID()` | `nanoid` (or cuid) | Shorter, URL-safe, collision-resistant |
| Date formatting | Manual `toLocaleDateString()` | `date-fns` | Lightweight, tree-shakeable, consistent output |

**Key insight:** This phase has minimal complexity — it's CRUD + a data registry. The main risk is over-engineering. Keep it simple: Server Actions + Drizzle + domain constants.

## KDP Specification Registry (Verified Data)

All data below verified from official KDP help pages scraped on 2026-03-30. **Confidence: HIGH.**

### Trim Sizes (Paperback — US marketplace)

| ID | Trim Size | Width (in) | Height (in) | Width (cm) | Height (cm) | Large? | BW White Max | BW Cream Max | Std Color Max | Prem Color Max |
|----|-----------|------------|-------------|------------|-------------|--------|-------------|-------------|---------------|----------------|
| 5x8 | 5" × 8" | 5 | 8 | 12.7 | 20.32 | No | 828 | 776 | 600 | 828 |
| 5.06x7.81 | 5.06" × 7.81" | 5.0625 | 7.8125 | 12.85 | 19.84 | No | 828 | 776 | 600 | 828 |
| 5.25x8 | 5.25" × 8" | 5.25 | 8 | 13.34 | 20.32 | No | 828 | 776 | 600 | 828 |
| 5.5x8.5 | 5.5" × 8.5" | 5.5 | 8.5 | 13.97 | 21.59 | No | 828 | 776 | 600 | 828 |
| 6x9 | 6" × 9" | 6 | 9 | 15.24 | 22.86 | No | 828 | 776 | 600 | 828 |
| 6.14x9.21 | 6.14" × 9.21" | 6.125 | 9.25 | 15.6 | 23.39 | Yes | 828 | 776 | 600 | 828 |
| 6.69x9.61 | 6.69" × 9.61" | 6.6875 | 9.625 | 16.99 | 24.41 | Yes | 828 | 776 | 600 | 828 |
| 7x10 | 7" × 10" | 7 | 10 | 17.78 | 25.4 | Yes | 828 | 776 | 600 | 828 |
| 7.44x9.69 | 7.44" × 9.69" | 7.4375 | 9.6875 | 18.9 | 24.61 | Yes | 828 | 776 | 600 | 828 |
| 7.5x9.25 | 7.5" × 9.25" | 7.5 | 9.25 | 19.05 | 23.5 | Yes | 828 | 776 | 600 | 828 |
| 8x10 | 8" × 10" | 8 | 10 | 20.32 | 25.4 | Yes | 828 | 776 | 600 | 828 |
| 8.25x6 | 8.25" × 6" | 8.25 | 6 | 20.96 | 15.24 | Yes | 800 | 750 | 600 | 800 |
| 8.25x8.25 | 8.25" × 8.25" | 8.25 | 8.25 | 20.96 | 20.96 | Yes | 800 | 750 | 600 | 800 |
| 8.5x8.5 | 8.5" × 8.5" | 8.5 | 8.5 | 21.59 | 21.59 | Yes | 590 | 550 | 600 | 590 |
| 8.5x11 | 8.5" × 11" | 8.5 | 11 | 21.59 | 27.94 | Yes | 590 | 550 | 600 | 590 |
| 8.27x11.69 | 8.27" × 11.69" (A4) | 8.27 | 11.69 | 21 | 29.7 | Yes | 780 | 730 | N/A | 590 |

**Minimum page count:** 24 for all B&W and premium color, 72 for standard color.

### Paper Type & Ink Type Combinations

| Combo Key | Paper | Ink | Page Count Limits | Notes |
|-----------|-------|-----|-------------------|-------|
| `bw-white` | White | Black & White | 24–828 (varies by trim) | Standard, cheapest option |
| `bw-cream` | Cream | Black & White | 24–776 (varies by trim) | Premium feel, off-white pages |
| `standard-color-white` | White | Standard Color | 72–600 | Color printing, lower quality |
| `premium-color-white` | White | Premium Color | 24–828 (varies by trim) | Best color quality, most expensive |

**Important constraint:** Standard Color is NOT available for 8.27" × 11.69" (A4) trim size.

### Cover Finish Options

| Value | Description |
|-------|-------------|
| `glossy` | Glossy finish — shiny, vibrant colors |
| `matte` | Matte finish — smooth, non-reflective |

### Margin Requirements (Verified HIGH confidence)

| Page Count | Inside (Gutter) | Outside (No Bleed) | Outside (With Bleed) |
|------------|-----------------|---------------------|----------------------|
| 24–150 | 0.375" (9.6 mm) | ≥ 0.25" (6.4 mm) | ≥ 0.375" (9.6 mm) |
| 151–300 | 0.5" (12.7 mm) | ≥ 0.25" (6.4 mm) | ≥ 0.375" (9.6 mm) |
| 301–500 | 0.625" (15.9 mm) | ≥ 0.25" (6.4 mm) | ≥ 0.375" (9.6 mm) |
| 501–700 | 0.75" (19.1 mm) | ≥ 0.25" (6.4 mm) | ≥ 0.375" (9.6 mm) |
| 701–828 | 0.875" (22.3 mm) | ≥ 0.25" (6.4 mm) | ≥ 0.375" (9.6 mm) |

**Note:** Top, bottom, and outside margins don't have to be the same. They just need to meet the minimum.

### Bleed Specifications

- **Bleed amount:** 0.125" (3.2 mm) on top, bottom, and outside edges
- **Interior bleed formula:** Page width = trim_width + 0.125", Page height = trim_height + 0.25"
- **Interior bleed is optional** (only needed if images/backgrounds extend to page edge)
- **Cover bleed is mandatory** on all covers
- **Bleed only supported for PDF** (not DOCX)

### Spine Width Formulas

| Paper Type | Formula |
|------------|---------|
| White paper (B&W) | page_count × 0.002252" |
| Cream paper (B&W) | page_count × 0.0025" |
| Premium Color paper | page_count × 0.002347" |
| Standard Color paper | page_count × 0.002252" |

**Minimum pages for spine text:** 79 pages. Below that, spine is too narrow for text.

## Common Pitfalls

### Pitfall 1: KDP Spec Registry Too Early or Too Late

**What goes wrong:** Building the spec registry too late means hardcoding values in components. Building it too early (before understanding the data shape) means rework.

**Why it happens:** The registry seems like "just constants" but the relationships between trim size, paper type, ink type, and page count limits are complex.

**How to avoid:** Build the registry first as pure TypeScript constants. The data is already verified above. Implement it in `src/domain/kdp/` before writing any UI code. This is a "Wave 0" task in the plan.

**Warning signs:** Finding trim size values in JSX files or Server Action files instead of imports from `@/domain/kdp`.

### Pitfall 2: SQLite Enum Handling

**What goes wrong:** SQLite doesn't have native ENUM types. Developers either use text columns without constraints or over-engineer with lookup tables.

**Why it happens:** Drizzle's `text("column", { enum: [...] })` creates a CHECK constraint, which is correct for SQLite. But developers unfamiliar with SQLite may try to use PostgreSQL-style enums.

**How to avoid:** Use Drizzle's `text()` with `{ enum: [...] }` option for SQLite. This generates proper CHECK constraints. For TypeScript type safety, use `.$type<T>()` or define a union type separately.

### Pitfall 3: Server Component vs Client Component Confusion

**What goes wrong:** Mixing server and client logic in the same component. Trying to use `useState` in a Server Component, or trying to access the database in a Client Component.

**Why it happens:** Next.js 15 App Router has subtle boundaries. Form components with interactivity need `"use client"`, but data fetching should stay in Server Components.

**How to avoid:** Strict separation: Server Components for data fetching (book list page), Client Components for interactive forms (create/edit book form). Server Actions bridge the gap for mutations.

**Warning signs:** `useState` in a file without `"use client"`, or `import { db }` in a `"use client"` file.

### Pitfall 4: Over-Building the Dashboard

**What goes wrong:** Spending too much time on dashboard layout, navigation, and styling instead of the core book CRUD and KDP spec registry.

**Why it happens:** Dashboard UI is the most visible part and it's tempting to polish it.

**How to avoid:** Dashboard should be functional but minimal. A simple grid of book cards with title, trim size, and created date. Add a "New Book" button. That's sufficient for Phase 1. Polish comes later.

### Pitfall 5: Missing `drizzle.config.ts`

**What goes wrong:** Drizzle Kit commands fail because the config file is missing or points to wrong paths.

**Why it happens:** The config file is easy to forget when scaffolding the project.

**How to avoid:** Create `drizzle.config.ts` in project root immediately after installing drizzle-kit. Use the `dialect: 'sqlite'` setting.

## Code Examples

### Database Connection Setup
```typescript
// src/infrastructure/db/client.ts
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

const sqlite = new Database("publik.db")
// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL")

export const db = drizzle(sqlite, { schema })
```

### Drizzle Kit Configuration
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./publik.db",
  },
})
```

### Book List Page (Server Component)
```typescript
// src/app/(dashboard)/page.tsx
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { desc, isNull } from "drizzle-orm"
import { BookCard } from "@/components/books/book-card"
import { NewBookButton } from "@/components/books/new-book-button"

export default async function DashboardPage() {
  const allBooks = await db
    .select()
    .from(books)
    .where(isNull(books.deletedAt))
    .orderBy(desc(books.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Books</h1>
        <NewBookButton />
      </div>
      {allBooks.length === 0 ? (
        <p className="text-muted-foreground">No books yet. Create your first book!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Zod Validation Schema
```typescript
// src/domain/book/book-validator.ts
import { z } from "zod"
import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"

const trimSizeIds = KDP_TRIM_SIZES.map((s) => s.id)

export const bookCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  trimSizeId: z.enum(trimSizeIds as [string, ...string[]]).default("6x9"),
  paperType: z.enum(["white", "cream"]).default("white"),
  inkType: z.enum(["bw", "standard-color", "premium-color"]).default("bw"),
  coverFinish: z.enum(["glossy", "matte"]).default("matte"),
})

export const bookUpdateSchema = bookCreateSchema.partial()

export type BookCreateInput = z.infer<typeof bookCreateSchema>
export type BookUpdateInput = z.infer<typeof bookUpdateSchema>
```

### `cn()` Utility
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for CRUD | Server Actions | Next.js 13.4+ (stable in 14+) | Less boilerplate, progressive enhancement |
| Prisma for ORM | Drizzle ORM | 2023-2025 trend | Lighter, faster, better SQLite support |
| CSS-in-JS | Tailwind CSS v4 | 2024+ | v4 uses CSS-first config, no `tailwind.config.js` needed |
| `next lint` | ESLint flat config directly | Next.js 15.5 deprecated `next lint` | Use `eslint.config.mjs` with `@eslint/js` |

**Tailwind CSS v4 note:** Tailwind v4 uses CSS-first configuration via `@import "tailwindcss"` in `app/globals.css`. No `tailwind.config.js` file is needed. Custom theme values go in CSS using `@theme { }` blocks.

**Next.js 15.5 note:** `next lint` is deprecated. Use ESLint directly with flat config. The `create-next-app` scaffolding still sets this up correctly.

## Open Questions

1. **Hardcover support in Phase 1?**
   - What we know: KDP supports hardcover with 5 trim sizes (5.5x8.5, 6x9, 6.14x9.21, 7x10, 8.25x11). Min 75 pages.
   - What's unclear: Whether to include hardcover as a book type option in Phase 1.
   - Recommendation: Skip hardcover for Phase 1. The requirement says "paperback" implicitly (BOOK-04 says "KDP-supported options" which includes hardcover, but paperback is the primary use case). Add hardcover support in a later phase if needed.

2. **Japanese marketplace trim sizes?**
   - What we know: KDP has different trim sizes for kdp.amazon.co.jp (4.06x7.17, 4.13x6.81, etc.).
   - What's unclear: Whether the user needs Japanese marketplace support.
   - Recommendation: Start with US marketplace only. Japanese sizes can be added to the registry later without breaking changes.

3. **ID generation strategy**
   - What we know: Need unique IDs for books. Options: nanoid, cuid2, UUID v4.
   - What's unclear: User preference.
   - Recommendation: Use `nanoid` — short, URL-safe, no dependencies beyond itself.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js, all packages | ✓ | v24.13.0 | — |
| pnpm | Package manager | ✓ | 10.31.0 | npm (slower) |
| Git | Version control | ✓ | 2.52.0 | — |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

All required tools are available and at sufficient versions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 15 + Vite ecosystem) |
| Config file | `vitest.config.ts` (Wave 0) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Create book with title | unit | `pnpm vitest run tests/domain/book-validator.test.ts -x` | ❌ Wave 0 |
| BOOK-02 | Edit book details | unit | `pnpm vitest run tests/domain/book-validator.test.ts -x` | ❌ Wave 0 |
| BOOK-03 | Delete book (soft) | unit | `pnpm vitest run tests/app/books/actions.test.ts -x` | ❌ Wave 0 |
| BOOK-04 | Trim size selection | unit | `pnpm vitest run tests/domain/kdp/trim-sizes.test.ts -x` | ❌ Wave 0 |
| BOOK-05 | Paper/ink type selection | unit | `pnpm vitest run tests/domain/kdp/paper-types.test.ts -x` | ❌ Wave 0 |
| BOOK-06 | Cover finish selection | unit | `pnpm vitest run tests/domain/kdp/cover-finishes.test.ts -x` | ❌ Wave 0 |
| UX-01 | Dashboard lists books | integration | `pnpm vitest run tests/app/dashboard/page.test.ts -x` | ❌ Wave 0 |
| UX-03 | UI strings in English | manual-only | Visual inspection | — |

### Sampling Rate
- **Per task commit:** `pnpm vitest run`
- **Per wave merge:** `pnpm vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration with Next.js path aliases
- [ ] `tests/domain/kdp/trim-sizes.test.ts` — Verify all 17 trim sizes have correct dimensions and page limits
- [ ] `tests/domain/kdp/margins.test.ts` — Verify margin calculation for each page count tier
- [ ] `tests/domain/book/book-validator.test.ts` — Verify Zod schemas accept/reject valid/invalid inputs
- [ ] `tests/setup.ts` — Shared test setup (Vitest global setup)
- [ ] Vitest install: `pnpm add -D vitest @vitejs/plugin-react jsdom` — if none detected

## Sources

### Primary (HIGH confidence)
- KDP Help Center: "Set Trim Size, Bleed, and Margins" (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6) — Full trim size table with page count limits per ink/paper combo, margin table by page count, bleed formulas. Scraped and verified 2026-03-30.
- KDP Help Center: "Create a Paperback Cover" (https://kdp.amazon.com/en_US/help/topic/G201953020) — Spine width formulas per paper type, cover dimension formulas, cover finish options (glossy/matte), bleed requirements. Scraped and verified 2026-03-30.
- Drizzle ORM Schema Documentation (https://orm.drizzle.team/docs/sql-schema-declaration) — SQLite table definition patterns, column types, index definitions. Verified 2026-03-30.
- npm registry — All package versions verified via `npm view <package> version` on 2026-03-30.

### Secondary (MEDIUM confidence)
- bookow.com KDP Cover Template Generator (https://bookow.com/resources.php) — Confirms spine width formulas and cover dimension calculations. Active tool, verified 2026-03-30.
- ARCHITECTURE.md (project research) — Architecture patterns, project structure, domain-driven design approach. Verified internal consistency with KDP data.

### Tertiary (LOW confidence)
- None for this phase. All KDP specifications are now verified from primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from npm registry
- Architecture: HIGH — well-established Next.js 15 + Drizzle patterns
- KDP specifications: HIGH — verified from official KDP help pages (margin values upgraded from LOW to HIGH)
- Pitfalls: HIGH — derived from verified KDP specs and established patterns

**Research date:** 2026-03-30
**Valid until:** 60 days (KDP specs are stable; package versions may need re-verification)
