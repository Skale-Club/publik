---
phase: 04-table-of-contents
plan: "03"
subsystem: table-of-contents
tags: [toc, pdf, bookmarks, generation]
dependency_graph:
  requires:
    - 04-02
  provides:
    - pdf-generation
    - toc-bookmarks
    - toc-page-component
  affects:
    - api/generate/pdf
    - pdf-rendering
tech_stack:
  added:
    - @react-pdf/renderer
  patterns:
    - PDF document generation
    - PDF bookmarks
    - Server-side PDF rendering
    - Two-pass render for page numbers
key_files:
  created:
    - src/lib/toc/transform.ts
    - src/components/pdf/toc-page.tsx
    - src/lib/pdf/toc-document.tsx
    - src/app/api/generate/pdf/route.ts
  modified:
    - package.json
    - pnpm-lock.yaml
decisions:
  - Used @react-pdf/renderer for PDF generation (standard for React PDF)
  - Implemented two-pass render pattern for TOC page numbers
  - Used bookmark prop on Text elements for PDF navigation
  - Created raw SQL queries to match existing project patterns
metrics:
  duration: 5 minutes
  completed_date: "2026-03-30"
  tasks_completed: 4
  files_created: 4
  files_modified: 2
---

# Phase 04 Plan 03: TOC Integration with PDF Output Pipeline Summary

Integrated TOC with PDF generation pipeline - includes visual TOC page and PDF bookmarks.

## Completed Tasks

| Task | Name | Status |
|------|------|--------|
| 1 | Create TOC transform utilities | ✓ Complete |
| 2 | Create visual TOC page component | ✓ Complete |
| 3 | Create PDF TOC document component | ✓ Complete |
| 4 | Update PDF generation endpoint | ✓ Complete |

## Key Implementation Details

### TOC Transform Utilities (`src/lib/toc/transform.ts`)
- `transformTOCForPDF()` - Converts TOCEntry[] to PDFTOCEntry[]
- `generateBookmark()` - Creates bookmark array for PDF navigation
- `getLevelIndentation()` - Calculates indentation based on heading level
- `generateDotLeaders()` - Creates dot leader string for visual TOC

### Visual TOC Page (`src/components/pdf/toc-page.tsx`)
- Displays "Table of Contents" title
- Lists entries with indentation based on level
- Dot leaders between title and page number
- Internal links to chapter anchors

### PDF Document (`src/lib/pdf/toc-document.tsx`)
- First page: Visual TOC
- Content pages: Chapters with bookmarks
- Bookmarks appear in PDF reader sidebar
- Page numbers in footer
- Handles two-pass render for unknown page numbers

### PDF Generation API (`src/app/api/generate/pdf/route.ts`)
- GET endpoint: `/api/generate/pdf?bookId=xxx`
- Fetches book, chapters, and TOC entries from database
- Generates PDF with TOC integration
- Returns PDF as downloadable stream

## Verification

- [x] TypeScript check passes
- [x] Transform utilities export verified
- [x] TOC page component verified
- [x] PDF document with bookmarks verified
- [x] API route includes TOC entries

## Deviation Notes

**None** - Plan executed exactly as written.

## Known Issues

The build has a pre-existing failure in `/api/import/pdf` related to `pdfjs-dist` library (DOMMatrix not defined in Node.js environment). This is unrelated to the TOC PDF integration.

## Dependencies Added

- `@react-pdf/renderer` v4.3.2 - PDF generation with bookmarks support
