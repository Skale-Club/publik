# Feature Landscape

**Domain:** Amazon KDP book publishing tool (web app)
**Researched:** 2026-03-30

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Manuscript content editor** | Users need a place to write/edit their book content | High | Must support chapters, text formatting (bold, italic, headings), and paragraph indentation. Rich text editor with good UX is non-trivial. |
| **Import from external files (DOCX)** | Most authors already write in Word/Google Docs. Re-typing is a dealbreaker. | High | DOCX parsing is well-documented but edge cases are numerous (styles, embedded images, tables, tracked changes). PDF import is a bonus. |
| **Upload cover image** | KDP requires a cover. Authors typically design covers externally (Canva, Photoshop) and upload a finished image. | Low | Already scoped as out-of-scope for visual cover editor. Upload + validation (resolution, dimensions) is sufficient. |
| **Table of Contents (auto-generated + editable)** | Every book needs a TOC. KDP requires it for eBooks and recommends it for print. Auto-generation saves enormous time. | Medium | Auto-detect chapter headings, generate TOC, allow manual reorder/edit. Must handle page numbers for print TOC. |
| **Front matter templates** | Title page, copyright page, dedication page are expected in any book. Users don't know what these are. | Low | Pre-built templates for title page, copyright page, dedication. Fill-in-the-blank approach. |
| **PDF export (KDP-compliant interior)** | This is the core value proposition. The tool must output a PDF that passes KDP's submission checks. | High | Must handle: correct trim size, margins (gutter scales with page count), bleed settings, embedded fonts, page numbers, headers, mirror margins. This is the hardest feature. |
| **Cover PDF export (KDP-compliant)** | KDP requires a single PDF with back cover + spine + front cover. Spine width depends on page count. | Medium | Must calculate spine width from page count and paper type. Generate full-wrap cover PDF with correct dimensions. |
| **Trim size selection** | KDP supports ~20 trim sizes. Users need to choose. 6x9" is default/most common. | Low | Dropdown or preset selection. Trim size affects all layout calculations downstream. |
| **Bleed toggle** | Books with images reaching page edges need bleed. Users may not understand this. | Low | Simple toggle. When enabled, page size increases by 0.125" on each edge. Must recalculate all layout. |
| **Ink/paper type selection** | Black/white vs color, white vs cream paper. Affects printing cost and margin requirements. | Low | Radio buttons. Maps to KDP's options: B&W white, B&W cream, standard color, premium color. |
| **Book management (list/create/edit/delete)** | Users will have multiple books/projects. Need a dashboard to manage them. | Low | Standard CRUD. List books, create new, edit existing, delete. |
| **Auto-save** | Losing work is catastrophic. Auto-save is expected in any modern web editor. | Medium | Periodic saves + conflict resolution. Backend storage required. |
| **KDP publishing guide/wizard** | Target users have never published on KDP. They need step-by-step guidance. | Low | Contextual help, tooltips, or a guided wizard explaining what each field means and what KDP expects. |

## Differentiators

Features that set Publik apart from existing tools (Vellum, Atticus, Kindle Create). Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Web-native (no install)** | Vellum is Mac-only. Kindle Create is desktop download. Atticus is a PWA but still requires "install." Publik works in any browser, anywhere. | Low (by nature of being a web app) | This is already a core architectural decision. It IS the differentiator. No other major tool is a pure web app. |
| **Portuguese-first UX** | Brazilian market is underserved by English-only tools. KDP has a PT-BR interface but tools are English-centric. | Low | All UI copy in Portuguese. KDP guide in Portuguese. Huge competitive advantage for Brazilian authors. |
| **KDP compliance validation** | Before exporting, validate the book against KDP's requirements (margins, resolution, page count limits, font embedding) and surface clear error messages. | Medium | Existing tools don't do this well. Authors discover errors only after KDP rejects their upload. Catching errors before export saves enormous frustration. |
| **Cover spine calculator** | Automatically calculate correct spine width based on page count + paper type, and generate the full cover template dimensions. | Low | KDP provides a cover calculator, but integrating it into the tool is seamless. Formula is simple: page_count * paper_multiplier. |
| **Contracapa/back cover text editor** | Dedicated field for back cover content (synopsis, author bio, barcode area). Guided with KDP's requirements. | Low | KDP's Cover Creator handles this, but most authors upload custom covers. A guided back-cover text area helps authors who upload a pre-made cover image. |
| **Book preview (in-browser)** | Show the user how their book will look in print layout before downloading the PDF. | High | Rendering a WYSIWYG preview in-browser is complex but extremely valuable. Even a basic preview (page layout, chapter starts, TOC) would differentiate. |
| **Collaboration / sharing** | Allow sharing a book project with an editor or co-author. | High | Future differentiator for SaaS scaling. Not for MVP but architect for it. |
| **One-click export package** | Download a ZIP with interior PDF + cover PDF + a checklist of what to do next on KDP. | Low | Bundles the outputs into a clear, actionable package. Reduces cognitive load for first-time publishers. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Visual cover editor / designer** | Extremely complex (image manipulation, text layout, color management). KDP already provides Cover Creator for free. Competing with Canva/Photoshop is a losing battle. | Accept cover image uploads only. Guide users to KDP Cover Creator or external tools. Already scoped as out-of-scope in PROJECT.md. |
| **Direct KDP publishing / API integration** | KDP does not have a public publishing API. Would require browser automation or unofficial methods. Fragile, against TOS, high maintenance. | Generate files ready for manual upload. Provide clear step-by-step guide. Already scoped as out-of-scope. |
| **eBook format (EPUB/MOBI)** | Adds enormous complexity (reflowable layout, device preview, Kindle-specific quirks). Different skill set from print layout. | Focus on print (paperback) only for MVP. EPUB can be a future milestone if demand exists. |
| **Hardcover support** | Different cover specifications, different page count limits (75-550 vs 24-828), less common for self-publishers. | Paperback only for MVP. Hardcover is a natural extension later. |
| **Rich collaborative editing (Google Docs style)** | Extremely complex (OT/CRDT, real-time sync). Overkill for personal use / MVP. | Single-user editing with save/versioning. Collaboration is a future feature. |
| **Payment / royalty tracking** | Not a KDP function. Would require integrating with KDP's reporting (which is separate from the book creation workflow). | Out of scope. Users manage royalties on KDP directly. |
| **Desktop / mobile app** | Increases development surface dramatically. Web-first was explicitly chosen. | Progressive web app if offline is needed. Mobile-responsive web for viewing (not editing). Already scoped as out-of-scope. |

## Feature Dependencies

```
Book creation (CRUD) → All other features (need a book to work with)

Trim size + ink/paper selection → Margin calculations → PDF export
                                     ↘ Spine width calculation → Cover PDF export

Content import (DOCX) → Chapter detection → TOC auto-generation
                                              ↘ PDF layout

Front matter templates → PDF export (included in interior)

Cover image upload → Cover PDF export

Bleed toggle → PDF page size calculation → PDF export

Page count (from content) → Gutter margin → Spine width → Cover PDF

KDP validation rules → PDF export + Cover export (pre-submission checks)
```

### Critical Path for MVP

The minimum viable feature chain is:

1. **Create book** (title, author, trim size, ink/paper)
2. **Add content** (import DOCX or write in editor)
3. **System detects chapters** → auto-generates TOC
4. **Upload cover image**
5. **Export PDF package** (interior + cover)

Everything else is either enhancement or can be deferred.

## MVP Recommendation

Prioritize:
1. Book CRUD with trim size / ink-paper selection (table stakes)
2. DOCX import with chapter detection (table stakes - highest value)
3. In-browser content editor (basic - table stakes)
4. Auto-generated + editable TOC (table stakes)
5. Front matter templates (title, copyright, dedication) (table stakes)
6. Cover image upload + validation (table stakes)
7. KDP-compliant PDF interior export (core value - hardest feature)
8. KDP-compliant cover PDF export with spine calculation (core value)
9. KDP publishing guide/wizard (table stakes for target user)
10. KDP compliance validation before export (differentiator, medium effort)
11. One-click export package (differentiator, low effort)

Defer:
- **In-browser book preview**: High complexity, nice-to-have. Users can download PDF and check.
- **Collaboration**: High complexity, no demand for personal use MVP.
- **EPUB/eBook export**: Different domain, adds massive scope.
- **Hardcover support**: Low demand, natural extension.
- **Image upload within content**: High complexity. DOCX with embedded images is sufficient for MVP.

## Competitor Feature Matrix

| Feature | Vellum | Atticus | Kindle Create | Publik (target) |
|---------|--------|---------|---------------|-----------------|
| Platform | Mac only | Win/Mac/Linux (PWA) | Win/Mac | Web (any browser) |
| Price | $249.99 | $147 | Free | TBD (SaaS future) |
| Writing editor | No | Yes | No | Yes |
| Import DOCX | Yes | Yes | Yes | Yes |
| Print PDF | Yes (PDF/X-1a) | Yes | Yes | Yes |
| eBook export | EPUB, MOBI | EPUB | KPF, EPUB | No (MVP) |
| Book themes/styles | 26 | 17+ | Limited | Minimal (MVP) |
| TOC auto-generation | Yes | Yes | Yes | Yes |
| Cover design | No (upload only) | No (upload only) | Cover Creator | Upload + guide |
| Web-based | No | PWA | No | Yes (core diff) |
| Portuguese UX | No | No | Partial | Yes (core diff) |
| KDP validation | No | No | Partial | Yes (planned) |

## Sources

- KDP Help Center - Print Options: https://kdp.amazon.com/en_US/help/topic/G201834180 (HIGH confidence, official)
- KDP Help Center - Format Front/Body/Back Matter: https://kdp.amazon.com/en_US/help/topic/GDDYZG2C7RVF5N9J (HIGH confidence, official)
- KDP Help Center - Create Paperback Cover: https://kdp.amazon.com/en_US/help/topic/G201953020 (HIGH confidence, official)
- KDP Help Center - Set Trim Size, Bleed, Margins: https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6 (HIGH confidence, official)
- KDP Help Center - Cover Creator: https://kdp.amazon.com/en_US/help/topic/G201113520 (HIGH confidence, official)
- KDP Help Center - Table of Contents: https://kdp.amazon.com/en_US/help/topic/G201605700 (HIGH confidence, official)
- Vellum website: https://vellum.pub/ (MEDIUM confidence, marketing page)
- Atticus website: https://www.atticus.io/ (MEDIUM confidence, marketing page)
- Competitor feature comparison from Atticus vs Vellum page: https://kindlepreneur.com/atticus-vs-vellum/ (LOW confidence, not verified)
