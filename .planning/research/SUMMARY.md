# Project Research Summary

**Project:** Publik — Amazon KDP Book Publishing Web App
**Domain:** Document generation pipeline / content management for print-on-demand publishing
**Researched:** 2026-03-30
**Confidence:** MEDIUM-HIGH

## Executive Summary

Publik is a web-native book publishing tool that converts authored content into KDP-compliant print-ready PDFs. At its core, this is a **content management + document generation pipeline**: users write or import content (DOCX), the system stores it as structured JSON blocks, and a server-side layout engine renders it into precisely formatted PDFs that meet Amazon KDP's trim size, margin, bleed, spine width, and font embedding requirements. The critical technical challenge is not the web framework or the editor — it's the PDF generation engine that must produce output passing KDP's submission checks.

The recommended approach is a Next.js 15.5 monolith with TipTap 3.x for rich editing and @react-pdf/renderer 4.x for PDF generation, backed by Drizzle ORM with SQLite (personal use) or PostgreSQL (SaaS scaling). The architecture should follow a **pipeline pattern** where content flows through discrete, testable stages: raw content → parsed blocks → paginated layout → PDF bytes. All KDP specifications (trim sizes, margins, spine width formulas) must live in a centralized specification registry — never hardcoded in the PDF engine — so they can be updated independently.

The key risks center on **KDP specification accuracy**. Spine width depends on final page count (chicken-and-egg problem), gutter margins scale with page count in discrete tiers, and bleed settings fundamentally change page geometry. Research confidence on exact margin values is LOW — they must be verified against current KDP specs before implementation. Font embedding failures are the most common reason for KDP rejections and must be validated programmatically. The recommended mitigation is to build a KDP compliance validation step that runs before export, catching issues before users encounter KDP rejections.

## Key Findings

### Recommended Stack

All core technologies are mature, well-documented, and have HIGH confidence from official sources. The stack is optimized for a single-developer personal tool that can scale to SaaS.

**Core technologies:**
- **Next.js 15.5** — Full-stack framework with App Router, Server Actions, and React 19. Chosen over 16.x (only 5 months old, breaking changes) for stability and community resources.
- **TipTap 3.x** — Headless editor on ProseMirror. Modular extensions, built-in TOC generation, HTML/JSON output feeds directly into PDF pipeline. Chosen over Lexical (less mature) and Slate (API churn).
- **@react-pdf/renderer 4.x** — React-based PDF engine with auto page breaks, headers/footers, page numbers, orphan/widow protection, font embedding. Chosen over Puppeteer (no Chrome dependency) and jsPDF (low-level API).
- **Drizzle ORM** — TypeScript-first, lightweight, works with both SQLite and PostgreSQL. Seamless migration path from personal use to SaaS.
- **Better Auth** — Auth.js successor, recommended by the Auth.js team itself. Comprehensive features (2FA, social sign-on, session management) with first-class Next.js support.
- **mammoth** — DOCX→HTML converter (2.7M weekly downloads). Output feeds directly into TipTap via `editor.commands.setContent()`.

**See [STACK.md](./STACK.md) for full version matrix, installation commands, and alternatives considered.**

### Expected Features

**Must have (table stakes — missing = product feels incomplete):**
- Manuscript content editor with chapters and rich text formatting
- DOCX import (most authors write in Word/Google Docs first)
- Auto-generated + editable Table of Contents
- Front matter templates (title page, copyright, dedication)
- KDP-compliant interior PDF export (the core value proposition)
- KDP-compliant cover PDF export with spine calculation
- Trim size selection, bleed toggle, ink/paper type selection
- Cover image upload with dimension validation
- Book CRUD (list/create/edit/delete)
- Auto-save
- KDP publishing guide/wizard for first-time publishers

**Should have (competitive differentiators):**
- **Web-native** — no install, works in any browser (Vellum is Mac-only, Kindle Create is desktop)
- **Portuguese-first UX** — underserved Brazilian market, no major competitor offers this
- **KDP compliance validation** — catch errors before export instead of after KDP rejection
- **One-click export package** — ZIP with interior + cover + next-steps checklist

**Defer (v2+):**
- In-browser book preview (high complexity; users can download PDF and check)
- EPUB/eBook export (different domain, adds massive scope)
- Hardcover support (natural extension, low demand)
- Collaboration/sharing (future SaaS differentiator)
- Image upload within content (DOCX with embedded images sufficient for MVP)

**See [FEATURES.md](./FEATURES.md) for full competitor matrix and feature dependency graph.**

### Architecture Approach

The system follows a **pipeline architecture** with four layers: Presentation (dashboard, editor, cover manager, preview) → API (REST endpoints) → Service (import, TOC, PDF engines, export) → Data (metadata, chapter content, assets). The most critical architectural decision is storing content as **structured JSON blocks** (not raw HTML) to preserve semantic meaning for chapter detection, TOC generation, and multi-format rendering.

**Major components:**
1. **KDP Specification Registry** — All trim sizes, margin tables, spine width formulas, and bleed rules as centralized TypeScript constants. The PDF engine reads from this registry, never hardcoded values. This is the single most important architectural pattern for maintainability.
2. **Content Editor (TipTap)** — Rich text editing with auto-save, debounced server sync, and chapter management. Editor state is the source of truth; JSON format is the contract between editor and storage.
3. **Interior PDF Engine** — Pipeline: ContentBlocks → layout objects → paginated pages → PDF bytes. Handles word wrapping, page breaks, chapter-start positioning, running headers/footers, page numbers, mirror margins, and font embedding. Runs server-side as a background job.
4. **Cover PDF Engine** — Composes a single continuous PDF (front + spine + back + bleed) with exact dimensions calculated from trim size, page count, and paper type. Validates uploaded cover dimensions.
5. **Import Service** — DOCX→HTML (mammoth) → parse to ContentBlocks → save chapters. Includes sanitization to strip hidden characters and normalize formatting.

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for project structure, data flow diagrams, anti-patterns, and scaling considerations.**

### Critical Pitfalls

1. **Spine width depends on final page count** — Cover dimensions can't be calculated until the interior is finalized. Design spine width as always-recomputed at export time, never stored. Validate page count parity between interior and cover before delivery.
2. **Gutter margins scale with page count in discrete tiers** — Adding 3 pages can jump the gutter from 0.375" to 0.5", requiring full PDF regeneration. Always compute margins from final page count; warn users near tier boundaries.
3. **Bleed fundamentally changes page geometry** — A 6×9" book with bleed becomes 6.125"×9.25". This isn't a checkbox; it's a first-class concept in the data model that affects all downstream calculations.
4. **Cover must be a single continuous PDF** — Not three separate files. Layout: [bleed][back cover][spine][front cover][bleed]. Validate uploaded covers against computed dimensions.
5. **Font embedding failures are the #1 cause of KDP rejections** — All fonts must be fully embedded (not subset). Bundle TTF/OTF files with the app; never rely on system fonts or CSS @import. Verify with `pdffonts` after generation.

**See [PITFALLS.md](./PITFALLS.md) for full "looks done but isn't" checklist, performance traps, security considerations, and recovery strategies.**

## Implications for Roadmap

Based on combined research, the suggested phase structure follows the natural dependency chain identified in ARCHITECTURE.md while front-loading the critical pitfalls from PITFALLS.md into the foundation phase.

### Phase 1: Foundation & KDP Specification Layer
**Rationale:** The data model must encode bleed, paper type, and trim size as first-class entities from day one (Pitfall #3). The KDP spec registry must exist before any PDF work begins (Pitfall #1, #2). Book CRUD is the prerequisite for all other features.
**Delivers:** Book creation/editing with trim size, paper type, bleed toggle. KDP specification registry (trim sizes, margin tables, spine width formulas, cover dimension calculator). Database schema with Drizzle. Basic dashboard UI. Font registry setup.
**Addresses:** Book CRUD, trim size selection, bleed toggle, ink/paper type selection (FEATURES)
**Avoids:** Hardcoded KDP specs, wrong data model for bleed/margins, font embedding setup debt (PITFALLS #1, #2, #3, #6)
**Uses:** Next.js 15.5, Drizzle ORM, SQLite, TypeScript strict mode, zod (STACK)

### Phase 2: Content & Import
**Rationale:** Users need to get content into the system before anything can be exported. DOCX import is the highest-value table stake feature — most authors write in Word first. The editor must store structured JSON, not HTML (Architecture anti-pattern #1).
**Delivers:** TipTap editor integration with chapter management. DOCX import pipeline (mammoth → HTML → ContentBlocks). Auto-save with debounced server sync. Content sanitization (strip hidden characters, normalize whitespace).
**Addresses:** Manuscript editor, DOCX import, auto-save (FEATURES)
**Avoids:** Storing content as HTML, trusting imported content without sanitization, browser-based PDF generation (ARCHITECTURE anti-patterns, PITFALLS integration gotchas)
**Uses:** TipTap 3.x, mammoth, uploadthing (STACK)

### Phase 3: TOC & Front Matter
**Rationale:** TOC generation depends on chapter detection from Phase 2. Front matter templates are low complexity and complete the content structure before PDF generation begins.
**Delivers:** Auto-generated TOC from chapter headings. Editable TOC (reorder, rename). Front matter templates (title page, copyright, dedication). Back cover text editor.
**Addresses:** Auto TOC, front matter templates, back cover text editor (FEATURES)
**Avoids:** Placeholder text surviving in output (PITFALLS UX pitfall)
**Uses:** TipTap TOC extension (STACK)

### Phase 4: PDF Generation
**Rationale:** This is the hardest phase and the core value proposition. It depends on the KDP spec registry (Phase 1), structured content (Phase 2), and TOC/front matter (Phase 3). PDF generation must run as background jobs to avoid timeouts (Architecture pattern #3).
**Delivers:** Interior PDF engine with correct margins, page numbers, headers/footers, mirror margins, font embedding, chapter-start page positioning. Cover PDF engine with spine width calculation from page count. Background job queue for generation. Cover image upload with dimension validation.
**Addresses:** KDP-compliant interior PDF, KDP-compliant cover PDF, cover image upload (FEATURES)
**Avoids:** Synchronous PDF generation, wrong spine width, font embedding failures, cover as separate files (PITFALLS #1, #4, #6; ARCHITECTURE anti-patterns #2, #4)
**Uses:** @react-pdf/renderer 4.x, pdf-lib, @pdf-lib/fontkit (STACK)

### Phase 5: Export & Validation
**Rationale:** With PDF generation working, this phase adds the validation safety net and delivery mechanism. KDP compliance validation is a key differentiator — existing tools don't catch errors before export.
**Delivers:** KDP compliance validation (margins, resolution, page count limits, font embedding, placeholder text check). ZIP download (interior + cover + checklist). Export status notifications. Cover template guide (downloadable image showing correct dimensions).
**Addresses:** One-click export package, KDP compliance validation (FEATURES differentiators)
**Avoids:** Users discovering errors only after KDP rejection, wrong cover dimensions (PITFALLS #4, #5; "looks done but isn't" checklist)
**Uses:** pdf-lib post-processing, sonner notifications (STACK)

### Phase 6: Polish & Guidance
**Rationale:** Target users are first-time KDP publishers who need hand-holding. This phase wraps the functional tool with the UX that makes it accessible to non-technical Brazilian authors.
**Delivers:** KDP publishing wizard (step-by-step guide). Portuguese-first UX. Progressive disclosure for settings (start with defaults, advanced hidden). Live page count estimate with margin threshold warnings.
**Addresses:** KDP publishing guide, Portuguese-first UX (FEATURES differentiators)
**Avoids:** Overwhelming first-time users, page count surprises (PITFALLS UX pitfalls)
**Uses:** nuqs (URL state), lucide-react (icons), sonner (toasts) (STACK)

### Phase Ordering Rationale

- **Foundation first** because the data model decisions (bleed, paper type, trim size as first-class entities) are expensive to retrofit. The KDP spec registry is a standalone module with no external dependencies — build it early so the PDF engine has something to read from.
- **Content before PDF** because you can't generate a PDF without structured content. The editor→storage→retrieval round-trip must work reliably before adding the PDF pipeline.
- **TOC between content and PDF** because it's a lightweight feature that depends on chapter detection but is needed by the PDF engine (TOC pages go in the interior).
- **PDF generation is the keystone phase** — it consumes everything built before it and is the single highest-risk, highest-complexity deliverable. Isolating it in its own phase allows focused effort and research.
- **Validation after PDF** because validation logic needs the PDF engine to produce output to validate against.
- **Polish last** because it requires the functional tool to be complete before adding guidance layers on top.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (PDF Generation):** This is the highest-risk phase. The layout engine (word wrapping, orphan/widow protection, chapter-start positioning on right-hand pages) has sparse documentation for @react-pdf/renderer advanced use cases. Font embedding behavior with various TTF/OTF files needs hands-on testing. **Recommend: run `/gsd-research-phase` for PDF layout engine specifics.**
- **Phase 1 (Foundation):** KDP margin values are LOW confidence (approximations from community sources). Must verify against current KDP specs at https://kdp.amazon.com/en_US/help before building the spec registry. **Recommend: manual verification of margin tables during Phase 1 planning.**

Phases with standard patterns (skip research-phase):
- **Phase 2 (Content & Import):** TipTap editor integration and mammoth DOCX import are well-documented with abundant examples.
- **Phase 3 (TOC & Front Matter):** TipTap's built-in TOC extension handles auto-generation. Front matter is simple template rendering.
- **Phase 5 (Export & Validation):** ZIP packaging and pdf-lib post-processing are straightforward. Validation rules are derived from KDP specs (already researched).
- **Phase 6 (Polish & Guidance):** Standard UX patterns — progressive disclosure, wizard UI, toast notifications.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies have official documentation, active maintenance, and HIGH-confidence sources. Next.js 15.5 is a stable major version. TipTap 3.x and @react-pdf/renderer 4.x are battle-tested. |
| Features | HIGH | Feature list derived from KDP official help pages (HIGH confidence) and competitor analysis. MVP scope is well-defined with clear table stakes vs. differentiators. |
| Architecture | MEDIUM | Architecture patterns (pipeline, structured content, background jobs) are sound and well-established. **However:** KDP official help pages are JS-rendered and couldn't be scraped. Specifications (margins, exact trim size list) come from bookow.com and community sources — some are LOW confidence. |
| Pitfalls | HIGH | Pitfall identification is based on KDP official troubleshooting guides (HIGH confidence) and common failure patterns well-documented in self-publishing communities. The "looks done but isn't" checklist is actionable and specific. |

**Overall confidence:** MEDIUM-HIGH

The technology choices, feature scope, and architectural patterns are solid. The main uncertainty is **KDP specification accuracy** — specifically the exact margin values per page-count tier and the complete current list of supported trim sizes. These must be manually verified against KDP's help pages during Phase 1 planning.

### Gaps to Address

- **Exact KDP margin values:** Research provides approximate values from community sources. Must verify against current KDP specifications at https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6 before building the spec registry. If exact values differ, update `domain/kdp/margins.ts`.
- **@react-pdf/renderer advanced layout capabilities:** Research confirms basic features (page breaks, headers, fonts) but advanced features like orphan/widow control, precise text measurement, and complex table layout within PDF pages need hands-on prototyping. May need Puppeteer as a fallback for edge cases.
- **PDF/X-1a compliance:** PITFALLS.md recommends PDF/X-1a output for best KDP compatibility, but @react-pdf/renderer doesn't natively produce PDF/X. Need to evaluate whether pdf-lib post-processing can add PDF/X metadata or if this is a KDP "nice-to-have" vs. requirement.
- **Complete KDP trim size list:** Architecture provides 15 sizes from bookow.com. KDP may have added or removed sizes. Verify the complete list during Phase 1.
- **Portuguese KDP terminology:** The Portuguese-first UX differentiator requires mapping KDP English terminology to PT-BR equivalents. No research was done on this — will need attention during Phase 6.

## Sources

### Primary (HIGH confidence)
- Next.js official blog — v15.5, v16, v16.2 release posts
- TipTap 3.x documentation — tiptap.dev
- @react-pdf/renderer v4 documentation — react-pdf.org
- Better Auth official docs and Auth.js merger announcement (Sep 2025)
- KDP Help Center — Print Options, Manuscript Formatting, Cover Creation, Submission Guidelines, Formatting Issues
- KDP Cover Calculator — kdp.amazon.com/cover-calculator
- Drizzle ORM documentation — orm.drizzle.team
- mammoth npm registry — 2.7M weekly downloads

### Secondary (MEDIUM confidence)
- bookow.com KDP Cover Template Generator — spine width formulas, cover dimension calculations (active tool, verified 2026-03-30)
- Vellum and Atticus marketing pages — competitor feature comparison
- pdf-lib npm registry — feature-complete but last published ~4 years ago
- uploadthing.com — features and pricing

### Tertiary (LOW confidence)
- Margin values per page-count tier — derived from community sources, not verified against current KDP specs
- Competitor feature comparison from kindlepreneur.com — not independently verified

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
