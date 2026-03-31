# Phase 3: File Import - Research

**Researched:** 2026-03-30
**Domain:** Document import (DOCX, PDF, Images) for book publishing
**Confidence:** HIGH

## Summary

Phase 3 implements file import functionality allowing users to import existing manuscripts from DOCX, PDF, and image files into the TipTap editor. The implementation uses **mammoth** for DOCX-to-HTML conversion and **pdfjs-dist** for PDF text extraction. Images are handled via the existing TipTap Image extension with base64 encoding.

**Primary recommendation:** Install mammoth (1.12.0) and pdfjs-dist (4.x), create server-side import actions for file processing, and integrate with the existing TipTap editor via `setContent()` and `insertContent()` commands.

## User Constraints (from CONTEXT.md)

> **Note:** No CONTEXT.md exists for this phase - all decisions are at the planner's discretion based on ROADMAP.md requirements.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-05 | User can import DOCX files into the editor | mammoth converts DOCX → HTML, TipTap `setContent()` loads HTML |
| EDIT-06 | User can import PDF files into the editor | pdfjs-dist extracts text, TipTap `setContent()` loads as plain text |
| EDIT-07 | User can import images into the editor | TipTap Image extension with `allowBase64: true` already configured |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mammoth | 1.12.0 | DOCX → HTML conversion | 2.7M weekly downloads, actively maintained, clean HTML output |
| pdfjs-dist | 4.x | PDF text extraction | Mozilla's library, 11.7M weekly downloads, standard for PDF parsing |

### Dependencies to Install
```bash
pnpm add mammoth pdfjs-dist
```

### Already Installed (Phase 2)
| Library | Version | Purpose |
|---------|---------|---------|
| @tiptap/extension-image | 3.21.0 | Image display in editor |
| @tiptap/react | 3.21.0 | Editor React integration |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mammoth | docx (reading/writing) | mammoth focuses on reading → simpler for import only |
| mammoth | docx-parser | Less popular, less maintained |
| pdfjs-dist | pdf-parse | Simpler API but less control over extraction |
| pdfjs-dist | unpdf (UnJS) | Newer wrapper, extra dependency layer |
| TipTap Image | Custom base64 handling | Already built into TipTap Image extension |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── import/
│           ├── route.ts           # File upload + import API
│           ├── docx/route.ts      # DOCX processing
│           ├── pdf/route.ts       # PDF processing
│           └── image/route.ts     # Image processing
├── components/
│   └── editor/
│       ├── file-import-button.tsx # Import UI component
│       └── import-menu.tsx        # Dropdown for import options
├── lib/
│   └── import/
│       ├── docx-utils.ts          # mammoth conversion helpers
│       ├── pdf-utils.ts          # pdfjs-dist extraction helpers
│       └── image-utils.ts        # Image processing helpers
```

### Pattern 1: DOCX Import Pipeline
```
User uploads .docx file
  → File uploaded to server (via FormData)
  → mammoth.convertToHtml({ arrayBuffer: buffer })
  → Returns clean HTML
  → Client receives HTML
  → TipTap editor.commands.setContent(html)
  → User edits in TipTap
```

**Key insight:** mammoth outputs semantic HTML (headings, paragraphs, lists, tables) that maps directly to TipTap nodes. Some custom styling may be needed for complex Word formatting.

### Pattern 2: PDF Import Pipeline
```
User uploads .pdf file
  → File uploaded to server (via FormData)
  → pdfjs-dist loads document
  → Extract text from each page
  → Combine with page breaks (<hr> between pages)
  → Client receives HTML
  → TipTap editor.commands.setContent(plainTextHTML)
```

**Key insight:** PDF text extraction loses structure (headings, lists become plain paragraphs). Consider adding a "review mode" where users can re-format after import.

### Pattern 3: Image Import Pipeline
```
User uploads image file (jpg, png, webp)
  → Convert to base64 OR upload to storage
  → TipTap Image node with src="base64..."
  → editor.chain().focus().setImage({ src: base64 }).run()
```

**Key insight:** TipTap Image extension already has `allowBase64: true` configured. Just need a UI to trigger the upload and call the setImage command.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOCX parsing | Build custom XML parser | mammoth | Complex OOXML spec, mammoth handles edge cases |
| PDF text extraction | Build custom PDF parser | pdfjs-dist | PDF spec is complex, library handles rendering |
| Image insertion | Build custom image node | @tiptap/extension-image | Already installed and configured |

## Common Pitfalls

### Pitfall 1: mammoth HTML not matching TipTap schema
**What goes wrong:** mammoth outputs HTML that TipTap may not parse correctly (custom styles, complex tables)
**Why it happens:** mammoth preserves Word styles as inline CSS, TipTap may ignore some
**How to avoid:** Use mammoth's `styleMap` option to map Word styles to HTML tags, test with various DOCX formats
**Warning signs:** Missing headings, broken lists, unstyled text after import

### Pitfall 2: PDF extraction produces garbled text
**What goes wrong:** PDF text comes out in wrong order or with extra spaces
**Why it happens:** PDF stores text by drawing order, not reading order
**How to avoid:** Use pdfjs-dist's text layer, handle page-by-page extraction with proper ordering
**Warning signs:** jumbled paragraphs, text appearing in wrong places

### Pitfall 3: Large images bloat editor content
**What goes wrong:** Base64 images can be 1-5MB each, slowing down the editor
**Why it happens:** Storing images as base64 in the HTML content
**How to avoid:** Upload images to storage (uploadthing or local fs), use URL references instead of base64
**Warning signs:** Slow typing, large HTML size, browser memory issues

### Pitfall 4: File type validation
**What goes wrong:** Users try to import unsupported files
**Why it happens:** No validation on client/server
**How to avoid:** Validate MIME types on both client and server before processing

## Code Examples

### DOCX Import (Server Action)
```typescript
// src/lib/import/docx-utils.ts
import mammoth from "mammoth"

export async function convertDocxToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  )
  
  if (result.messages.length > 0) {
    console.warn("DOCX conversion warnings:", result.messages)
  }
  
  return result.value
}
```

### PDF Text Extraction (Server Action)
```typescript
// src/lib/import/pdf-utils.ts
import * as pdfjs from "pdfjs-dist"

// Set worker source - must be done before using pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  
  const textParts: string[] = []
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
    
    textParts.push(`<p>${pageText}</p>`)
    
    // Add page break between pages (except last)
    if (pageNum < pdf.numPages) {
      textParts.push("<hr/>")
    }
  }
  
  return textParts.join("\n")
}
```

### Image Insertion (Client Component)
```typescript
// In TipTap editor component
function insertImage(editor: Editor, imageFile: File) {
  const reader = new FileReader()
  
  reader.onload = () => {
    const base64 = reader.result as string
    editor.chain().focus().setImage({ src: base64 }).run()
  }
  
  reader.readAsDataURL(imageFile)
}
```

### File Import UI Component
```typescript
// src/components/editor/file-import-button.tsx
"use client"

import { useRef } from "react"
import { Upload, FileText, Image as ImageIcon } from "lucide-react"

interface FileImportButtonProps {
  onDocxSelect: (file: File) => void
  onPdfSelect: (file: File) => void
  onImageSelect: (file: File) => void
}

export function FileImportButton({ 
  onDocxSelect, 
  onPdfSelect, 
  onImageSelect 
}: FileImportButtonProps) {
  const docxRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">
        <Upload className="w-4 h-4" />
        Import
      </button>
      
      <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-white shadow-lg rounded-lg border p-2 z-50 min-w-[180px]">
        <button
          onClick={() => docxRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
        >
          <FileText className="w-4 h-4" />
          Import DOCX
        </button>
        
        <button
          onClick={() => pdfRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
        >
          <FileText className="w-4 h-4" />
          Import PDF
        </button>
        
        <button
          onClick={() => imageRef.current?.click()}
          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-100 rounded"
        >
          <ImageIcon className="w-4 h-4" />
          Import Image
        </button>
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={docxRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onDocxSelect(file)
        }}
      />
      <input
        ref={pdfRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPdfSelect(file)
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageSelect(file)
        }}
      />
    </div>
  )
}
```

### Integration with Existing Editor
```typescript
// In chapter-editor.tsx or tiptap-editor.tsx
import { convertDocxToHtml } from "@/lib/import/docx-utils"
import { extractTextFromPdf } from "@/lib/import/pdf-utils"

async function handleDocxImport(file: File) {
  const html = await convertDocxToHtml(file)
  // Access editor instance and set content
  editorRef.current?.chain().focus().setContent(html).run()
}

async function handlePdfImport(file: File) {
  const html = await extractTextFromPdf(file)
  // Note: PDF extraction produces plain text, not structured HTML
  editorRef.current?.chain().focus().setContent(html).run()
}

function handleImageImport(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    editorRef.current?.chain().focus().setImage({ src: base64 }).run()
  }
  reader.readAsDataURL(file)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom DOCX parsers | mammoth.js | 2014+ | Reliable, maintained open source |
| pdf.js (display only) | pdfjs-dist with text extraction | 2015+ | Enables programmatic access |
| Local image storage | Base64 inline | Early TipTap | Simpler for v1, upgrade later |

**Deprecated/outdated:**
- **mammoth < 1.0:** Older API, should use current version
- **pdf.js (pre-2.0):** Renamed to pdfjs-dist for Node.js compatibility

## Open Questions

1. **Should images be stored as base64 or uploaded to storage?**
   - What we know: TipTap Image extension supports both
   - What's unclear: Base64 is simpler but bloats content; storage requires upload infrastructure
   - Recommendation: Start with base64 for simplicity, add uploadthing integration in Phase 8 or when needed

2. **How to handle DOCX formatting that mammoth doesn't preserve?**
   - What we know: mammoth outputs clean semantic HTML, complex styles may be lost
   - What's unclear: Which Word styles are commonly used that need preservation?
   - Recommendation: Test with common DOCX templates, add styleMap mappings as needed

3. **Should PDF import attempt structure extraction or just text?**
   - What we know: PDF structure extraction is unreliable
   - What's unclear: Users may expect headings/tables to be preserved
   - Recommendation: Import as plain text with page breaks, add "format mode" for users to add structure

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 18+ | — |
| mammoth | DOCX import | ✗ | — | Install via pnpm |
| pdfjs-dist | PDF import | ✗ | — | Install via pnpm |

**Missing dependencies with no fallback:**
- mammoth: Required for EDIT-05
- pdfjs-dist: Required for EDIT-06

**Missing dependencies with fallback:**
- None identified

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (existing) |
| Config file | vitest.config.ts |
| Quick run command | `vitest run src/lib/import/` |
| Full suite command | `vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| EDIT-05 | DOCX import with formatting | Unit | `vitest run docx-utils.test.ts` | ❌ Create |
| EDIT-06 | PDF text extraction | Unit | `vitest run pdf-utils.test.ts` | ❌ Create |
| EDIT-07 | Image insertion | Unit | `vitest run image-utils.test.ts` | ❌ Create |
| EDIT-05 | Full import flow | Integration | `vitest run import-flow.test.ts` | ❌ Create |

### Sampling Rate
- **Per task commit:** `vitest run src/lib/import/ --reporter=verbose`
- **Per wave merge:** `vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/import/docx-utils.ts` — mammoth conversion helpers
- [ ] `src/lib/import/pdf-utils.ts` — pdfjs-dist text extraction
- [ ] `src/lib/import/image-utils.ts` — image processing helpers
- [ ] `src/components/editor/file-import-button.tsx` — Import UI component
- [ ] Framework install: mammoth + pdfjs-dist via `pnpm add mammoth pdfjs-dist`

## Sources

### Primary (HIGH confidence)
- https://tiptap.dev/docs/editor/api/commands/content/set-content — TipTap setContent command
- https://tiptap.dev/api/nodes/image — TipTap Image extension
- https://github.com/mwilliamson/mammoth.js/ — mammoth DOCX converter
- https://www.npmjs.com/package/mammoth — mammoth npm package (2.7M weekly downloads)
- https://www.npmjs.com/package/pdfjs-dist — pdfjs-dist npm package (11.7M weekly downloads)

### Secondary (MEDIUM confidence)
- https://github.com/mozilla/pdf.js — pdf.js official repo
- https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js — PDF text extraction patterns

### Tertiary (LOW confidence)
- https://www.npmjs.com/package/unpdf — Alternative PDF extraction (newer wrapper, not needed for v1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - mammoth and pdfjs-dist are well-established libraries
- Architecture: HIGH - clear pipeline patterns from official docs
- Pitfalls: MEDIUM - known issues documented but may have edge cases

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days for stable libraries)
