# Phase 6: Interior PDF Generation - Research

**Researched:** 2026-03-30
**Domain:** PDF generation for Amazon KDP compliance
**Confidence:** HIGH

## Summary

Phase 6 focuses on generating KDP-compliant interior PDFs with correct margins, page numbers, headers/footers, font embedding, and exact trim dimensions. The project already has a foundation with @react-pdf/renderer v4.3.2 installed and basic PDF generation in place (`/src/app/api/generate/pdf/route.ts`). Key gaps exist: only A4/LETTER sizes supported (KDP has 16 trim sizes), only Helvetica font (no custom font embedding), basic margins (not KDP-compliant mirror margins).

**Primary recommendation:** Extend existing PDF pipeline with KDP trim size mapping, implement mirror margins from `/src/domain/kdp/margins.ts`, add custom font embedding support, and enhance headers/footers with configurable options.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PDF-01 | User can generate a KDP-compliant interior PDF with correct margins, bleed, and trim dimensions | KDP trim sizes in `/src/domain/kdp/trim-sizes.ts` (16 sizes), margins in `/src/domain/kdp/margins.ts` (page-count scaled) |
| PDF-02 | Generated PDF includes page numbers | Existing implementation with `render` prop shows "Page X of Y" pattern |
| PDF-03 | Generated PDF includes headers and footers | Need to implement configurable header/footer component |
| PDF-04 | Generated PDF embeds all fonts correctly (KDP requirement) | Need to implement Font.register with bundled KDP-approved fonts |
| PDF-05 | PDF dimensions match selected trim size exactly | Current implementation only maps to A4/LETTER, needs full 16-size mapping |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | Book interior PDF generation | React-based PDF generation with page wrapping, headers/footers, bookmarks. 2.3M weekly downloads. |
| pdf-lib | (not installed) | PDF post-processing | For metadata, merging, more complex operations |
| zod | 4.3.6 | Runtime validation | Validate PDF generation parameters |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-pdf/renderer | 4.3.2 | Font.register for custom fonts | Always — KDP requires embedded fonts |
| KDP domain modules | Existing | trim-sizes, margins, bleed | Use existing `/src/domain/kdp/` modules |

**Installation:**
```bash
# Already installed
pnpm add @react-pdf/renderer

# For advanced PDF operations (future phases)
pnpm add pdf-lib @pdf-lib/fontkit
```

**Version verification:** `@react-pdf/renderer@4.3.2` installed (from package.json, published Dec 29 2025).

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── pdf/
│       ├── interior-document.tsx   # Main PDF document component
│       ├── toc-document.tsx        # Existing TOC (reused)
│       ├── components/
│       │   ├── page-header.tsx     # Configurable header
│       │   ├── page-footer.tsx     # Footer with page numbers
│       │   └── chapter-content.tsx # Chapter rendering
│       └── fonts.ts                # Font registration
├── app/api/generate/pdf/
│   └── route.ts                    # Existing - extend for full KDP support
└── domain/kdp/                    # Existing - use existing trim/margin/bleed modules
```

### Pattern 1: KDP-Compliant Interior PDF Generation
**What:** Generate interior PDF matching KDP specifications for trim size, margins, and font embedding
**When to use:** When user requests PDF download or preview
**Example:**
```typescript
// Source: @react-pdf/renderer docs + KDP spec integration
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { KDP_TRIM_SIZES, getMargins } from "@/domain/kdp"

// Map KDP trim size to @react-pdf/renderer page size
function getPDFPageSize(trimSizeId: string): { width: number; height: number } {
  const trim = KDP_TRIM_SIZES.find(t => t.id === trimSizeId)
  if (!trim) return { width: 612, height: 792 } // Default LETTER
  
  // Convert inches to points (72 points = 1 inch)
  return {
    width: trim.widthIn * 72,
    height: trim.heightIn * 72,
  }
}

// KDP mirror margins
const styles = StyleSheet.create({
  page: {
    size: getPDFPageSize(book.trimSizeId),
    // KDP requires mirror margins (inside = gutter, outside = edge)
    marginTop: marginSet.topIn * 72,
    marginBottom: marginSet.bottomIn * 72,
    marginLeft: marginSet.outsideIn * 72,  // Left edge margin
    marginRight: marginSet.insideIn * 72, // Right edge (gutter)
  },
})
```

### Pattern 2: Page Numbers with Total Pages
**What:** Display "Page X of Y" on every page using @react-pdf/renderer's render callback
**When to use:** Always for interior PDFs
**Example:**
```typescript
// Source: Existing implementation in toc-document.tsx
<Text
  style={styles.footer}
  render={({ pageNumber, totalPages }) => 
    `Page ${pageNumber} of ${totalPages}`
  }
  fixed  // Fixed on every page
/>
```

### Pattern 3: Custom Font Embedding
**What:** Register and embed fonts using Font.register
**When to Use:** KDP requires embedded fonts, not subset
**Example:**
```typescript
// Source: @react-pdf/renderer docs
import { Font } from "@react-pdf/renderer"

// Register bundled KDP-approved fonts
Font.register({
  family: "Times-Roman",
  src: "/fonts/Times-Roman.ttf",
})

Font.register({
  family: "Times-Italic",
  src: "/fonts/Times-Italic.ttf",
})

Font.register({
  family: "Helvetica",
  src: "/fonts/Helvetica.ttf",
})

Font.register({
  family: "Helvetica-Bold",
  src: "/fonts/Helvetica-Bold.ttf",
})
```

### Pattern 4: Configurable Headers/Footers
**What:** Headers and footers that can include book title, chapter name, or custom text
**When to use:** For professional-looking interior
**Example:**
```typescript
// Header component
const Header = ({ bookTitle, chapterTitle }) => (
  <View style={styles.header} fixed>
    <Text>{bookTitle}</Text>
    <Text>{chapterTitle}</Text>
  </View>
)

// Footer with page number
const Footer = () => (
  <Text
    style={styles.footer}
    render={({ pageNumber }) => pageNumber}
    fixed
  />
)
```

### Anti-Patterns to Avoid

- **Hardcoded A4/LETTER only:** The current implementation only supports A4 and LETTER. KDP supports 16 trim sizes — must map all of them.
- **Built-in fonts without embedding:** Using `fontFamily: "Helvetica"` relies on system fonts. KDP requires embedded fonts — must use Font.register.
- **Fixed margins:** KDP requires mirror margins that scale with page count — use `/src/domain/kdp/margins.ts` module.
- **No bookmarks:** PDF bookmarks (outline) help navigation — should include chapter bookmarks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Trim size mapping | Custom mapping logic | KDP_TRIM_SIZES from domain/kdp | Already has all 16 sizes with exact dimensions |
| Margin calculations | Manual formula | getMargins(pageCount, bleed) | Already handles page-count scaling |
| Bleed handling | Custom bleed math | getInteriorPageDimensions(trimSize, bleed) | Already calculates interior dimensions |
| Basic PDF rendering | Build from primitives | @react-pdf/renderer Document/Page/Text | Handles pagination, page breaks, orphans |

**Key insight:** The `/src/domain/kdp/` modules already contain all the KDP specification logic needed. The PDF generation just needs to integrate with them.

## Runtime State Inventory

> This is a greenfield feature (new PDF generation), not a rename/migration. No runtime state inventory needed.

- **Stored data:** None — PDF is generated on-demand from book content
- **Live service config:** None
- **OS-registered state:** None
- **Secrets/env vars:** None
- **Build artifacts:** None

## Common Pitfalls

### Pitfall 1: Only Supporting A4/LETTER Trim Sizes
**What goes wrong:** Current `mapTrimSize()` function only returns "A4" or "LETTER", ignoring all 16 KDP trim sizes
**Why it happens:** Initial implementation took shortcut with standard PDF sizes
**How to avoid:** Use custom page dimensions with all 16 KDP trim sizes from `KDP_TRIM_SIZES`
**Warning signs:** User selects "6x9" but PDF is wrong size

### Pitfall 2: No Custom Font Embedding
**What goes wrong:** Using `fontFamily: "Helvetica"` relies on system fonts, not embedded
**Why it happens:** Font.register was commented out in existing code
**How to avoid:** Register bundled TTF fonts (Times Roman, Helvetica, etc.) for full embedding
**Warning signs:** `pdffonts` tool shows "Type: Type 3" or "not embedded"

### Pitfall 3: Wrong Margin Orientation (Mirror Margins)
**What goes wrong:** Using equal left/right margins instead of KDP's mirror margins (inside edge > outside edge)
**Why it happens:** Not using the `getMargins()` function which returns mirror margins
**How to avoid:** Use `getMargins(pageCount, bleed)` and map inside/outside to PDF left/right
**Warning signs:** Odd/even pages have wrong gutter placement

### Pitfall 4: First-Pass Rendering with Undefined Total Pages
**What goes wrong:** @react-pdf/renderer renders twice — first pass has undefined totalPages
**Why it happens:** PDF rendering is two-pass by design
**How to avoid:** Use `fixed` prop for footer, or show "..." on first pass (pattern already in code)
**Warning signs:** "Page 1 of ..." shows on first render, then updates

## Code Examples

### KDP Trim Size to PDF Page Dimensions
```typescript
// Source: @react-pdf/renderer custom page sizes
import { KDP_TRIM_SIZES } from "@/domain/kdp"

// Custom page size object for @react-pdf/renderer
function getCustomPageSize(trimSizeId: string) {
  const trim = KDP_TRIM_SIZES.find(t => t.id === trimSizeId)
  if (!trim) return "LETTER" // Fallback
  
  // Return custom dimensions in points (1 inch = 72 points)
  return {
    width: trim.widthIn * 72,
    height: trim.heightIn * 72,
  }
}

// Usage in Page component
<Page size={getCustomPageSize(book.trimSizeId)}>
```

### Mirror Margins Integration
```typescript
// Source: KDP margin requirements + existing margins.ts
import { getMargins } from "@/domain/kdp"

// Get KDP-compliant margins based on page count
const margins = getMargins(chapterPageCount, book.bleedSetting)

// Map to @react-pdf/renderer margin props
<Page
  style={{
    marginTop: margins.topIn * 72,
    marginBottom: margins.bottomIn * 72,
    // For odd pages (right-hand): right = inside margin
    // For even pages (left-hand): left = inside margin
    // @react-pdf/renderer doesn't auto-switch — handle via wrap
  }}
>
```

### Font Registration for Full Embedding
```typescript
// Source: @react-pdf/renderer Font API
import { Font } from "@react-pdf/renderer"

// Register fonts once at app startup or in a separate module
if (!Font.getRegistered("Times-Roman")) {
  Font.register({
    family: "Times-Roman",
    src: "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Times-Roman.ttf",
  })
}

// Use in styles
const styles = StyleSheet.create({
  text: {
    fontFamily: "Times-Roman",
    fontSize: 12,
  },
})
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @react-pdf/renderer | PDF generation | ✓ | 4.3.2 | — |
| Next.js 15.5 | App framework | ✓ | 15.5.14 | — |
| KDP domain modules | Trim/margin specs | ✓ | Existing | — |

**Missing dependencies with no fallback:**
- None — all required packages installed or available in existing code

**Missing dependencies with fallback:**
- `pdf-lib` (optional) — for advanced PDF operations (metadata, merging) — can skip for v1 interior PDF

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest.config.ts (if exists) or default |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PDF-01 | KDP-compliant interior PDF with correct margins, bleed, trim | Unit | `pnpm test --run src/lib/pdf` | ❌ Needs creation |
| PDF-02 | Page numbers on every page | Unit | `pnpm test --run src/lib/pdf` | ❌ Needs creation |
| PDF-03 | Headers and footers | Unit | `pnpm test --run src/lib/pdf` | ❌ Needs creation |
| PDF-04 | Font embedding (verified with pdffonts) | Manual | Requires `pdffonts` CLI tool | — |
| PDF-05 | Trim size exact match | Unit | `pnpm test --run src/lib/pdf` | ❌ Needs creation |

### Sampling Rate
- **Per task commit:** `pnpm test --run src/lib/pdf`
- **Per wave merge:** `pnpm test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/pdf/interior-document.test.tsx` — tests for PDF generation
- [ ] `tests/lib/pdf/kdp-margins.test.ts` — margin integration tests
- [ ] `tests/lib/pdf/font-embedding.test.ts` — font registration tests

## Sources

### Primary (HIGH confidence)
- @react-pdf/renderer npm: v4.3.2, 2.3M weekly downloads, published Dec 29 2025 [HIGH]
- Existing implementation in `src/lib/pdf/toc-document.tsx` [HIGH]
- KDP domain modules in `src/domain/kdp/trim-sizes.ts`, `margins.ts`, `bleed.ts` [HIGH]
- @react-pdf/renderer official docs (react-pdf.org/advanced) [HIGH]

### Secondary (MEDIUM confidence)
- Stack Overflow: header/footer implementation patterns [MEDIUM]
- GitHub issues: font registration problems and workarounds [MEDIUM]

### Tertiary (LOW confidence)
- Web search: KDP PDF specifications (unverified) [LOW — verify with KDP docs]

## Open Questions

1. **Font subsetting vs full embedding:** KDP requires embedded fonts, but @react-pdf/renderer may subset by default. Need to verify if fonts are fully embedded or subsetted. Recommendation: Test with `pdffonts` CLI tool.

2. **Mirror margins on odd/even pages:** @react-pdf/renderer doesn't auto-switch margins for facing pages. Need to determine if this matters for KDP (it does — gutter must be on correct side). May need custom wrapping or accept equal margins for v1.

3. **Content transformation from TipTap HTML:** How to convert TipTap's HTML output to @react-pdf/renderer's `<Text>` component? Existing code passes raw HTML string to `<Text>` which won't render HTML tags. Need a transformer.

4. **Orphan/widow protection:** KDP recommends orphan/widow protection. @react-pdf/renderer doesn't have built-in support. May need custom logic or accept as v1 limitation.

---

**Confidence breakdown:**
- Standard stack: HIGH — @react-pdf/renderer is the correct tool, already installed
- Architecture: HIGH — existing code provides foundation, just needs extension
- Pitfalls: HIGH — all pitfalls identified from existing code review

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days for stable library)