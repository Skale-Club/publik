# Phase 8: Export, Validation & Publishing Guide - Research

**Researched:** 2026-03-30
**Domain:** File download, KDP validation, ZIP packaging, publishing guide
**Confidence:** HIGH

## Summary

Phase 8 enables users to download validated KDP-ready files and access a step-by-step publishing guide. The project already has PDF generation APIs (`/api/generate/pdf`, `/api/generate/cover`) and validation modules (`trim-size-validator.ts`, `kdp-validation.ts`). This phase adds file download UI, compliance validation, ZIP packaging, and a KDP publishing guide page.

**Primary recommendation:** Build export UI on the existing book detail page, create a ZIP export API using `archiver` library, extend existing validation modules for comprehensive KDP compliance checks, and add a dedicated publishing guide page with step-by-step instructions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5 (existing) | Web framework, API routes | Already in project |
| @react-pdf/renderer | 4.3.2 (existing) | PDF generation | Already in project |
| archiver | 7.x | ZIP file creation | Best for server-side streaming, 2M+ weekly downloads |
| pdf-lib | 1.17.1 (existing) | PDF manipulation | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/archiver | latest | TypeScript types | When using archiver in TypeScript |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| archiver | adm-zip | adm-zip loads entire file into memory; archiver streams - better for large PDFs |
| archiver | JSZip | JSZip is browser-focused; archiver is Node.js native |

**Installation:**
```bash
npm install archiver @types/archiver
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── download/
│   │   │   ├── pdf/
│   │   │   │   └── route.ts      # Interior PDF download
│   │   │   ├── cover/
│   │   │   │   └── route.ts      # Cover PDF download
│   │   │   └── zip/
│   │   │       └── route.ts      # ZIP package download
│   │   └── validate/
│   │       └── route.ts          # KDP compliance validation
│   └── (dashboard)/
│       └── books/
│           └── [bookId]/
│               └── export/       # Export UI page
├── components/
│   └── export/
│       ├── file-downloads.tsx    # Individual download buttons
│       ├── validation-report.tsx # KDP compliance display
│       └── publishing-guide.tsx # Step-by-step guide
└── lib/
    └── export/
        ├── validator.ts          # KDP compliance checker
        └── checklist.ts          # Pre-upload checklist generator
```

### Pattern 1: API Route File Downloads
**What:** Stream generated PDFs directly to browser with proper headers
**When to use:** When serving large PDF files that may not fit in memory
**Example:**
```typescript
// Source: Next.js route handler docs
export async function GET(request: NextRequest) {
  const stream = await generatePdfStream(bookId)
  
  return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="book-title.pdf"`,
    },
  })
}
```

### Pattern 2: ZIP Package Streaming
**What:** Stream multiple files into a single ZIP without loading all into memory
**When to use:** When packaging interior PDF, cover PDF, and checklist for download
**Example:**
```typescript
// Source: archiver documentation
import archiver from 'archiver'

export async function POST(request: NextRequest) {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = new ReadableStream({
    start(controller) {
      archive.on('data', chunk => controller.enqueue(chunk))
      archive.on('end', () => controller.close())
      archive.on('error', err => controller.error(err))
    }
  })

  // Add files to archive
  archive.file(pdfPath, { name: 'interior.pdf' })
  archive.file(coverPath, { name: 'cover.pdf' })
  archive.append(checklistContent, { name: 'kdp-checklist.txt' })
  await archive.finalize()

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="kdp-files.zip"',
    },
  })
}
```

### Pattern 3: KDP Compliance Validation
**What:** Validate generated files against KDP specifications before download
**When to use:** When user requests validation, or before ZIP creation
**Example:**
```typescript
// Uses existing validation modules
import { validateTrimSize } from '@/lib/pdf/trim-size-validator'
import { validateCoverForKDP } from '@/lib/covers/kdp-validation'

interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  warnings: string[]
}

interface ValidationIssue {
  type: 'error' | 'warning'
  category: 'dimensions' | 'margins' | 'fonts' | 'bleed' | 'image-resolution'
  message: string
  details?: Record<string, unknown>
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP creation | Custom binary ZIP format | archiver | Handles compression, large files, streaming correctly |
| PDF download | Load entire PDF into memory | Stream from existing API | Prevents memory issues with large PDFs |
| KDP validation | Parse PDFs manually | Use existing @react-pdf/renderer to inspect | Can read document properties |

**Key insight:** The project already has PDF generation APIs and validation modules. This phase composes them into user-facing features rather than building from scratch.

## Common Pitfalls

### Pitfall 1: Large PDF Memory Issues
**What goes wrong:** Loading entire PDF into memory causes server crashes for large books
**Why it happens:** Reading generated PDFs as buffers before sending
**How to avoid:** Stream PDFs directly from generation API to response
**Warning signs:** Server timeout errors on books with 300+ pages

### Pitfall 2: Missing KDP Validation Before Download
**What goes wrong:** User downloads non-compliant PDF that KDP rejects
**Why it happens:** No validation step between generation and download
**How to avoid:** Run validation automatically before allowing downloads, show compliance status
**Warning signs:** Users reporting KDP rejections after download

### Pitfall 3: ZIP Package Without Checklist
**What goes wrong:** User uploads files without understanding requirements
**Why it happens:** ZIP only contains PDFs, no guidance
**How to avoid:** Include KDP checklist.txt in ZIP with file specifications and requirements
**Warning signs:** Users asking "is this ready for KDP?" after download

## Code Examples

### Download Button Component
```typescript
// Source: Standard Next.js patterns
'use client'

import { Download, AlertTriangle, CheckCircle } from 'lucide-react'

interface FileDownloadButtonProps {
  label: string
  filename: string
  apiEndpoint: string
  validationStatus?: 'valid' | 'warning' | 'error' | 'pending'
  onClick?: () => void
}

export function FileDownloadButton({ 
  label, 
  filename, 
  apiEndpoint,
  validationStatus = 'pending'
}: FileDownloadButtonProps) {
  const handleDownload = async () => {
    const response = await fetch(apiEndpoint)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleDownload} className="flex items-center gap-2">
      <Download className="w-4 h-4" />
      {label}
      {validationStatus === 'valid' && <CheckCircle className="w-4 h-4 text-green-500" />}
      {validationStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
    </button>
  )
}
```

### Validation Display Component
```typescript
interface ValidationReportProps {
  results: ValidationResult
}

export function ValidationReport({ results }: ValidationReportProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">KDP Compliance Check</h3>
      
      {results.valid ? (
        <div className="text-green-600 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          All files meet KDP specifications
        </div>
      ) : (
        <ul className="space-y-2">
          {results.issues.map((issue, i) => (
            <li key={i} className={issue.type === 'error' ? 'text-red-600' : 'text-yellow-600'}>
              {issue.message}
            </li>
          ))}
        </ul>
      )}
      
      {results.warnings.length > 0 && (
        <div className="mt-4 text-gray-600">
          <h4 className="font-medium">Warnings:</h4>
          <ul className="list-disc pl-5">
            {results.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### Publishing Guide Content Structure
```typescript
// KDP Publishing Guide Steps
export const PUBLISHING_STEPS = [
  {
    step: 1,
    title: "Sign in to KDP",
    description: "Go to kdp.amazon.com and sign in with your Amazon account",
    link: "https://kdp.amazon.com"
  },
  {
    step: 2,
    title: "Create New Title",
    description: "Click 'Create Kindle eBook' or 'Create Paperback' depending on your format",
    details: ["Choose 'Paperback' for printed books", "Select 'Kindle eBook' for digital"]
  },
  {
    step: 3,
    title: "Upload Your Files",
    description: "Upload the interior PDF and cover PDF from your ZIP package",
    details: [
      "Interior PDF goes in 'Manuscript' section",
      "Cover PDF goes in 'Cover' section"
    ]
  },
  {
    step: 4,
    title: "Fill in Book Details",
    description: "Enter title, description, author name, keywords, and categories",
    important: "Make sure title matches exactly on cover and interior"
  },
  {
    step: 5,
    title: "Set Pricing & Royalties",
    description: "Choose your price and royalty options",
    details: [
      "70% royalty requires $2.99 minimum price",
      "35% royalty available for lower prices"
    ]
  },
  {
    step: 6,
    title: "Review & Publish",
    description: "Review your book details and click 'Publish Your Book'",
    note: "KDP typically approves within 24-72 hours"
  }
]
```

## Open Questions

1. **File storage after generation**
   - What we know: PDFs are currently generated on-demand via API
   - What's unclear: Should we store generated PDFs for faster re-download?
   - Recommendation: Generate on-demand initially, add caching if performance becomes issue

2. **Validation timing**
   - What we know: Can validate before or during download
   - What's unclear: Run validation every time or cache results?
   - Recommendation: Run validation on-demand with 1-hour cache to balance accuracy vs. performance

3. **Publishing guide content**
   - What we know: Needs step-by-step KDP upload instructions
   - What's unclear: How detailed should the guide be? Include screenshots?
   - Recommendation: Keep to text-based steps with links to KDP help docs; let KDP UI handle specifics

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)

This phase uses only internal libraries and existing project APIs:
- `archiver` is npm package, not system dependency
- No external services required
- Existing validation modules use project-internal functions

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXP-01 | User can download the interior PDF | Existing `/api/generate/pdf` API + download UI component |
| EXP-02 | User can download the cover PDF | Existing `/api/generate/cover` API + download UI component |
| EXP-03 | System validates generated files against KDP specs | Existing `trim-size-validator.ts`, `kdp-validation.ts` + new validation API |
| EXP-04 | User can download a ZIP package | New `/api/download/zip` API with archiver |
| UX-02 | User can access step-by-step publishing guide | New publishing guide page/component |

## Sources

### Primary (HIGH confidence)
- https://nextjs.org/docs/app/api-route-handlers — Next.js route handler streaming [HIGH]
- https://github.com/archiverjs/node-archiver — archiver streaming ZIP creation [HIGH]
- https://www.npmjs.com/package/archiver — archiver v7.0.1 specifications [HIGH]
- https://precheck.tools/platforms/kdp/kdp-pdf-technical-guide — KDP PDF requirements [HIGH]

### Secondary (MEDIUM confidence)
- https://ilayoutbooks.com/the-complete-guide-to-kdp-book-formatting-2026-edition/ — KDP formatting guide
- https://blog.bookautoai.com/amazon-kdp-margins-guide/ — KDP margins and bleed specifications

### Tertiary (LOW confidence)
- https://www.vappingo.com/word-blog/kdp-manuscript-formatting-requirements/ — KDP requirements checklist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing project infrastructure with archiver addition
- Architecture: HIGH - Composes existing APIs into user-facing download features
- Pitfalls: HIGH - Known patterns from existing project PDF generation

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days for stable technology)