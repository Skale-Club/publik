# Roadmap: Publik

## Overview

From project scaffolding to KDP-ready file export in 8 phases. The journey starts with a foundation layer that encodes KDP specifications as first-class data (not hardcoded values), moves through content creation and import, then tackles the hardest problem — generating print-compliant PDFs — and finishes with validation, export packaging, and a publishing guide for first-time KDP authors.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Book Management** - Project scaffolding, KDP spec registry, book CRUD, and dashboard
- [ ] **Phase 2: Content Editor** - Rich text editor with chapters, images, and auto-save
- [ ] **Phase 3: File Import** - Import manuscripts from DOCX, PDF, and image files
- [ ] **Phase 4: Table of Contents** - Auto-generated and editable TOC from chapter headings
- [ ] **Phase 5: Cover Management** - Cover image upload and back cover content
- [ ] **Phase 6: Interior PDF Generation** - KDP-compliant interior PDF with correct formatting
- [ ] **Phase 7: Cover PDF Generation** - Full cover PDF with calculated spine width
- [ ] **Phase 8: Export, Validation & Publishing Guide** - Validated file downloads and KDP walkthrough

## Phase Details

### Phase 1: Foundation & Book Management
**Goal**: Users can create and manage book projects with KDP printing options on an English-language dashboard, backed by a centralized KDP specification registry
**Depends on**: Nothing (first phase)
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, UX-01, UX-03
**Success Criteria** (what must be TRUE):
  1. User can create a new book project with a title from the dashboard
  2. User can edit book details (title, description) and select KDP printing options (trim size, paper type, ink type, cover finish)
  3. User can delete a book project from the dashboard
  4. User can see a dashboard listing all their book projects
  5. All UI text is displayed in English
  6. KDP specification registry provides centralized, queryable specifications for trim sizes, margin tables, and spine width calculations to all downstream components
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 01-01: Project scaffolding and database schema setup
- [ ] 01-02: KDP specification registry (trim sizes, margins, spine width formulas, bleed rules)
- [ ] 01-03: Book CRUD API and data layer
- [ ] 01-04: Dashboard page with book listing, create, edit, delete
- [ ] 01-05: Book settings form (trim size, paper type, ink type, cover finish)

### Phase 2: Content Editor
**Goal**: Users can write and edit book content with chapter management in a rich text editor that auto-saves
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can open a book and write content with rich text formatting (bold, italic, headings, lists, etc.)
  2. User can create, rename, reorder, and delete chapters within the book
  3. User can insert images into book content
  4. Content auto-saves as the user types and persists across browser sessions
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TipTap editor integration with rich text formatting
- [ ] 02-02: Chapter management (create, rename, reorder, delete)
- [ ] 02-03: Image insertion in editor content
- [ ] 02-04: Auto-save with debounced server sync

### Phase 3: File Import
**Goal**: Users can import existing manuscripts from DOCX, PDF, and image files into the editor
**Depends on**: Phase 2
**Requirements**: EDIT-05, EDIT-06, EDIT-07
**Success Criteria** (what must be TRUE):
  1. User can import a DOCX file and see its content loaded into the editor with formatting preserved
  2. User can import a PDF file and see its text content available in the editor
  3. User can import image files directly into the book content
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: DOCX import pipeline (mammoth → HTML → TipTap content blocks)
- [ ] 03-02: PDF import pipeline (text extraction → editor content)
- [ ] 03-03: Image file import into editor

### Phase 4: Table of Contents
**Goal**: Users have an auto-generated, editable table of contents that gets included in the final PDF output
**Depends on**: Phase 2
**Requirements**: TOC-01, TOC-02, TOC-03
**Success Criteria** (what must be TRUE):
  1. System automatically generates a TOC from chapter headings in the book
  2. User can manually edit TOC entries (rename, reorder, add, or remove entries)
  3. The TOC is included in the generated PDF output
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: Auto-generated TOC from chapter headings
- [ ] 04-02: Editable TOC UI (rename, reorder, add, remove)
- [ ] 04-03: TOC integration with PDF output pipeline

### Phase 5: Cover Management
**Goal**: Users can upload cover images and provide back cover content for their books
**Depends on**: Phase 1
**Requirements**: COV-01, COV-02
**Success Criteria** (what must be TRUE):
  1. User can upload a front cover image for their book
  2. User can upload a back cover image or enter back cover text
  3. System validates uploaded cover images against minimum dimension requirements
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: Front cover image upload with storage
- [ ] 05-02: Back cover image upload or text entry
- [ ] 05-03: Cover image dimension validation

### Phase 6: Interior PDF Generation
**Goal**: Users can generate a KDP-compliant interior PDF with correct margins, page numbers, headers/footers, font embedding, and exact trim dimensions
**Depends on**: Phase 2, Phase 4
**Requirements**: PDF-01, PDF-02, PDF-03, PDF-04, PDF-05
**Success Criteria** (what must be TRUE):
  1. User can generate an interior PDF with correct margins, bleed, and trim dimensions matching their book settings
  2. Generated PDF includes page numbers on every page
  3. Generated PDF includes configurable headers and footers
  4. All fonts are fully embedded in the generated PDF (not subset)
  5. PDF page dimensions exactly match the selected trim size
**Plans**: TBD

Plans:
- [ ] 06-01: Interior PDF engine with content layout pipeline
- [ ] 06-02: Page numbers, headers, and footers
- [ ] 06-03: Font embedding (bundled TTF/OTF, verified with pdffonts)
- [ ] 06-04: KDP margin and bleed compliance (mirror margins, gutter scaling by page count)
- [ ] 06-05: Trim size dimension accuracy

### Phase 7: Cover PDF Generation
**Goal**: Users can generate a single continuous KDP cover PDF (front + spine + back + bleed) with correctly calculated spine width
**Depends on**: Phase 5, Phase 6
**Requirements**: COV-03, COV-04
**Success Criteria** (what must be TRUE):
  1. System generates a single continuous cover PDF (front + spine + back + bleed) with correct KDP dimensions
  2. Spine width is accurately calculated from the final interior page count and selected paper type
**Plans**: TBD

Plans:
- [ ] 07-01: Spine width calculation from page count and paper type
- [ ] 07-02: Full cover PDF composition (bleed + back + spine + front + bleed)

### Phase 8: Export, Validation & Publishing Guide
**Goal**: Users can download validated, KDP-ready files and access step-by-step guidance for publishing on Amazon KDP
**Depends on**: Phase 6, Phase 7
**Requirements**: EXP-01, EXP-02, EXP-03, EXP-04, UX-02
**Success Criteria** (what must be TRUE):
  1. User can download the interior PDF file
  2. User can download the cover PDF file
  3. System validates generated files against KDP specifications (dimensions, margins, font embedding) and reports any compliance issues
  4. User can download a ZIP package containing all files needed for KDP upload
  5. User can access a step-by-step publishing guide explaining how to upload files to Amazon KDP
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 08-01: Individual file downloads (interior PDF, cover PDF)
- [ ] 08-02: KDP compliance validation engine
- [ ] 08-03: ZIP package export (interior + cover + checklist)
- [ ] 08-04: Step-by-step KDP publishing guide page

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Book Management | 0/5 | Not started | - |
| 2. Content Editor | 0/4 | Not started | - |
| 3. File Import | 0/3 | Not started | - |
| 4. Table of Contents | 0/3 | Not started | - |
| 5. Cover Management | 0/3 | Not started | - |
| 6. Interior PDF Generation | 0/5 | Not started | - |
| 7. Cover PDF Generation | 0/2 | Not started | - |
| 8. Export, Validation & Publishing Guide | 0/4 | Not started | - |
