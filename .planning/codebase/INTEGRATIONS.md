---
generated: 2026-04-02
focus: tech
---

# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

### Supabase
- **Used for:** PostgreSQL database (via `DATABASE_URL` connection string) and file Storage (covers, inline images)
- **SDK/Client:** `@supabase/supabase-js ^2.101.1`
- **Client file:** `src/lib/supabase.ts`
- **Auth mode:** Service role (admin) — uses `SUPABASE_SERVICE_ROLE_KEY`, no user-level auth through the Supabase SDK
- **Storage buckets:** `covers` (50MB limit, public), `images` (10MB limit, public)
- **Bucket creation:** Auto-created on first upload via `ensureBucketExists()` in `src/lib/supabase.ts`
- **Env vars:** `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL` as fallback), `SUPABASE_SERVICE_ROLE_KEY`

### unpkg CDN (Font Assets)
- **Used for:** Serving TTF font files at PDF generation time
- **Files served:** Times Roman, Helvetica, and Courier font families (12 variants total)
- **URL pattern:** `https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/{FontName}.ttf`
- **Registered in:** `src/lib/pdf/font-registration.ts`
- **Note:** Fonts are fetched at runtime during PDF generation — network dependency for PDF output. A comment in the file notes these should be downloaded to `/public/fonts/` for production reliability.

## Data Storage

### Database — PostgreSQL via Supabase
- **Provider:** Supabase (managed PostgreSQL)
- **Connection:** `DATABASE_URL` environment variable
- **Client:** `drizzle-orm/postgres-js` + `postgres` driver
- **Client file:** `src/infrastructure/db/client.ts`
- **Connection config:** `prepare: false` (required for Supabase/PgBouncer pooled connections)
- **Schema location:** `src/infrastructure/db/schema/`
- **Migrations:** `./drizzle/` directory, managed by Drizzle Kit
- **RLS:** Enabled on all public tables (`books`, `chapters`, `covers`, `toc_entries`) — see `drizzle/0001_enable_rls_public_tables.sql`

**Tables:**
| Table | Key Columns |
|-------|-------------|
| `books` | `id`, `title`, `author`, `trim_size_id`, `paper_type`, `ink_type`, `cover_finish`, timestamps |
| `chapters` | `id`, `book_id` (FK), `title`, `order`, `content` (HTML), timestamps |
| `covers` | `id`, `book_id` (FK), `front_cover_url`, `back_cover_type`, `back_cover_text`, image dimensions, timestamps |
| `toc_entries` | `id`, `book_id` (FK), `title`, `level`, `anchor_id`, `position`, `is_custom`, timestamps |

### File Storage — Supabase Storage
- **Provider:** Supabase Storage (S3-compatible)
- **Buckets:** `covers` (front/back cover images), `images` (inline content images)
- **Storage abstraction:** `src/lib/storage.ts` — wraps Supabase SDK calls
- **Exports:** `saveImage()`, `saveCoverImage()`, `deleteFile()`
- **URL type:** Public URLs returned directly from `getPublicUrl()`

## Authentication & Identity

**No authentication system is implemented.** There is no Better Auth, Clerk, NextAuth, or session management in the codebase. The app operates as a single-user tool with no login flow. All API routes and server actions are publicly accessible.

## API Routes

All routes defined under `src/app/api/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/upload/cover` | POST | Upload front or back cover image (JPEG/PNG/TIFF/WebP, max 50MB) → saves to Supabase Storage `covers` bucket |
| `POST /api/upload/image` | POST | Upload inline content image (max 10MB) → saves to Supabase Storage `images` bucket |
| `GET /api/generate/pdf` | GET | Generate interior PDF from book content via `@react-pdf/renderer`; returns `application/pdf` stream; `maxDuration=300` |
| `GET /api/generate/cover` | GET | Generate cover PDF (front + back + spine) via `@react-pdf/renderer`; returns `application/pdf` buffer; `maxDuration=300` |
| `POST /api/import/docx` | POST | Convert uploaded `.docx` → HTML using `mammoth`; returns `{ html: string }` |
| `POST /api/import/pdf` | POST | Extract text from uploaded `.pdf` → HTML using `pdfjs-dist` legacy build; returns `{ html: string }` |
| `POST /api/download/zip` | POST | Calls interior PDF + cover PDF routes internally, bundles results with KDP checklist into a ZIP via `archiver`; `maxDuration=300` |
| `GET /api/validate` | GET | Validates a book against KDP requirements via `src/lib/export/validator.ts`; returns `ValidationResult` |

## Server Actions

Located in `src/server/actions/`:

| File | Purpose |
|------|---------|
| `src/server/actions/covers.ts` | Cover data mutations (create/update cover records) |
| `src/server/actions/toc.ts` | Table of contents mutations (sync, reorder, customize) |

## PDF Generation Pipeline

Two separate PDF documents are generated via `@react-pdf/renderer`:

**Interior PDF** (`GET /api/generate/pdf`):
1. Fetches book + chapters + TOC entries from PostgreSQL
2. Constructs `InteriorDocument` React component (`src/lib/pdf/interior-document.tsx`)
3. Streams PDF via `renderToStream()` → returned as `application/pdf`

**Cover PDF** (`GET /api/generate/cover`):
1. Fetches book + cover record from PostgreSQL
2. Fetches front/back cover image URLs from Supabase Storage
3. Constructs `CoverDocument` React component (`src/lib/pdf/cover-document.tsx`)
4. Renders to buffer via `renderToBuffer()` → returned as `application/pdf`

**Font loading:** Fonts fetched from unpkg CDN at registration time (`src/lib/pdf/font-registration.ts`). Registered families: Times-Roman, Helvetica, Courier (each with italic, bold, bold-italic variants).

## Document Import Pipeline

**DOCX import** (`POST /api/import/docx`):
- Uses `mammoth` with a custom `styleMap` to map Word heading styles to `h1/h2/h3` and inline styles to `strong/em/u`
- Returns clean HTML consumed directly by TipTap editor via `editor.commands.setContent()`
- Implementation: `src/lib/import/docx-utils.ts`

**PDF import** (`POST /api/import/pdf`):
- Uses `pdfjs-dist` legacy build (`pdfjs-dist/legacy/build/pdf.mjs`) loaded lazily via dynamic import
- Extracts plain text per page, wraps in `<p>` tags with `<hr>` separators between pages
- Returns HTML; note: structure/headings from PDF are not preserved
- Implementation: `src/lib/import/pdf-utils.ts`

## Export / KDP Package

**ZIP export** (`POST /api/download/zip`):
- Makes internal HTTP requests to `/api/generate/pdf` and `/api/generate/cover` within the same origin
- Bundles interior PDF, cover PDF, and a plain-text KDP checklist into a `.zip` using `archiver`
- Checklist generated by `src/lib/export/checklist.ts`
- Validation logic in `src/lib/export/validator.ts`

## Monitoring & Observability

**Error Tracking:** None — errors logged to `console.error()` only.

**Logs:** `console.log` / `console.error` / `console.warn` used directly; no structured logging library.

## CI/CD & Deployment

**Hosting:** Vercel (inferred — Next.js 15, `maxDuration` on routes, Supabase as backend)

**CI Pipeline:** GitHub Actions

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `.github/workflows/supabase-keepalive.yml` | Every 3 days at 13:00 UTC | Runs a keepalive query against Supabase PostgreSQL to prevent free-tier pausing |

**CI secrets used:**
- `DATABASE_URL` (preferred) or `SUPABASE_DATABASE_URL` (fallback) — for keepalive workflow

## Webhooks & Callbacks

**Incoming:** None.
**Outgoing:** None.

---

*Integration audit: 2026-04-02*
