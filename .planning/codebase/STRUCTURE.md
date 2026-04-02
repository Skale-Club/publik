---
generated: 2026-04-02
focus: arch
---

# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
publik/
├── src/
│   ├── app/                         # Next.js App Router pages and API routes
│   │   ├── (dashboard)/             # Route group — all dashboard pages share sidebar layout
│   │   │   ├── layout.tsx           # Dashboard shell: sidebar + main content wrapper
│   │   │   ├── page.tsx             # / — book list dashboard
│   │   │   ├── error.tsx            # Dashboard error boundary
│   │   │   ├── loading.tsx          # Dashboard loading skeleton
│   │   │   └── books/
│   │   │       ├── new/
│   │   │       │   └── page.tsx     # /books/new — create book form
│   │   │       └── [bookId]/
│   │   │           ├── actions.ts   # Server Actions: book + chapter CRUD
│   │   │           ├── page.tsx     # /books/[bookId] — book detail + chapter list
│   │   │           ├── chapters/
│   │   │           │   └── [chapterId]/
│   │   │           │       └── page.tsx  # /books/[bookId]/chapters/[chapterId] — legacy single-chapter editor
│   │   │           ├── editor/
│   │   │           │   ├── page.tsx             # /books/[bookId]/editor — Server shell
│   │   │           │   └── editor-page-client.tsx  # Client: TipTap editor with chapter switcher
│   │   │           ├── cover/
│   │   │           │   └── page.tsx   # /books/[bookId]/cover — cover upload/edit
│   │   │           └── export/
│   │   │               └── page.tsx   # /books/[bookId]/export — download KDP files
│   │   ├── api/                     # API route handlers (streaming/binary responses)
│   │   │   ├── generate/
│   │   │   │   ├── pdf/route.ts     # GET /api/generate/pdf?bookId=X — interior PDF stream
│   │   │   │   └── cover/route.ts   # GET /api/generate/cover?bookId=X — cover PDF buffer
│   │   │   ├── upload/
│   │   │   │   ├── cover/route.ts   # POST /api/upload/cover — cover image to Supabase Storage
│   │   │   │   └── image/route.ts   # POST /api/upload/image — inline image to Supabase Storage
│   │   │   ├── import/
│   │   │   │   ├── docx/route.ts    # POST /api/import/docx — DOCX → HTML (mammoth)
│   │   │   │   └── pdf/route.ts     # POST /api/import/pdf — PDF text extraction
│   │   │   ├── validate/route.ts    # GET /api/validate?bookId=X — KDP compliance check
│   │   │   └── download/
│   │   │       └── zip/route.ts     # POST /api/download/zip — ZIP package (both PDFs + checklist)
│   │   ├── publishing-guide/
│   │   │   └── page.tsx             # /publishing-guide — static KDP how-to guide
│   │   ├── layout.tsx               # Root layout: adds <Toaster />, HTML metadata
│   │   ├── globals.css              # Global Tailwind styles
│   │   └── favicon.ico
│   ├── components/                  # React UI components (mix of Server and Client)
│   │   ├── books/                   # Book and chapter management components
│   │   │   ├── book-card.tsx        # Book summary card for dashboard grid
│   │   │   ├── book-form.tsx        # Create new book form (Client)
│   │   │   ├── book-settings-form.tsx  # Edit book metadata (Client)
│   │   │   ├── chapter-editor.tsx   # Single chapter editor (legacy, Client)
│   │   │   ├── chapter-list.tsx     # Chapter list with drag-reorder (Client)
│   │   │   ├── kdp-options-form.tsx # KDP print settings form (Client)
│   │   │   └── tiptap-editor.tsx    # Unused duplicate of editor/tiptap-editor.tsx
│   │   ├── covers/                  # Cover management components (all Client)
│   │   │   ├── CoverEditor.tsx      # Cover page orchestrator component
│   │   │   ├── CoverUploader.tsx    # Drag-and-drop cover image uploader
│   │   │   ├── CoverPreview.tsx     # Cover image preview
│   │   │   ├── BackCoverInput.tsx   # Back cover: image or text toggle
│   │   │   ├── CoverValidationStatus.tsx  # KDP validation status badge
│   │   │   └── index.ts             # Barrel export
│   │   ├── editor/                  # TipTap editor components (all Client)
│   │   │   ├── tiptap-editor.tsx    # TipTap EditorContent wrapper (forwardRef)
│   │   │   ├── editor-toolbar.tsx   # Formatting toolbar (bold, italic, headings, etc.)
│   │   │   ├── file-import-button.tsx  # DOCX/PDF import trigger
│   │   │   ├── image-insert-button.tsx # Inline image insert trigger
│   │   │   ├── toc-sidebar.tsx      # TOC sidebar panel
│   │   │   ├── toc-entry.tsx        # Individual TOC entry row
│   │   │   └── use-auto-save.ts     # Auto-save hook (800ms debounce)
│   │   ├── export/                  # Export page components (all Client)
│   │   │   ├── FileDownloads.tsx    # Download buttons for interior PDF + cover PDF
│   │   │   ├── ZipDownloadButton.tsx  # Download complete ZIP package button
│   │   │   ├── ValidationReport.tsx   # Detailed KDP validation report
│   │   │   └── PublishingGuide.tsx    # Inline publishing guide section
│   │   └── pdf/                     # React-PDF preview components (experimental)
│   │       └── toc-page.tsx         # TOC page preview component
│   ├── domain/                      # Business domain: pure types + KDP specifications
│   │   ├── book/                    # Book and chapter domain types
│   │   │   ├── book.ts              # Book interface
│   │   │   ├── book-validator.ts    # Zod schemas: bookCreateSchema, bookUpdateSchema
│   │   │   ├── chapter.ts           # Chapter interface + input types
│   │   │   └── chapter-validator.ts # Zod schemas: chapterCreateSchema, chapterUpdateSchema
│   │   └── kdp/                     # KDP specification constants
│   │       ├── index.ts             # Barrel re-export
│   │       ├── trim-sizes.ts        # 16 KDP trim sizes with dimensions + max page limits
│   │       ├── paper-types.ts       # Paper + ink combination specs
│   │       ├── cover-finishes.ts    # Cover finish options (glossy/matte)
│   │       ├── margins.ts           # KDP interior margin calculator
│   │       ├── bleed.ts             # Bleed amount constants + interior page dimensions
│   │       └── spine-width.ts       # Spine width calculator (pages × paper thickness)
│   ├── infrastructure/              # External system connections
│   │   └── db/                      # Database layer
│   │       ├── client.ts            # Drizzle + postgres.js client singleton
│   │       └── schema/              # Database table definitions
│   │           ├── index.ts         # Barrel export of all tables
│   │           ├── books.ts         # books table
│   │           ├── chapters.ts      # chapters table (FK → books)
│   │           ├── covers.ts        # covers table (FK → books)
│   │           └── toc.ts           # toc_entries table (FK → books)
│   ├── lib/                         # Utility libraries
│   │   ├── pdf/                     # PDF generation utilities
│   │   │   ├── interior-document.tsx   # InteriorDocument React-PDF component
│   │   │   ├── cover-document.tsx      # CoverDocument React-PDF component
│   │   │   ├── html-to-pdf.tsx         # HTML string → React-PDF elements converter
│   │   │   ├── font-registration.ts    # Times Roman / Helvetica / Courier font embedding
│   │   │   ├── page-layout.ts          # Trim size → PDF point dimensions converter
│   │   │   ├── page-margins.ts         # KDP-compliant margin calculator
│   │   │   ├── cover-dimensions.ts     # Full cover dimension calculator (with bleed)
│   │   │   ├── spine-calculator.ts     # Spine width calculator
│   │   │   ├── layout-options.ts       # Header/footer layout options type
│   │   │   ├── toc-document.tsx        # Standalone TOC page document
│   │   │   ├── trim-size-validator.ts  # Validates trim size ID against KDP specs
│   │   │   └── components/
│   │   │       ├── page-header.tsx     # PDFHeader component (book/chapter title)
│   │   │       └── page-footer.tsx     # PDFFooter component (page numbers)
│   │   ├── covers/                  # Cover validation utilities
│   │   │   ├── index.ts             # Barrel export
│   │   │   ├── kdp-validation.ts    # validateCoverForKDP() — image dimension checker
│   │   │   ├── validation.ts        # Cover validation types
│   │   │   └── dimensions.ts        # Cover dimension helpers
│   │   ├── export/                  # Export utilities
│   │   │   ├── validator.ts         # validateBookForKDP() — aggregates interior + cover checks
│   │   │   ├── checklist.ts         # generateChecklist() — produces KDP checklist text file
│   │   │   └── file-download.ts     # downloadFile() / getFileDownloadUrl() browser helpers
│   │   ├── import/                  # Document import utilities
│   │   │   ├── docx-utils.ts        # convertDocxToHtml() using mammoth
│   │   │   ├── pdf-utils.ts         # PDF text extraction utilities
│   │   │   └── image-utils.ts       # Image processing helpers
│   │   ├── toc/                     # Table of contents utilities
│   │   │   ├── index.ts             # Barrel export
│   │   │   ├── sync.ts              # DB-level TOC sync functions (direct DB access)
│   │   │   ├── headings.ts          # Heading extraction from HTML
│   │   │   └── transform.ts         # transformTOCForPDF() — TOCEntry[] → PDF-friendly format
│   │   ├── storage.ts               # Supabase Storage: saveImage(), saveCoverImage(), deleteFile()
│   │   ├── supabase.ts              # Supabase admin client singleton + bucket constants
│   │   └── utils.ts                 # cn() Tailwind class merge utility
│   ├── server/                      # Server-only modules
│   │   └── actions/                 # Next.js Server Actions
│   │       ├── covers.ts            # Cover CRUD server actions + getBook(), getCover()
│   │       └── toc.ts               # TOC server actions: getTOCEntries, syncTOC, addTOCEntry, etc.
│   ├── types/                       # Shared TypeScript type definitions
│   │   ├── toc.ts                   # TOCEntry, Anchor, TOCSyncResult, TOCExtensionConfig interfaces
│   │   └── sql.js.d.ts              # Type shim for sql.js (SQLite WASM — legacy, not actively used)
│   └── drizzle.config.ts            # Duplicate drizzle config (src/ copy — see root drizzle.config.ts)
├── drizzle/                         # Drizzle migration files
│   ├── 0000_chemical_ulik.sql       # Initial schema migration
│   ├── 0001_enable_rls_public_tables.sql  # Supabase RLS enablement
│   └── meta/                        # Drizzle migration metadata
│       ├── _journal.json
│       └── 0000_snapshot.json
├── tests/                           # Test files (Vitest)
│   ├── setup.ts                     # Vitest setup (global test configuration)
│   ├── app/books/
│   │   └── actions.test.ts          # Server actions integration tests
│   ├── domain/book/
│   │   └── book-validator.test.ts   # Zod validator unit tests
│   ├── domain/kdp/
│   │   ├── cover-finishes.test.ts
│   │   ├── margins.test.ts
│   │   ├── paper-types.test.ts
│   │   ├── spine-width.test.ts
│   │   └── trim-sizes.test.ts
│   └── lib/pdf/
│       ├── spine-calculator.test.ts
│       └── trim-sizes.test.ts
├── public/
│   ├── fonts/                       # Font directory (README present; TTF files not yet added)
│   └── vendor/sql.js/
│       └── sql-wasm.wasm            # SQLite WASM binary (legacy, for client-side DB — unused)
├── scripts/
│   └── supabase-keepalive.mjs       # GitHub Actions keepalive pinger for Supabase free tier
├── .planning/                       # GSD planning artifacts
│   ├── codebase/                    # Codebase analysis documents (this directory)
│   ├── phases/                      # Phase plans and summaries (01 through 08)
│   └── research/                    # Research notes
├── .github/workflows/
│   └── supabase-keepalive.yml       # Scheduled keepalive workflow (weekly)
├── drizzle.config.ts                # Drizzle Kit config (root — points to src/infrastructure/db/schema)
├── next.config.ts                   # Next.js config (sql.js as serverExternalPackage, fs fallback)
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs               # PostCSS for Tailwind
├── tsconfig.json                    # TypeScript config (strict mode, @/* path alias)
└── vitest.config.ts                 # Vitest config
```

## Directory Purposes

**`src/app/(dashboard)/`:**
- Purpose: All user-facing pages inside the sidebar layout
- Contains: Page components (Server Components), route-specific Server Actions (`actions.ts`)
- Key pattern: Each `page.tsx` is a Server Component that queries DB directly and passes data to Client Components

**`src/app/api/`:**
- Purpose: REST-style endpoints used for streaming responses and binary data
- Contains: PDF generators, file upload receivers, document importers, ZIP packager
- Key pattern: `GET` for read/generate, `POST` for write/upload; all return binary or JSON

**`src/components/`:**
- Purpose: Reusable UI components
- Naming: `books/` and `editor/` use kebab-case filenames; `covers/` and `export/` use PascalCase — inconsistency present

**`src/domain/`:**
- Purpose: Business rules isolated from infrastructure
- Contains only: TypeScript interfaces, Zod schemas, KDP specification data
- Rule: Never import from `src/infrastructure/` or `src/lib/`

**`src/infrastructure/db/`:**
- Purpose: Single source of truth for database schema and client
- Key file: `src/infrastructure/db/client.ts` — the only place `postgres()` is called
- Schema barrel: `src/infrastructure/db/schema/index.ts` exports all four tables

**`src/lib/pdf/`:**
- Purpose: All PDF generation logic — both document components and utilities
- Used exclusively by API route handlers (`/api/generate/pdf`, `/api/generate/cover`, `/api/download/zip`)
- Not imported by any page components

**`src/lib/toc/`:**
- Purpose: TOC-related business logic (sync algorithm, heading extraction, PDF transform)
- Note: `src/lib/toc/sync.ts` imports DB directly (bypasses server action layer) — used only in `src/server/actions/toc.ts`

**`src/server/actions/`:**
- Purpose: Server Actions for client components that need DB mutations
- Distinct from `src/app/(dashboard)/books/[bookId]/actions.ts` — no architectural reason for the split

**`tests/`:**
- Purpose: Vitest test files mirroring `src/` directory structure
- Pattern: Domain tests (pure unit tests), lib tests (pure unit tests), app tests (require DB mock or integration)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — root layout
- `src/app/(dashboard)/layout.tsx` — dashboard layout with sidebar

**Database:**
- `src/infrastructure/db/client.ts` — DB connection
- `src/infrastructure/db/schema/index.ts` — all table exports
- `drizzle.config.ts` (root) — migration config

**Server Actions (mutations):**
- `src/app/(dashboard)/books/[bookId]/actions.ts` — book + chapter CRUD
- `src/server/actions/covers.ts` — cover CRUD
- `src/server/actions/toc.ts` — TOC management

**PDF Generation:**
- `src/lib/pdf/interior-document.tsx` — interior PDF React component
- `src/lib/pdf/cover-document.tsx` — cover PDF React component
- `src/lib/pdf/html-to-pdf.tsx` — HTML → React-PDF converter
- `src/app/api/generate/pdf/route.ts` — interior PDF endpoint
- `src/app/api/generate/cover/route.ts` — cover PDF endpoint

**KDP Business Rules:**
- `src/domain/kdp/trim-sizes.ts` — all 16 KDP trim sizes
- `src/domain/kdp/margins.ts` — interior margin rules
- `src/domain/kdp/spine-width.ts` — spine width formula

**File Storage:**
- `src/lib/storage.ts` — save/delete from Supabase Storage
- `src/lib/supabase.ts` — Supabase admin client

**Validation:**
- `src/domain/book/book-validator.ts` — book Zod schemas
- `src/lib/export/validator.ts` — full KDP compliance validator
- `src/lib/covers/kdp-validation.ts` — cover image dimension validator

## Naming Conventions

**Files:**
- Pages and layouts: `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx` (Next.js convention)
- Server Actions: camelCase module name, e.g., `actions.ts`, `covers.ts`, `toc.ts`
- Components under `src/components/books/` and `src/components/editor/`: kebab-case, e.g., `book-card.tsx`, `tiptap-editor.tsx`
- Components under `src/components/covers/` and `src/components/export/`: PascalCase, e.g., `CoverEditor.tsx`, `FileDownloads.tsx` — **naming inconsistency**
- Lib utilities: kebab-case, e.g., `html-to-pdf.tsx`, `font-registration.ts`, `spine-calculator.ts`
- Domain types: kebab-case, e.g., `book.ts`, `trim-sizes.ts`

**Directories:**
- App Router: lowercase (`books`, `editor`, `cover`, `export`)
- Components: lowercase plural (`books/`, `covers/`, `editor/`, `export/`, `pdf/`)
- Domain: lowercase (`book/`, `kdp/`)
- Infrastructure: lowercase (`db/`, `schema/`)

**TypeScript:**
- Interfaces: PascalCase (`Book`, `Chapter`, `TOCEntry`, `CoverData`)
- Zod schemas: camelCase with `Schema` suffix (`bookCreateSchema`, `syncTOCSchema`)
- Server Action functions: camelCase verbs (`createBook`, `updateChapter`, `syncTOC`)
- React components: PascalCase (`InteriorDocument`, `CoverEditor`, `EditorPageClient`)

## Where to Add New Code

**New feature (new page/route):**
- Add `page.tsx` under `src/app/(dashboard)/` at the appropriate URL path
- Add Server Actions in a co-located `actions.ts` file if mutations are needed for that page group
- Or add to `src/server/actions/` if shared across multiple page groups

**New domain rule or KDP spec:**
- Pure data/types: `src/domain/kdp/` (new file + export from `src/domain/kdp/index.ts`)
- New Zod validator: `src/domain/book/` or co-located with the relevant domain entity

**New database table:**
- Schema: new file in `src/infrastructure/db/schema/`, export from `src/infrastructure/db/schema/index.ts`
- Run `drizzle-kit generate` then `drizzle-kit migrate`

**New API endpoint:**
- Create `src/app/api/[category]/[action]/route.ts`
- Use `GET` for read/generate (idempotent), `POST` for write/upload

**New UI component:**
- Shared reusable: `src/components/[category]/component-name.tsx`
- Follow existing naming of the target directory (kebab-case for `books/`+`editor/`, PascalCase for `covers/`+`export/`)
- New `"use client"` components should import server actions for mutations, not call API routes directly

**New PDF utility:**
- Document component: `src/lib/pdf/[name]-document.tsx`
- Utility function: `src/lib/pdf/[name].ts`
- React-PDF sub-component: `src/lib/pdf/components/[name].tsx`

**New test:**
- Mirror `src/` path under `tests/`: domain tests in `tests/domain/`, lib tests in `tests/lib/`, action tests in `tests/app/`

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow planning artifacts (phase plans, summaries, research, codebase docs)
- Generated: Partially (by GSD commands)
- Committed: Yes

**`drizzle/`:**
- Purpose: Drizzle Kit migration SQL files
- Generated: Yes (via `drizzle-kit generate`)
- Committed: Yes

**`public/vendor/sql.js/`:**
- Purpose: SQLite WASM binary (from a previous SQLite-based architecture)
- Status: No longer used in application code; can be removed
- Committed: Yes (adds ~1MB)

**`public/fonts/`:**
- Purpose: Intended for local KDP font TTF files
- Status: Empty (README present); fonts currently loaded from unpkg.com CDN at PDF generation time

---

*Structure analysis: 2026-04-02*
