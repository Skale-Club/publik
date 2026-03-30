# Architecture Research

**Domain:** Book publishing web app (Amazon KDP output)
**Researched:** 2026-03-30
**Confidence:** MEDIUM (KDP official docs are JS-rendered and inaccessible; specs derived from bookow.com tools and domain knowledge)

## Standard Architecture

### System Overview

A book publishing web app for KDP is fundamentally a **content management + document generation pipeline**. The user writes or imports content, the system stores it as structured data, and then renders it into KDP-compliant PDF files.

```
+-----------------------------------------------------------------------+
|                          Presentation Layer                           |
+-----------------------------------------------------------------------+
|  +-----------+  +------------+  +----------+  +-----------+           |
|  | Book      |  | Content    |  | Cover    |  | Preview   |           |
|  | Dashboard |  | Editor     |  | Manager  |  | Viewer    |           |
|  +-----+-----+  +-----+------+  +----+-----+  +-----+-----+           |
|        |              |               |              |                 |
+--------+--------------+---------------+--------------+-----------------+
|                          API Layer                                |
+-----------------------------------------------------------------------+
|  +-----------+  +-----------+  +-----------+  +-----------+           |
|  | Book API  |  | Content   |  | Cover API |  | Export    |           |
|  | (CRUD)    |  | API       |  | (upload)  |  | API       |           |
|  +-----+-----+  +-----+-----+  +-----+-----+  +-----+-----+           |
+--------+--------------+---------------+--------------+-----------------+
|                          Service Layer                           |
+-----------------------------------------------------------------------+
|  +-------------+  +-------------+  +-------------+  +-------------+  |
|  | Import      |  | TOC         |  | Interior    |  | Cover       |  |
|  | Service     |  | Generator   |  | PDF Engine  |  | PDF Engine  |  |
|  +------+------+  +------+------+  +------+------+  +------+------+  |
+---------+------------------+------------------+------------------+-------+
|                          Data Layer                               |
+-----------------------------------------------------------------------+
|  +-------------------+  +-------------------+  +-------------------+   |
|  | Book Metadata     |  | Chapter Content   |  | Asset Storage     |   |
|  | (title, author,   |  | (JSON blocks,     |  | (cover images,    |   |
|  |  trim, pages...)  |  |  images, text)    |  |  uploaded files)  |   |
|  +-------------------+  +-------------------+  +-------------------+   |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Book Dashboard** | List books, create/edit metadata (title, author, trim size, paper type, ISBN) | CRUD UI with form validation |
| **Content Editor** | Write/edit book content as chapters with rich text formatting | Tiptap (ProseMirror-based headless editor) |
| **File Importer** | Parse uploaded DOCX/PDF/images into structured chapter content | mammoth.js (DOCX→HTML), pdf-parse (PDF→text), file upload |
| **Cover Manager** | Upload cover image, enter back cover text (synopsis, bio), store ISBN/price | Image upload + text form fields |
| **TOC Generator** | Auto-generate table of contents from chapter titles, allow manual edits | Service that reads chapter metadata, produces editable list |
| **Interior PDF Engine** | Render all chapters into a single KDP-compliant PDF with correct margins, pagination, fonts | pdf-lib (Node.js) with custom layout engine |
| **Cover PDF Engine** | Generate cover PDF with exact dimensions (front + spine + back + bleed), optional barcode | pdf-lib + ISBN barcode generator (bwip-js) |
| **Preview Viewer** | Render generated PDFs in-browser for review before download | Mozilla PDF.js (pdf.js) |
| **Export Service** | Package interior PDF + cover PDF for download, provide KDP upload instructions | File download endpoints |

## Recommended Project Structure

```
src/
├── app/                     # Next.js app router (pages, layouts, API routes)
│   ├── (dashboard)/         # Book dashboard pages
│   │   ├── page.tsx         # Book list
│   │   └── [bookId]/
│   │       ├── page.tsx     # Book overview
│   │       ├── editor/      # Content editor pages
│   │       │   └── [chapterId]/page.tsx
│   │       ├── cover/       # Cover management
│   │       │   └── page.tsx
│   │       └── export/      # Preview & export
│   │           └── page.tsx
│   └── api/
│       ├── books/           # Book CRUD endpoints
│       ├── chapters/        # Chapter CRUD + content endpoints
│       ├── import/          # File import endpoints
│       ├── cover/           # Cover upload + generation
│       └── export/          # PDF generation + download
│
├── domain/                  # Core business logic (framework-agnostic)
│   ├── book/                # Book entity, trim sizes, paper types
│   │   ├── book.ts
│   │   ├── trim-sizes.ts    # KDP trim size definitions
│   │   └── paper-types.ts   # White vs cream, spine width formulas
│   ├── chapter/             # Chapter entity, ordering, content model
│   │   └── chapter.ts
│   ├── toc/                 # Table of contents generation
│   │   └── toc-generator.ts
│   └── kdp/                 # KDP-specific rules and calculations
│       ├── spine-width.ts   # Spine width calculation
│       ├── margins.ts       # Margin requirements by page count
│       ├── barcode.ts       # ISBN barcode generation
│       └── cover-dimensions.ts  # Full cover dimension calculation
│
├── services/                # Application services (orchestrate domain logic)
│   ├── import/
│   │   ├── docx-importer.ts    # DOCX → structured content
│   │   ├── pdf-importer.ts     # PDF → text extraction
│   │   └── image-importer.ts   # Image handling
│   ├── pdf/
│   │   ├── interior-engine.ts  # Interior PDF generation
│   │   ├── cover-engine.ts     # Cover PDF generation
│   │   ├── layout-engine.ts    # Text layout, pagination, margins
│   │   └── font-registry.ts    # Embedded fonts management
│   └── export/
│       └── export-service.ts   # Package and deliver files
│
├── components/              # React UI components
│   ├── editor/              # Tiptap editor wrapper + extensions
│   ├── cover/               # Cover preview + upload components
│   ├── toc/                 # Table of contents editor
│   └── preview/             # PDF preview component
│
├── lib/                     # Shared utilities
│   ├── db.ts                # Database client (Drizzle/Prisma)
│   ├── storage.ts           # File/blob storage abstraction
│   └── queue.ts             # Background job queue (for PDF generation)
│
└── infrastructure/          # Database schema, migrations, seeds
    └── schema.ts
```

### Structure Rationale

- **`domain/`** is framework-agnostic — contains all KDP rules, calculations, and business entities. This is the most valuable code because KDP specifications are complex and domain-specific. Keeping them pure means they're testable without Next.js.
- **`services/`** orchestrates domain logic with I/O (file reading, PDF writing, database). Each service has a single responsibility (e.g., `interior-engine` only does interior PDF generation).
- **`app/`** is thin — routes map to service calls. No business logic in route handlers.
- **`components/`** groups by feature (editor, cover, toc, preview) rather than by type (button, input), because these are complex, cohesive UI units.

## Architectural Patterns

### Pattern 1: Pipeline Architecture for PDF Generation

**What:** The PDF generation process is a pipeline: raw content → parsed blocks → paginated layout → PDF bytes. Each step is independent and testable.

**When to use:** Any document generation where the output must meet strict formatting requirements (KDP margins, bleed, spine width).

**Trade-offs:** More upfront code vs. ability to tweak any step independently. Critical for KDP because requirements are precise and may change.

**Example:**
```typescript
// domain/kdp/interior-pipeline.ts

interface InteriorPipelineInput {
  chapters: Chapter[];
  book: Book;
  toc: TocEntry[];
}

interface InteriorPipelineOutput {
  pdfBytes: Uint8Array;
  pageCount: number;
}

// Each function is a pure pipeline step
async function generateInteriorPDF(input: InteriorPipelineInput): Promise<InteriorPipelineOutput> {
  const blocks = parseContentToBlocks(input.chapters);
  const layout = applyKdpLayout(blocks, input.book);
  const pages = paginateLayout(layout, input.book);
  const pdfBytes = renderToPdf(pages, input.book);
  return { pdfBytes, pageCount: pages.length };
}
```

### Pattern 2: Content as Structured Data (Not HTML)

**What:** Store book content as structured JSON blocks (like Editor.js or Tiptap JSON), not raw HTML. Each block has a type (paragraph, heading, image, page-break) and typed data.

**When to use:** When content needs to be rendered to multiple outputs (PDF preview, KDP PDF, future ebook format) and needs semantic meaning (chapter detection for TOC, page break handling).

**Trade-offs:** More complex data model vs. lossless round-tripping and multi-format rendering. Raw HTML loses structure — you can't reliably detect chapters from HTML.

**Example:**
```typescript
// domain/chapter/content-block.ts

type ContentBlock =
  | { type: 'paragraph'; data: { text: string; alignment?: 'left' | 'center' | 'right' } }
  | { type: 'heading'; data: { text: string; level: 1 | 2 | 3 } }
  | { type: 'image'; data: { url: string; caption?: string; width?: number } }
  | { type: 'page-break'; data: {} }
  | { type: 'list'; data: { style: 'ordered' | 'unordered'; items: string[] } };

interface Chapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  blocks: ContentBlock[];
}
```

### Pattern 3: Background Job for PDF Generation

**What:** PDF generation (especially with many pages and embedded fonts) can take 5-30 seconds. Run it as a background job, not a synchronous request.

**When to use:** Any operation that takes longer than 2 seconds. PDF generation for a 200-page book with embedded fonts qualifies.

**Trade-offs:** Requires job queue infrastructure vs. non-blocking UX. Users see a progress indicator instead of a frozen browser.

**Example:**
```typescript
// services/export/export-service.ts

async function requestExport(bookId: string, userId: string): Promise<JobId> {
  const job = await queue.enqueue('pdf-generation', {
    bookId,
    userId,
    requestedAt: new Date(),
  });
  return job.id;
}

// Worker process
async function processPdfGeneration(job: Job) {
  const book = await getBookWithChapters(job.data.bookId);
  const result = await generateInteriorPDF(book);
  const coverResult = await generateCoverPDF(book);
  await saveExportFiles(job.data.userId, book.id, result, coverResult);
  await notifyUser(job.data.userId, 'export-ready', { bookId: book.id });
}
```

### Pattern 4: Specification Registry for KDP Rules

**What:** All KDP formatting rules (trim sizes, margins, spine width formulas, bleed) are defined in a single registry. The PDF engine reads from this registry, not hardcoded values.

**When to use:** When output must conform to an external specification that may change. KDP occasionally updates requirements.

**Trade-offs:** Extra abstraction layer vs. single source of truth. Changing a margin requirement means editing one file, not hunting through the PDF engine.

**Example:**
```typescript
// domain/kdp/trim-sizes.ts

export const KDP_TRIM_SIZES = [
  { name: '5" x 8"', widthIn: 5, heightIn: 8 },
  { name: '5.06" x 7.81"', widthIn: 5.0625, heightIn: 7.8125 },
  { name: '5.25" x 8"', widthIn: 5.25, heightIn: 8 },
  { name: '5.5" x 8.5"', widthIn: 5.5, heightIn: 8.5 },
  { name: '6" x 9"', widthIn: 6, heightIn: 9 },
  { name: '6.14" x 9.21"', widthIn: 6.125, heightIn: 9.25 },
  { name: '6.69" x 9.61"', widthIn: 6.6875, heightIn: 9.625 },
  { name: '7" x 10"', widthIn: 7, heightIn: 10 },
  { name: '7.44" x 9.69"', widthIn: 7.4375, heightIn: 9.6875 },
  { name: '7.5" x 9.25"', widthIn: 7.5, heightIn: 9.25 },
  { name: '8" x 10"', widthIn: 8, heightIn: 10 },
  { name: '8.25" x 6"', widthIn: 8.25, heightIn: 6 },
  { name: '8.25" x 8.25"', widthIn: 8.25, heightIn: 8.25 },
  { name: '8.5" x 8.5"', widthIn: 8.5, heightIn: 8.5 },
  { name: '8.5" x 11"', widthIn: 8.5, heightIn: 11 },
] as const;

// domain/kdp/spine-width.ts

export function calculateSpineWidth(pageCount: number, paperType: 'white' | 'cream'): number {
  // KDP formula: pages * paper thickness in inches
  const thicknessPer = paperType === 'white' ? 0.002252 : 0.0025;
  return pageCount * thicknessPer;
}

// domain/kdp/cover-dimensions.ts

export function calculateCoverDimensions(
  trimWidthIn: number,
  trimHeightIn: number,
  pageCount: number,
  paperType: 'white' | 'cream',
): { totalWidthIn: number; totalHeightIn: number; spineWidthIn: number } {
  const bleed = 0.125; // 0.125" bleed on all sides
  const spineWidth = calculateSpineWidth(pageCount, paperType);
  const totalWidth = bleed + trimWidthIn + spineWidth + trimWidthIn + bleed;
  const totalHeight = bleed + trimHeightIn + bleed;
  return { totalWidthIn: totalWidth, totalHeightIn: totalHeight, spineWidthIn: spineWidth };
}
```

## Data Flow

### Book Creation & Content Editing Flow

```
[User creates book]
    |
    v
[Book Dashboard] --> POST /api/books --> [Book Service] --> [Database]
    |
    v
[User enters chapters]
    |
    v
[Content Editor (Tiptap)]
    |  (auto-saves JSON blocks)
    v
PUT /api/chapters/:id --> [Content Service] --> [Database]
    |
    v
[TOC Generator] <-- reads all chapter titles
    |
    v
[User reviews/edits TOC]
    |
    v
PUT /api/books/:id/toc --> [TOC Service] --> [Database]
```

### File Import Flow

```
[User uploads DOCX/PDF/images]
    |
    v
[File Import UI] --> POST /api/import
    |
    v
[Import Service]
    |
    +-- [DOCX Importer] (mammoth.js) --> HTML --> parse to ContentBlocks --> save chapters
    |
    +-- [PDF Importer] (pdf-parse) --> raw text --> split by heuristics --> save chapters
    |
    +-- [Image Importer] --> upload to storage --> create image blocks
    |
    v
[Database updated with new chapters]
    |
    v
[TOC regenerated from new chapters]
```

### PDF Export Flow

```
[User clicks "Generate KDP Files"]
    |
    v
[Export UI] --> POST /api/export --> [Export Service]
    |
    v
[Enqueue background job]
    |
    v
[Job Worker]
    |
    +-- Load book + all chapters from Database
    |
    +-- [Interior PDF Engine]
    |       |
    |       +-- Parse ContentBlocks to layout objects
    |       +-- Apply KDP margins (from spec registry)
    |       +-- Apply KDP trim size
    |       +-- Embed fonts (Garamond, or user-selected)
    |       +-- Add page numbers
    |       +-- Add blank pages for chapter starts (right-hand)
    |       +-- Render to PDF bytes (pdf-lib)
    |       +-- Save to storage
    |
    +-- [Cover PDF Engine]
    |       |
    |       +-- Calculate cover dimensions (trim + spine + bleed)
    |       +-- Load user-uploaded cover image
    |       +-- Place front cover, spine, back cover in correct positions
    |       +-- Generate ISBN barcode (bwip-js) if ISBN provided
    |       +-- Place barcode on back cover (bottom-right, standard position)
    |       +-- Render to PDF bytes (pdf-lib)
    |       +-- Save to storage
    |
    +-- [Notify user: export ready]
    |
    v
[User clicks "Download"]
    |
    v
GET /api/export/:bookId/download --> serves ZIP with interior.pdf + cover.pdf
```

### State Management

```
[Server State] (database)
    |
    +-- book metadata (title, author, trim size, ISBN, paper type)
    +-- chapters (ordered, with JSON content blocks)
    +-- cover image reference
    +-- toc entries
    +-- export jobs status
    |
    v
[Client State] (React)
    |
    +-- [TanStack Query / SWR]
    |       |
    |       +-- Server state cache
    |       +-- Optimistic updates for auto-save
    |       +-- Polling for export job status
    |
    +-- [Editor State] (Tiptap/ProseMirror)
    |       |
    |       +-- Current chapter content
    |       +-- Selection, undo/redo
    |       +-- Debounced sync to server
```

### Key Data Flows

1. **Content round-trip:** User types in editor → Tiptap JSON → server → database. On reload: database → server → Tiptap JSON → editor. The JSON format is the contract between editor and storage.

2. **Import pipeline:** Uploaded file → binary parse → intermediate format (HTML for DOCX, text for PDF) → ContentBlock[] → database. This is lossy by nature — imported content always needs review.

3. **Export pipeline:** ContentBlock[] → layout engine → paginated pages → PDF bytes → file storage. The layout engine must handle: word wrapping, page breaks (soft and hard), chapter-start page positioning, running headers/footers, page numbers.

4. **Cover assembly:** User cover image + ISBN + price → cover dimension calculation → PDF composition. The cover is a single PDF with three zones (front, spine, back) separated by exact measurements.

## KDP Technical Specifications (Critical for Architecture)

These specifications drive the entire PDF generation architecture. **Confidence: MEDIUM** — derived from bookow.com KDP Cover Template Generator (active, verified 2026-03-30) and domain knowledge. KDP's official help pages are JS-rendered and couldn't be scraped.

### Interior Manuscript Requirements

| Requirement | Value | Notes |
|-------------|-------|-------|
| Format | Single PDF file | All pages in one file |
| Trim sizes | 15 standard sizes | 5x8" to 8.5x11" |
| Color | Black & white interior (standard) | Color interior costs more |
| Bleed | Not required for B&W interior | Content stays within margins |
| Fonts | Embedded subset | Avoid font substitution issues |
| Resolution | 300 DPI for images | Images must be high-res |

### Cover Requirements

| Requirement | Value | Notes |
|-------------|-------|-------|
| Format | Single PDF file | Front + spine + back in one file |
| Bleed | 0.125" (3.175mm) on all sides | Background must extend to edges |
| Spine width | pages × 0.002252" (white) or pages × 0.0025" (cream) | Calculated from page count + paper |
| Barcode | ISBN-13 Bookland EAN | Optional price add-on (5-digit) |
| Image resolution | 300 DPI minimum | Cover must be sharp at print size |
| Color mode | CMYK or RGB | KDP converts RGB to CMYK |

### Cover Dimension Formula

```
Full Width  = Bleed + Trim Width + Spine Width + Trim Width + Bleed
Full Height = Bleed + Trim Height + Bleed

Example (6" x 9", 200 pages, white paper):
  Spine Width  = 200 × 0.002252 = 0.4504"
  Full Width   = 0.125 + 6 + 0.4504 + 6 + 0.125 = 12.7004"
  Full Height  = 0.125 + 9 + 0.125 = 9.25"
```

### Margin Guidelines (approximate, verify with KDP)

| Page Count | Inside (gutter) | Outside | Top | Bottom |
|------------|----------------|---------|-----|--------|
| 24-150     | 0.375"         | 0.25"   | 0.25" | 0.25"  |
| 151-300    | 0.5"           | 0.25"   | 0.25" | 0.25"  |
| 301-500    | 0.625"         | 0.25"   | 0.25" | 0.25"  |
| 501-700    | 0.75"          | 0.25"   | 0.25" | 0.25"  |
| 701-828    | 0.875"         | 0.25"   | 0.25" | 0.25"  |

**LOW confidence on exact margin values** — these are common industry approximations. Must verify against current KDP specifications before implementation.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users (personal use / early SaaS) | Monolith Next.js app. SQLite or PostgreSQL. PDF generation on the same server. No queue needed for low volume — use serverless functions with timeout. |
| 1k-100k users | Add background job queue (BullMQ + Redis) for PDF generation. Separate storage for assets (S3/R2). Database connection pooling. CDN for static assets. |
| 100k+ users | Separate PDF generation into its own service (microservice). Horizontal scaling of generation workers. Caching of generated PDFs. Rate limiting on generation. |

### Scaling Priorities

1. **First bottleneck: PDF generation CPU/memory.** A 300-page book with embedded fonts can consume significant memory and CPU. Mitigate with: job queue, memory limits, worker process recycling, and potentially a separate generation service.
2. **Second bottleneck: Asset storage.** Cover images and uploaded files grow linearly with users × books. Use object storage (S3/R2) from day one, not the database or filesystem.
3. **Third bottleneck: Database.** Book content (JSON blocks) can be large. Store content blocks in a `TEXT`/`JSONB` column, not as separate rows. Consider compression for large chapters.

## Anti-Patterns

### Anti-Pattern 1: Storing Content as HTML

**What people do:** Store the editor output as raw HTML in the database, then convert HTML to PDF.

**Why it's wrong:** HTML is a presentation format, not a content format. You lose semantic structure (what's a chapter heading vs. a styled paragraph). PDF generation from HTML is unreliable — CSS support in PDF tools varies, and you can't guarantee KDP margin/pagination compliance from HTML.

**Do this instead:** Store content as structured JSON blocks (Tiptap JSON or Editor.js format). Build a dedicated layout engine that reads blocks and places them on PDF pages with precise control over positioning.

### Anti-Pattern 2: Synchronous PDF Generation

**What people do:** Generate the PDF in the API request handler and return it directly.

**Why it's wrong:** PDF generation for a full book takes seconds to minutes. The HTTP request will time out. The user sees a frozen browser. Server resources are blocked during generation.

**Do this instead:** Enqueue a background job. Return a job ID immediately. Poll or use WebSocket/SSE to notify when done. This also lets you handle retries if generation fails.

### Anti-Pattern 3: Hardcoding KDP Specifications

**What people do:** Embed KDP trim sizes, margins, and spine calculations directly in the PDF generation code.

**Why it's wrong:** KDP specs change (they've updated trim sizes and paper types over the years). If specs are scattered across the codebase, updating them requires finding and changing multiple files.

**Do this instead:** Centralize all KDP specs in a specification registry (see Pattern 4). The PDF engine reads from the registry. Updating specs means changing one file.

### Anti-Pattern 4: Ignoring Spine Width Dependency on Page Count

**What people do:** Generate the cover PDF once and never update it, even when the interior page count changes.

**Why it's wrong:** The spine width is calculated from the page count. If you add/remove pages from the interior, the spine width changes, and the cover dimensions change. An incorrect spine width means the cover won't align with the printed book.

**Do this instead:** Always regenerate the cover PDF when exporting. The cover engine must read the current page count from the interior to calculate the correct spine width. Or, store the "exported page count" and warn the user if content has changed since last export.

### Anti-Pattern 5: Using Browser-Based PDF Generation for Production

**What people do:** Generate PDFs entirely in the browser using client-side libraries.

**Why it's wrong:** While pdf-lib works in the browser, generating a 300-page book with embedded fonts in the user's browser will consume their device's memory and CPU. Mobile devices will struggle. You lose control over the generation environment.

**Do this instead:** Use pdf-lib on the server (Node.js). The browser is for preview (read PDFs with PDF.js), not generation (write PDFs with pdf-lib server-side).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Object Storage** (S3, Cloudflare R2) | Direct upload (presigned URL) or server proxy | For cover images, uploaded DOCX/PDF files, and generated PDF exports |
| **ISBN Barcode** | No external service needed | Use bwip-js (Node.js) to generate EAN-13 barcode locally |
| **KDP** | No API integration | User manually uploads files to KDP. App generates files only. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Editor ↔ Content Service | REST API (PUT chapters) | Debounced auto-save, optimistic UI |
| Export UI ↔ Export Service | REST API + polling | POST to start, GET to check status, GET to download |
| Import Service → Content Service | Direct function call | Import service creates chapters via same service layer |
| PDF Engine ↔ KDP Spec Registry | Direct import | PDF engine reads specs as TypeScript constants |

## Build Order (Component Dependencies)

The suggested build order respects dependencies — each phase builds on components from previous phases.

```
Phase 1: Foundation
  ├── Book CRUD (metadata, trim size, paper type)
  ├── Database schema
  └── Basic dashboard UI
        |
        v
Phase 2: Content
  ├── Chapter CRUD (ordered, with JSON blocks)
  ├── Content Editor (Tiptap integration)
  └── Auto-save mechanism
        |
        v
Phase 3: Table of Contents
  ├── TOC auto-generation from chapters
  └── TOC editor (reorder, rename, add/remove)
        |
        v
Phase 4: Import
  ├── DOCX importer (mammoth.js → ContentBlocks)
  ├── PDF text importer
  └── Image uploader
        |
        v
Phase 5: KDP Specification Layer
  ├── Trim size registry
  ├── Spine width calculator
  ├── Margin calculator
  └── Cover dimension calculator
        |
        v
Phase 6: PDF Generation
  ├── Interior PDF engine (layout + pagination)
  ├── Cover PDF engine (front + spine + back + barcode)
  ├── Background job queue
  └── PDF preview (PDF.js)
        |
        v
Phase 7: Export & Polish
  ├── ZIP download (interior + cover)
  ├── KDP publishing guide/instructions
  └── Export status notifications
```

**Key dependency chain:** Content Editor → TOC Generator → PDF Engine. You can't generate a TOC without chapters. You can't generate a PDF without content. The KDP spec layer is independent and can be built in parallel with content, but must be complete before PDF generation.

## Sources

- **bookow.com KDP Cover Template Generator** — Active tool (verified 2026-03-30), provides spine width formulas, cover dimension calculations, and ISBN barcode generation. https://bookow.com/resources.php
- **pdf-lib** — Pure JavaScript PDF creation/modification library. Works in Node.js and browser. https://pdf-lib.js.org/
- **Tiptap** — Headless editor framework based on ProseMirror. 33k GitHub stars, 12.8M npm downloads/month. https://tiptap.dev/
- **Editor.js** — Block-style editor with clean JSON output. https://editorjs.io/
- **PDF.js (Mozilla)** — PDF rendering in browser for preview. https://mozilla.github.io/pdf.js/
- **docxtemplater** — DOCX generation/parsing library. https://docxtemplater.com/
- **KDP official help pages** — Could not be scraped (JS-rendered). Specifications should be verified manually at https://kdp.amazon.com/en_US/help before implementation.

---
*Architecture research for: Amazon KDP book publishing web app*
*Researched: 2026-03-30*
