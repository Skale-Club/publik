---
generated: 2026-04-02
focus: arch
---

# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Next.js App Router full-stack application with a layered architecture — domain types, infrastructure (DB), server actions, API routes, and React components. No auth layer is implemented; all routes are open.

**Key Characteristics:**
- Server Components fetch data directly from the database; no dedicated API layer for reads
- Mutations go through Next.js Server Actions (not API routes)
- API routes (`/api/*`) exist only for file operations that require streaming responses: PDF generation, file upload, DOCX import, ZIP packaging
- Soft-delete pattern everywhere: records have `deletedAt` rather than being physically removed (exception: `covers` table uses hard delete)
- All IDs are `nanoid()` strings (not auto-increment integers)
- Zod validation is applied at the server action boundary before any DB write

## Layers

**Domain Layer:**
- Purpose: Pure TypeScript types and business rules. No DB imports.
- Location: `src/domain/`
- Contains: Interfaces (`Book`, `Chapter`, `TOCEntry`), Zod validators, KDP specification constants (trim sizes, margins, spine widths, paper types, bleed)
- Depends on: Nothing (pure TypeScript + Zod)
- Used by: Server actions, API routes, components

**Infrastructure Layer:**
- Purpose: Database client and schema definitions
- Location: `src/infrastructure/db/`
- Contains: Drizzle ORM schema tables, postgres.js client
- Depends on: `DATABASE_URL` environment variable
- Used by: Server actions, API routes, `src/lib/toc/sync.ts`

**Server Actions Layer:**
- Purpose: All CRUD mutations and some reads called by client components
- Location: `src/app/(dashboard)/books/[bookId]/actions.ts`, `src/server/actions/covers.ts`, `src/server/actions/toc.ts`
- Contains: Book CRUD, chapter CRUD + reorder, cover save/delete, TOC sync/add/remove/reorder
- All marked `"use server"` and call `revalidatePath()` after mutations
- Depends on: Domain validators, infrastructure DB client

**API Routes Layer:**
- Purpose: Streaming-heavy operations that cannot be Server Actions
- Location: `src/app/api/`
- Contains:
  - `GET /api/generate/pdf` — renders interior PDF via `@react-pdf/renderer renderToStream`
  - `GET /api/generate/cover` — renders cover PDF via `renderToBuffer`
  - `POST /api/upload/cover` — uploads cover image to Supabase Storage
  - `POST /api/upload/image` — uploads inline image to Supabase Storage
  - `POST /api/import/docx` — converts DOCX to HTML via mammoth
  - `GET /api/import/pdf` — PDF text extraction utility
  - `GET /api/validate` — KDP compliance check
  - `POST /api/download/zip` — generates ZIP containing both PDFs + checklist, calls internal PDF endpoints
- Depends on: DB client, `src/lib/storage.ts`, `src/lib/pdf/*`, `src/lib/import/*`

**Library Layer:**
- Purpose: Pure utility functions and React-PDF components
- Location: `src/lib/`
- Sub-modules:
  - `src/lib/pdf/` — React-PDF document components, HTML-to-PDF converter, font registration, spine/margin/cover dimension calculations
  - `src/lib/covers/` — KDP cover validation logic
  - `src/lib/export/` — KDP validation aggregator, checklist generator, file download helpers
  - `src/lib/import/` — DOCX and PDF import utilities
  - `src/lib/toc/` — TOC sync, heading extraction, transform for PDF rendering
  - `src/lib/storage.ts` — Supabase Storage wrapper (save/delete image files)
  - `src/lib/supabase.ts` — Supabase admin client singleton

**Components Layer:**
- Purpose: React UI components
- Location: `src/components/`
- Sub-groups: `books/`, `covers/`, `editor/`, `export/`, `pdf/`
- Mix of Server and Client components (see Server/Client Boundary section)

## Data Flow

**Book CRUD (create/update/delete):**
1. User submits `<form>` in a Server Component page or `BookForm` Client Component
2. Server Action (e.g., `createBook`) receives `FormData`
3. Zod validates input against `bookCreateSchema`
4. Drizzle inserts/updates `books` table via `db` client
5. `revalidatePath("/")` triggers Next.js cache revalidation
6. Page re-renders with fresh data from DB

**Chapter auto-save:**
1. User types in `EditorPageClient` (Client Component with TipTap)
2. `useAutoSave` hook debounces content changes (800ms)
3. After debounce fires, calls `updateChapterContent` Server Action
4. Server Action writes `content` HTML string to `chapters.content` column
5. No revalidation of the editor page (saves are silent)

**Interior PDF Generation:**
1. Client calls `GET /api/generate/pdf?bookId=X`
2. Route handler fetches `books`, `chapters`, `toc_entries` rows from DB
3. Constructs `BookSettings` and `ChapterContent[]` objects
4. `InteriorDocument` React-PDF component renders with KDP trim size, margins, TOC page, chapter pages
5. `htmlToPDF()` parses chapter HTML into React-PDF elements
6. `renderToStream()` returns a PDF stream
7. `NextResponse` with `Content-Type: application/pdf` sent to client

**Cover PDF Generation:**
1. Client calls `GET /api/generate/cover?bookId=X`
2. Route fetches `books` + `covers` rows; requires `frontCoverUrl` to be set
3. Calculates `pageCount` from chapter word counts (~ words / 300)
4. `calculateCoverDimensions()` computes full KDP cover dimensions (back + spine + front + bleed)
5. `CoverDocument` React-PDF component renders the three-panel layout
6. `renderToBuffer()` returns PDF buffer
7. Response with binary PDF data

**File Upload (cover image):**
1. Client POSTs multipart form to `POST /api/upload/cover`
2. Route validates file type (JPEG/PNG/TIFF/WebP) and size (≤50MB)
3. `saveCoverImage()` in `src/lib/storage.ts` calls Supabase Storage admin client
4. `ensureBucketExists()` lazily creates the `covers` bucket if needed
5. File stored at path `{bookId}/front.{ext}` or `{bookId}/back.{ext}`
6. Public URL returned to client
7. Client calls `saveFrontCover` Server Action to persist URL + dimensions to DB

**ZIP Download:**
1. Client POSTs to `POST /api/download/zip`
2. Route fetches book data from DB
3. Internally calls `GET /api/generate/pdf` and `GET /api/generate/cover` (server-to-server within same process)
4. Both PDFs buffered, plus a KDP checklist text file generated by `generateChecklist()`
5. `archiver` packages all three into a ZIP stream
6. ZIP binary returned as response

**TOC Sync:**
1. TipTap editor in `EditorPageClient` uses `TableOfContents` extension which fires `onUpdate` with `Anchor[]`
2. Client calls `syncTOC` Server Action with `bookId` and anchor array
3. Server Action diffs existing `toc_entries` against incoming anchors
4. New anchors: insert new row; moved anchors: update `position`; custom entries: preserved
5. `revalidatePath` triggers page cache revalidation

**State Management:**
- Server Components: no client state; data fetched inline in `async` component body
- Client Components: local React `useState` for UI state (chapter selection, upload progress, loading flags)
- No global state manager (no Zustand, no Redux, no React Context beyond Toaster)
- URL state: not used (no `nuqs` yet despite being in planned stack)
- Toast notifications via `sonner` `toast()` called directly in event handlers

## Key Abstractions

**`InteriorDocument` (React-PDF component):**
- Purpose: Renders book interior as a PDF document
- File: `src/lib/pdf/interior-document.tsx`
- Pattern: Server-only React component using `@react-pdf/renderer` primitives (Document, Page, Text, View)

**`CoverDocument` (React-PDF component):**
- Purpose: Renders three-panel KDP cover (back + spine + front) as a single PDF page
- File: `src/lib/pdf/cover-document.tsx`
- Pattern: Calculates flex-percentage widths from `calculateCoverDimensions()` output

**`htmlToPDF()` converter:**
- Purpose: Parses TipTap HTML output into `@react-pdf/renderer` elements
- File: `src/lib/pdf/html-to-pdf.tsx`
- Pattern: Custom tokenizer + tree builder (not using a DOM parser); handles h1-h6, p, strong/em/u, ul/ol/li, blockquote, pre/code, img, hr, br, a

**`useAutoSave` hook:**
- Purpose: Debounced auto-save for TipTap editor content
- File: `src/components/editor/use-auto-save.ts`
- Pattern: 800ms debounce, tracks save status (`idle | saving | saved | error`), exposes `retry()`

**KDP Domain Constants:**
- Purpose: Authoritative source of KDP specifications — trim sizes, margins, spine widths, paper types
- Files: `src/domain/kdp/trim-sizes.ts`, `src/domain/kdp/margins.ts`, `src/domain/kdp/spine-width.ts`, etc.
- Pattern: Pure data objects exported from `src/domain/kdp/index.ts`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Responsibilities: Adds `<Toaster />` globally, sets HTML metadata

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Responsibilities: Renders persistent sidebar nav (Dashboard, New Book, Publishing Guide links) and main content area

**Dashboard Page:**
- Location: `src/app/(dashboard)/page.tsx`
- Triggers: Direct navigation to `/`
- Responsibilities: Fetches all non-deleted books, renders `BookCard` grid

**Book Detail Page:**
- Location: `src/app/(dashboard)/books/[bookId]/page.tsx`
- Triggers: Navigation to `/books/[bookId]`
- Responsibilities: Fetches book + chapters, renders chapter list, `BookSettingsForm`, `ChapterList` with reorder

**Editor Page:**
- Location: `src/app/(dashboard)/books/[bookId]/editor/page.tsx` (Server) + `editor-page-client.tsx` (Client)
- Responsibilities: Server fetches book + chapters; Client renders TipTap editor with chapter switcher dropdown, auto-save

**Cover Page:**
- Location: `src/app/(dashboard)/books/[bookId]/cover/page.tsx`
- Responsibilities: Fetches book; renders `CoverEditor` client component

**Export Page:**
- Location: `src/app/(dashboard)/books/[bookId]/export/page.tsx`
- Responsibilities: Fetches book; renders `FileDownloads` (triggers PDF generation) and `ZipDownloadButton`

## Server vs Client Boundary

**Server Components (no `"use client"`):**
- All `page.tsx` files in `(dashboard)` group
- `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- `src/app/publishing-guide/page.tsx`
- These fetch DB data directly, never import browser APIs

**Client Components (`"use client"`):**
- `src/app/(dashboard)/books/[bookId]/editor/editor-page-client.tsx` — TipTap editor requires browser
- `src/components/books/book-form.tsx`, `book-settings-form.tsx`, `chapter-editor.tsx`, `chapter-list.tsx`
- `src/components/covers/CoverEditor.tsx`, `CoverUploader.tsx`, `BackCoverInput.tsx`, `CoverValidationStatus.tsx`
- `src/components/editor/tiptap-editor.tsx`, `editor-toolbar.tsx`, `file-import-button.tsx`, `image-insert-button.tsx`, `toc-sidebar.tsx`
- `src/components/export/FileDownloads.tsx`, `ZipDownloadButton.tsx`, `ValidationReport.tsx`
- `src/components/editor/use-auto-save.ts` — custom hook (marked `"use client"`)

**Server Actions (`"use server"`):**
- `src/app/(dashboard)/books/[bookId]/actions.ts`
- `src/server/actions/covers.ts`
- `src/server/actions/toc.ts`

## Error Handling

**Strategy:** Catch-and-return pattern in server actions; try/catch with `console.error` + JSON error response in API routes.

**Patterns:**
- Server actions return `{ success: boolean; error?: string }` (covers, toc) or throw (book/chapter actions use `revalidatePath` only, no try/catch)
- API routes return `NextResponse.json({ error: "..." }, { status: 4xx/5xx })`
- Client components use `toast.error()` for user-visible error feedback
- Zod parse errors are caught and mapped to human-readable messages before returning

## Cross-Cutting Concerns

**Logging:** `console.error()` in catch blocks throughout API routes and server actions. No structured logging library.

**Validation:** Zod schemas in `src/domain/book/book-validator.ts` and `src/domain/book/chapter-validator.ts` for CRUD; inline `z.object()` schemas in cover and TOC server actions.

**Authentication:** None implemented. No middleware, no session checks. All routes are unauthenticated.

**Soft Delete:** All four tables use `deletedAt text` column. Queries always filter `isNull(table.deletedAt)` except cover deletes which use `db.delete()`.

---

*Architecture analysis: 2026-04-02*
