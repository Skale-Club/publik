# Phase 7: Cover PDF Generation - Research

**Researched:** 2026-03-30
**Domain:** KDP-Compliant Cover PDF Generation with Spine Width Calculation
**Confidence:** HIGH

## Summary

Phase 7 generates a single continuous KDP cover PDF that combines front cover, back cover, and spine into one print-ready file. The spine width is dynamically calculated based on the final interior page count and selected paper type (white/cream/color). This phase builds on the cover upload functionality from Phase 5 and the PDF generation infrastructure from Phase 6.

**Primary recommendation:** Use @react-pdf/renderer with custom page dimensions to create the full cover layout. Reuse existing KDP domain modules (spine width formulas from Phase 1), integrate with cover data from Phase 5 (front/back cover images), and add spine text rendering capability for books with 80+ pages.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. This phase builds on completed Phase 5 (cover management) and Phase 6 (interior PDF generation). User constraints from those phases remain in effect:
- Cover images already uploaded in Phase 5
- Book settings (trim size, paper type, ink type) already configured in Phase 1
- Interior PDF with final page count already generated in Phase 6

Research should focus on combining these components into a single cover PDF.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COV-03 | System generates a full cover PDF (front + spine + back + bleed) with correct KDP dimensions | KDP trim sizes from Phase 1, bleed specs (0.125"), full cover dimension formula |
| COV-04 | Spine width is calculated from page count and paper type | Spine width formulas verified from official KDP docs: white (0.002252"), cream (0.0025"), color (0.002347") |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Verified Version | Purpose | Why Standard |
|---------|-----------------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | Cover PDF generation | React-based PDF generation with custom page dimensions. Already installed from Phase 6. |
| pdf-lib | 1.17.1 | PDF post-processing | Merge/assemble complex PDFs, set metadata. Use for final cover assembly if needed. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| KDP domain modules | Existing | Spine width calculation, trim sizes | Always — use existing `/src/domain/kdp/` modules |
| Cover data from Phase 5 | Existing | Front/back cover images | Read from covers table or book record |

**Installation:**
```bash
# Already installed from Phase 6
pnpm add @react-pdf/renderer

# For advanced PDF operations
pnpm add pdf-lib @pdf-lib/fontkit
```

**Version verification:** 
- @react-pdf/renderer@4.3.2 (published Dec 29 2025) - confirmed from package.json
- pdf-lib@1.17.1 (verified via npm view)

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── pdf/
│       ├── cover-document.tsx       # Main cover PDF component
│       ├── spine-calculator.ts      # Spine width calculation
│       └── cover-templates.ts       # KDP cover dimension calculations
├── app/api/generate/cover/
│   └── route.ts                    # Cover PDF generation endpoint
└── domain/kdp/                     # Existing - use for dimensions
    ├── trim-sizes.ts               # Trim dimensions
    └── spine.ts                   # Spine width formulas (if exists)
```

### Pattern 1: Full Cover PDF Generation

**What:** Generate a single continuous cover PDF with correct KDP dimensions including bleed.

**When to use:** When user requests cover PDF download or preview.

**Example:**
```typescript
// Source: KDP specifications + @react-pdf/renderer custom dimensions
import { Document, Page, View, Image, Text, StyleSheet } from "@react-pdf/renderer"
import { KDP_TRIM_SIZES } from "@/domain/kdp"

// Calculate full cover dimensions
function calculateCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: "white" | "cream" | "color"
) {
  const trim = KDP_TRIM_SIZES.find(t => t.id === trimSizeId)
  if (!trim) throw new Error(`Unknown trim size: ${trimSizeId}`)
  
  // KDP bleed: 0.125" on all sides
  const bleed = 0.125
  
  // Spine width formulas from KDP
  const spineFormulas = {
    white: 0.002252,    // B&W white paper
    cream: 0.0025,      // B&W cream paper  
    color: 0.002347,   // Color paper (standard or premium)
  }
  
  const spineWidth = pageCount * (spineFormulas[paperType] || spineFormulas.white)
  
  // Full cover width: bleed + back + spine + front + bleed
  const totalWidth = bleed + trim.widthIn + spineWidth + trim.widthIn + bleed
  
  // Cover height: bleed + trim height + bleed
  const totalHeight = bleed + trim.heightIn + bleed
  
  return {
    width: totalWidth * 72,  // Convert to points (72 pt = 1 inch)
    height: totalHeight * 72,
    bleed: bleed * 72,
    spineWidth: spineWidth * 72,
  }
}

// Cover PDF Document Component
const CoverDocument = ({ 
  book,
  frontCoverUrl,
  backCoverUrl,
  backCoverText 
}: CoverDocumentProps) => {
  const dims = calculateCoverDimensions(
    book.trimSizeId,
    book.pageCount,
    book.paperType
  )
  
  const styles = StyleSheet.create({
    page: {
      size: [dims.width, dims.height],
      margin: 0,
    },
    coverArea: {
      flexDirection: "row",
      width: "100%",
      height: "100%",
    },
    backSection: {
      width: `${(book.trimSizeId.widthIn / (dims.width / 72)) * 100}%`,
      height: "100%",
    },
    spineSection: {
      width: `${(dims.spineWidth / (dims.width / 72)) * 100}%`,
      height: "100%",
    },
    frontSection: {
      width: `${(book.trimSizeId.widthIn / (dims.width / 72)) * 100}%`,
      height: "100%",
    },
  })
  
  return (
    <Document>
      <Page size={[dims.width, dims.height]} style={styles.page}>
        <View style={styles.coverArea}>
          {/* Back cover */}
          <View style={styles.backSection}>
            {backCoverUrl ? (
              <Image src={backCoverUrl} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Text>{backCoverText}</Text>
            )}
          </View>
          
          {/* Spine */}
          <View style={styles.spineSection}>
            {book.pageCount >= 80 && (
              <Text style={{ transform: "rotate(-90deg)" }}>
                {book.title} - {book.author}
              </Text>
            )}
          </View>
          
          {/* Front cover */}
          <View style={styles.frontSection}>
            <Image src={frontCoverUrl} style={{ width: "100%", height: "100%" }} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
```

### Pattern 2: Spine Width Calculation

**What:** Calculate accurate spine width based on page count and paper type.

**When to use:** When generating cover PDF or validating page count limits.

**Example:**
```typescript
// Source: Official KDP spine width formulas
export type PaperType = "white" | "cream" | "color"

export interface SpineCalculationResult {
  widthInches: number
  widthPoints: number
  widthMm: number
  isValidForText: boolean  // 80+ pages required for spine text
}

// KDP spine width formulas (verified from official KDP help)
const SPINE_FORMULAS: Record<PaperType, number> = {
  white: 0.002252,    // Black & White on white paper
  cream: 0.0025,     // Black & White on cream paper
  color: 0.002347,   // Any color interior on white paper
}

export function calculateSpineWidth(
  pageCount: number,
  paperType: PaperType
): SpineCalculationResult {
  const formula = SPINE_FORMULAS[paperType]
  const widthInches = pageCount * formula
  const widthPoints = widthInches * 72
  const widthMm = widthInches * 25.4
  
  return {
    widthInches: Math.round(widthInches * 1000) / 1000,
    widthPoints: Math.round(widthPoints * 100) / 100,
    widthMm: Math.round(widthMm * 100) / 100,
    isValidForText: pageCount >= 80,
  }
}

// Usage
const spine = calculateSpineWidth(300, "cream")
// Result: { widthInches: 0.75, widthPoints: 54, widthMm: 19.05, isValidForText: true }
```

### Pattern 3: KDP Cover Dimension Calculator

**What:** Calculate complete cover dimensions for KDP compliance.

**When to use:** When validating cover or generating PDF.

**Example:**
```typescript
// Source: KDP cover specifications
export interface CoverDimensions {
  totalWidth: number      // in points
  totalHeight: number      // in points
  bleedSize: number        // 0.125" in points
  spineWidth: number       // in points
  backCoverWidth: number   // in points (trim width + bleed)
  frontCoverWidth: number // in points (trim width + bleed)
}

export function calculateKDPCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: PaperType
): CoverDimensions {
  const trim = KDP_TRIM_SIZES.find(t => t.id === trimSizeId)
  if (!trim) throw new Error(`Unknown trim size: ${trimSizeId}`)
  
  const bleedInches = 0.125
  const bleedPoints = bleedInches * 72
  
  const spine = calculateSpineWidth(pageCount, paperType)
  
  // Full cover: bleed + back + spine + front + bleed
  const totalWidthPoints = bleedPoints + 
    (trim.widthIn * 72) + 
    spine.widthPoints + 
    (trim.widthIn * 72) + 
    bleedPoints
  
  // Height: bleed + trim height + bleed
  const totalHeightPoints = bleedPoints + (trim.heightIn * 72) + bleedPoints
  
  return {
    totalWidth: totalWidthPoints,
    totalHeight: totalHeightPoints,
    bleedSize: bleedPoints,
    spineWidth: spine.widthPoints,
    backCoverWidth: (trim.widthIn * 72) + bleedPoints,
    frontCoverWidth: (trim.widthIn * 72) + bleedPoints,
  }
}
```

### Anti-Patterns to Avoid

- **Hardcoded cover dimensions:** Don't assume fixed trim sizes — use KDP_TRIM_SIZES for exact dimensions
- **Wrong spine formula:** Using wrong paper type formula results in incorrect spine width — always match paper type to formula
- **Missing bleed:** KDP requires 0.125" bleed on all sides — don't omit it
- **Single cover image only:** KDP needs full-wrap cover (back + spine + front), not just front cover
- **Ignoring minimum page count:** Books under 24 pages can't be published — handle edge case

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spine width calculation | Custom formula | KDP spine width formulas (0.002252/0.0025/0.002347) | Already verified from KDP docs |
| Cover dimension calculation | Hardcoded values | calculateKDPCoverDimensions() using trim sizes | Adapts to any KDP trim size |
| Cover PDF generation | Build from primitives | @react-pdf/renderer with custom dimensions | Handles page sizing, images |
| Cover image storage | Custom storage | Reuse existing storage.ts from Phase 5 | Already tested |

**Key insight:** The KDP domain modules from Phase 1 contain all the specifications needed. Phase 7 combines them with cover image data from Phase 5 and renders a continuous cover PDF.

---

## Runtime State Inventory

> This phase generates PDFs from existing data, not a rename/migration.

- **Stored data:** Cover images uploaded in Phase 5 (stored via storage.ts)
- **Live service config:** None
- **OS-registered state:** None
- **Secrets/env vars:** None
- **Build artifacts:** None

---

## Common Pitfalls

### Pitfall 1: Wrong Paper Type → Wrong Spine Width

**What goes wrong:** Using white paper formula for cream paper or vice versa, resulting in incorrect spine width.

**Why it happens:** Not matching paper type to correct spine formula.

**How to avoid:** Use paper type from book settings to select correct formula:
- White paper (B&W): 0.002252
- Cream paper (B&W): 0.0025
- Color paper: 0.002347

**Warning signs:** Cover PDF spine width doesn't match actual book spine.

### Pitfall 2: Missing Bleed on Cover Edges

**What goes wrong:** Cover without 0.125" bleed gets rejected by KDP or shows white edges.

**Why it happens:** Forgetting bleed requirement for covers (different from interior).

**How to add:**
```typescript
const bleed = 0.125 * 72  // 9 points
// Cover extends bleed beyond trim on all sides
```

**Warning signs:** KDP error "cover must include bleed"

### Pitfall 3: Spine Text on Thin Books

**What goes wrong:** Adding spine text to books with < 80 pages where spine is too narrow.

**Why it happens:** KDP requires minimum spine width for text readability.

**How to avoid:** Only render spine text when `pageCount >= 80`:
```typescript
{book.pageCount >= 80 && <Text style={styles.spineText}>{book.title}</Text>}
```

**Warning signs:** Text gets cut off or is unreadable on thin books.

### Pitfall 4: Back Cover Not Rendering

**What goes wrong:** Generated cover only shows front, missing back cover content.

**Why it happens:** Not handling both back cover image and back cover text modes.

**How to avoid:** Check cover data and render appropriate content:
```typescript
{backCoverMode === "image" ? (
  <Image src={backCoverImageUrl} />
) : (
  <Text>{backCoverText}</Text>
)}
```

**Warning signs:** PDF only has front cover, no back content.

---

## Code Examples

### Complete Cover PDF Generation Endpoint
```typescript
// src/app/api/generate/cover/route.ts
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { CoverDocument } from "@/lib/pdf/cover-document"
import { getBookWithCovers } from "@/lib/books" // Phase 5 data

export async function POST(request: NextRequest) {
  try {
    const { bookId } = await request.json()
    
    // Get book data with cover images (from Phase 5)
    const book = await getBookWithCovers(bookId)
    
    if (!book.frontCoverUrl) {
      return NextResponse.json(
        { error: "Front cover not uploaded" },
        { status: 400 }
      )
    }
    
    // Calculate final page count from interior PDF (from Phase 6)
    const pageCount = await getInteriorPageCount(bookId)
    
    // Generate cover PDF
    const pdfBuffer = await renderToBuffer(
      <CoverDocument
        book={{
          ...book,
          pageCount,
        }}
        frontCoverUrl={book.frontCoverUrl}
        backCoverUrl={book.backCoverMode === "image" ? book.backCoverImageUrl : undefined}
        backCoverText={book.backCoverMode === "text" ? book.backCoverText : undefined}
      />
    )
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${book.title}-cover.pdf"`,
      },
    })
  } catch (error) {
    console.error("Cover PDF generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate cover PDF" },
      { status: 500 }
    )
  }
}
```

### Spine Width Calculator with Validation
```typescript
// src/lib/pdf/spine-calculator.ts

export type PaperType = "white" | "cream" | "color"

export interface SpineWidthResult {
  widthInches: number
  widthMm: number
  widthPoints: number
  canHaveSpineText: boolean
  warnings: string[]
}

// Verified KDP formulas
const SPINE_FORMULAS: Record<PaperType, number> = {
  white: 0.002252,
  cream: 0.0025,
  color: 0.002347,
}

const MIN_PAGES_FOR_PUBLISHING = 24
const MIN_PAGES_FOR_SPINE_TEXT = 80

export function calculateSpineWidth(
  pageCount: number,
  paperType: PaperType
): SpineWidthResult {
  const warnings: string[] = []
  
  // Validate page count
  if (pageCount < MIN_PAGES_FOR_PUBLISHING) {
    warnings.push(`Book has only ${pageCount} pages. Minimum is ${MIN_PAGES_FOR_PUBLISHING} pages.`)
  }
  
  const formula = SPINE_FORMULAS[paperType]
  const widthInches = pageCount * formula
  
  // Round to 3 decimal places
  const widthInchesRounded = Math.round(widthInches * 1000) / 1000
  
  return {
    widthInches: widthInchesRounded,
    widthMm: Math.round(widthInches * 25.4 * 100) / 100,
    widthPoints: Math.round(widthInches * 72 * 100) / 100,
    canHaveSpineText: pageCount >= MIN_PAGES_FOR_SPINE_TEXT,
    warnings,
  }
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @react-pdf/renderer | Cover PDF generation | ✓ | 4.3.2 | — |
| Next.js 15.5 | App framework | ✓ | 15.5.14 | — |
| KDP domain modules | Trim/margin specs | ✓ | Existing | — |
| Cover data | Phase 5 upload | ✓ | Existing | — |
| Interior page count | Phase 6 PDF | ✓ | Existing | — |
| pdf-lib | PDF post-processing | ✗ | — | Skip for v1, use @react-pdf/renderer only |

**Missing dependencies with no fallback:**
- None — all core functionality available

**Missing dependencies with fallback:**
- pdf-lib — optional for advanced PDF operations, @react-pdf/renderer handles basic needs

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (from existing project) |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COV-03 | Full cover PDF with correct KDP dimensions | unit | `pnpm test --run src/lib/pdf/cover` | ❌ Needs creation |
| COV-04 | Spine width calculated from page count and paper type | unit | `pnpm test --run src/lib/pdf/spine-calculator` | ❌ Needs creation |

### Sampling Rate
- **Per task commit:** `pnpm test --run src/lib/pdf`
- **Per wave merge:** `pnpm test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/pdf/cover-document.test.tsx` — Cover PDF generation tests
- [ ] `tests/lib/pdf/spine-calculator.test.ts` — Spine width calculation tests
- [ ] `tests/lib/pdf/cover-dimensions.test.ts` — KDP dimension validation tests

---

## Sources

### Primary (HIGH confidence)
- KDP Help Center: "Create a Paperback Cover" — Spine width formulas per paper type, cover dimension formulas, bleed requirements [HIGH]
- KDP Help Center: "Set Trim Size, Bleed, and Margins" — Trim size specifications, page count limits [HIGH]
- @react-pdf/renderer official documentation (react-pdf.org) — Custom page dimensions, Image component, StyleSheet [HIGH]
- Phase 1 Research: KDP specification registry with verified spine formulas [HIGH]

### Secondary (MEDIUM confidence)
- kdpforge.com/tools/kdp-cover-calculator — KDP cover dimension calculator, confirms formulas [MEDIUM]
- bookcoverslab.com — KDP cover templates, spine width quick reference [MEDIUM]

### Tertiary (LOW confidence)
- Various KDP cover guides — Cross-referenced for consistency [MEDIUM]

---

## Open Questions

1. **Should we generate spine text automatically?**
   - What we know: KDP allows spine text for 80+ page books
   - What's unclear: Should we auto-generate from book title/author or let user customize?
   - Recommendation: Start with book title + author, allow customization in future version

2. **How to handle cover images that don't match calculated dimensions?**
   - What we know: Users may upload covers from Phase 5 that don't match final dimensions
   - What's unclear: Stretch/scale images or show warning?
   - Recommendation: Warn user if dimensions don't match, but allow generation (KDP will catch issues)

3. **Should we support hardcover covers in Phase 7?**
   - What we know: KDP supports hardcover with different spine calculation
   - What's unclear: User requirements for Phase 7 scope
   - Recommendation: Focus on paperback only for v1, add hardcover in future if needed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @react-pdf/renderer is correct tool, already installed
- Architecture: HIGH — follows patterns from Phase 5 and Phase 6
- Spine formulas: HIGH — verified from official KDP documentation
- Pitfalls: HIGH — identified from KDP specifications and common cover issues

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days — KDP specs stable)

---

## KDP Cover Specifications Reference

### Spine Width Formulas (Verified)
| Paper Type | Formula | Constant |
|------------|---------|----------|
| White (B&W) | pageCount × 0.002252" | 0.002252 |
| Cream (B&W) | pageCount × 0.0025" | 0.0025 |
| Color (Standard/Premium) | pageCount × 0.002347" | 0.002347 |

### Full Cover Dimensions
```
Cover Width = Bleed (0.125") + Back Cover + Spine + Front Cover + Bleed (0.125")
Cover Height = Bleed (0.125") + Trim Height + Bleed (0.125")
```

### Minimum Requirements
- Bleed: 0.125" on all sides (mandatory for covers)
- Spine text: Minimum 80 pages required
- Publishing: Minimum 24 pages required
- Resolution: 300 DPI minimum (600 DPI recommended)

### Example: 6"×9" Book, 300 Pages, Cream Paper
- Spine = 300 × 0.0025" = 0.75"
- Cover Width = 0.125 + 6 + 0.75 + 6 + 0.125 = 13.0"
- Cover Height = 0.125 + 9 + 0.125 = 9.25"
- In points: 936 × 666 points