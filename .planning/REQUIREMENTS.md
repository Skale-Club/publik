# Requirements: Publik

**Defined:** 2026-03-30
**Core Value:** Generate files ready for Amazon KDP publication from book content managed in the admin panel

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Book Management

- [ ] **BOOK-01**: User can create a new book project with a title
- [ ] **BOOK-02**: User can edit book project details (title, description)
- [ ] **BOOK-03**: User can delete a book project
- [ ] **BOOK-04**: User can select trim size from KDP-supported options (6x9, 5.5x8.5, 8.5x11, etc.)
- [ ] **BOOK-05**: User can select paper type (white/cream) and ink type (B&W/color)
- [ ] **BOOK-06**: User can select cover finish (glossy/matte)

### Content Editor

- [ ] **EDIT-01**: User can write and edit book content in a rich text editor
- [x] **EDIT-02**: User can create and manage chapters/sections within a book
- [ ] **EDIT-03**: User can insert images into book content
- [ ] **EDIT-04**: Content auto-saves as user types
- [ ] **EDIT-05**: User can import DOCX files into the editor
- [ ] **EDIT-06**: User can import PDF files into the editor
- [ ] **EDIT-07**: User can import images into the editor

### Table of Contents

- [ ] **TOC-01**: System auto-generates table of contents from chapter headings
- [ ] **TOC-02**: User can manually edit TOC entries
- [ ] **TOC-03**: TOC is included in the generated PDF output

### PDF Generation

- [ ] **PDF-01**: User can generate a KDP-compliant interior PDF with correct margins, bleed, and trim dimensions
- [ ] **PDF-02**: Generated PDF includes page numbers
- [ ] **PDF-03**: Generated PDF includes headers and footers
- [ ] **PDF-04**: Generated PDF embeds all fonts correctly (KDP requirement)
- [ ] **PDF-05**: PDF dimensions match selected trim size exactly

### Cover

- [ ] **COV-01**: User can upload a front cover image
- [ ] **COV-02**: User can upload a back cover image or enter back cover text
- [ ] **COV-03**: System generates a full cover PDF (front + spine + back + bleed) with correct KDP dimensions
- [ ] **COV-04**: Spine width is calculated from page count and paper type

### Export & Validation

- [ ] **EXP-01**: User can download the interior PDF
- [ ] **EXP-02**: User can download the cover PDF
- [ ] **EXP-03**: System validates generated files against KDP specifications (dimensions, margins, font embedding)
- [ ] **EXP-04**: User can download a ZIP package containing all files needed for KDP upload

### Dashboard & UX

- [ ] **UX-01**: User can see a dashboard listing all book projects
- [ ] **UX-02**: User can access a step-by-step publishing guide explaining the KDP process
- [ ] **UX-03**: UI is in English

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Editor

- **EDIT-08**: Drag-and-drop chapter reordering
- **EDIT-09**: Content version history
- **EDIT-10**: Import EPUB files
- **EDIT-11**: Batch import (multiple files at once)

### Advanced PDF

- **PDF-06**: In-browser PDF preview
- **PDF-07**: Orphan/widow protection
- **PDF-08**: Custom fonts support (user-uploaded TTF/OTF)

### Advanced Cover

- **COV-05**: Cover preview in browser
- **COV-06**: Barcode placement guide

### Multi-Author & SaaS

- **BOOK-07**: Support for multiple author profiles
- **BOOK-08**: Book templates (novel, textbook, illustrated)
- **BOOK-09**: Clone book project

## Out of Scope

| Feature | Reason |
|---------|--------|
| Visual cover editor | KDP provides free Cover Creator; Canva/Photoshop exist; too complex for v1 |
| Direct KDP publishing | Tool generates files, user uploads to KDP manually |
| Mobile app | Web-first, mobile later |
| eBook / Kindle format | Print-only for v1 |
| Multi-author support | Personal use first, scale later |
| Portuguese UI | English-first for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOK-01 | Phase 1 | Pending |
| BOOK-02 | Phase 1 | Pending |
| BOOK-03 | Phase 1 | Pending |
| BOOK-04 | Phase 1 | Pending |
| BOOK-05 | Phase 1 | Pending |
| BOOK-06 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Pending |
| EDIT-02 | Phase 2 | Complete |
| EDIT-03 | Phase 2 | Pending |
| EDIT-04 | Phase 2 | Pending |
| EDIT-05 | Phase 3 | Pending |
| EDIT-06 | Phase 3 | Pending |
| EDIT-07 | Phase 3 | Pending |
| TOC-01 | Phase 4 | Pending |
| TOC-02 | Phase 4 | Pending |
| TOC-03 | Phase 4 | Pending |
| PDF-01 | Phase 6 | Pending |
| PDF-02 | Phase 6 | Pending |
| PDF-03 | Phase 6 | Pending |
| PDF-04 | Phase 6 | Pending |
| PDF-05 | Phase 6 | Pending |
| COV-01 | Phase 5 | Pending |
| COV-02 | Phase 5 | Pending |
| COV-03 | Phase 7 | Pending |
| COV-04 | Phase 7 | Pending |
| EXP-01 | Phase 8 | Pending |
| EXP-02 | Phase 8 | Pending |
| EXP-03 | Phase 8 | Pending |
| EXP-04 | Phase 8 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 8 | Pending |
| UX-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
