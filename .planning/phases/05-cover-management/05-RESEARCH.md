# Phase 5: Cover Management - Research

**Researched:** 2026-03-30
**Domain:** Image Upload + KDP Cover Specifications + Client-side Validation
**Confidence:** HIGH

## Summary

Phase 5 implements cover image upload functionality for books, including front cover upload, back cover (image or text), and validation against KDP minimum dimension requirements. The project already has a working image upload infrastructure (`/api/upload/image` and `storage.ts`), which will be extended for cover-specific uploads.

**Primary recommendation:** Reuse the existing `storage.ts` for cover image persistence, add a new `covers` table to the database schema for storing cover metadata, use client-side `Image` object for dimension validation before upload, and implement the back cover as either an image upload or rich text content.

---

## User Constraints (from ROADMAP.md)

### Phase Requirements
| ID | Description | Research Support |
|----|-------------|------------------|
| COV-01 | User can upload a front cover image | Existing upload infrastructure + new cover-specific validation |
| COV-02 | User can upload a back cover image or enter back cover text | Database schema for dual back cover mode + text storage |

### Success Criteria (from ROADMAP.md)
1. User can upload a front cover image for their book
2. User can upload a back cover image or enter back cover text
3. System validates uploaded cover images against minimum dimension requirements

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5 | App framework | Already in project |
| React | 19.x | UI library | Already in project |
| Drizzle ORM | 0.45.x | Database | Already in project |
| zod | 3.x | Validation | Already in project, for cover metadata validation |

### Cover-Specific
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native Image() | Browser API | Client-side dimension validation | Always - before upload |
| sharp (optional) | latest | Server-side image processing | If resizing/compression needed |

### Already in Project (Reuse)
| Library | Purpose | Source |
|---------|---------|--------|
| `src/lib/storage.ts` | File persistence | Reuse for cover storage |
| `src/app/api/upload/image` | Upload endpoint | Extend or create separate cover endpoint |

**Installation:**
```bash
# No new packages required for Phase 5 core functionality
# Optional: if image processing needed
pnpm add sharp
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── covers/
│   │   ├── CoverUploader.tsx      # Front cover upload component
│   │   ├── BackCoverInput.tsx     # Back cover (image OR text)
│   │   └── CoverPreview.tsx       # Image preview component
├── lib/
│   └── covers/
│       ├── index.ts               # Cover utilities
│       ├── validation.ts          # Dimension validation
│       └── dimensions.ts          # KDP dimension calculations
├── server/
│   └── actions/
│       └── covers.ts              # Cover CRUD server actions
├── types/
│   └── cover.ts                   # Cover types
└── db/
    └── schema/
        └── covers.ts              # Drizzle covers schema
```

### Pattern 1: Cover Image Upload with Validation

**What:** Upload cover images with client-side dimension validation before sending to server.

**When to use:** When users upload cover images that must meet KDP specifications.

**Example:**
```typescript
// Client-side validation before upload
function validateCoverImage(file: File, minWidth: number, minHeight: number): Promise<{valid: boolean, width?: number, height?: number, error?: string}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width >= minWidth && img.height >= minHeight) {
        resolve({ valid: true, width: img.width, height: img.height });
      } else {
        resolve({ 
          valid: false, 
          width: img.width, 
          height: img.height,
          error: `Image must be at least ${minWidth}x${minHeight}px. Your image is ${img.width}x${img.height}px.`
        });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, error: 'Could not load image' });
    };
    img.src = URL.createObjectURL(file);
  });
}

// Usage in component
async function handleCoverUpload(file: File) {
  const minDimensions = getMinCoverDimensions(trimSizeId, pageCount);
  const validation = await validateCoverImage(file, minDimensions.width, minDimensions.height);
  
  if (!validation.valid) {
    setError(validation.error);
    return;
  }
  
  // Proceed with upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bookId', bookId);
  formData.append('coverType', 'front');
  
  const response = await fetch('/api/upload/cover', { method: 'POST', body: formData });
}
```

### Pattern 2: KDP Cover Dimension Calculation

**What:** Calculate minimum required cover dimensions based on trim size, page count, and paper type.

**When to use:** When validating cover uploads or generating cover templates.

**Example:**
```typescript
// src/lib/covers/dimensions.ts

interface CoverDimensions {
  width: number;    // in pixels (at 300 DPI)
  height: number;   // in pixels (at 300 DPI)
  trimWidth: number;
  trimHeight: number;
  bleed: number;    // 0.125 inches
  spineWidth: number;
}

/**
 * Calculate minimum cover dimensions for KDP
 * Based on: https://creativeparamita.com/book-cover/kdp-cover-size-guide-2025/
 */
export function calculateMinCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: 'white' | 'cream' | 'color'
): CoverDimensions {
  const trimSizes = {
    '5x8': { width: 5, height: 8 },
    '5.5x8.5': { width: 5.5, height: 8.5 },
    '6x9': { width: 6, height: 9 },
    '8.5x11': { width: 8.5, height: 11 },
    // ... other sizes from KDP_TRIM_SIZES
  };
  
  const trim = trimSizes[trimSizeId as keyof typeof trimSizes] || { width: 6, height: 9 };
  const bleed = 0.125; // inches
  
  // Spine width formulas from KDP
  const spineFormulas = {
    'white': 0.002252,   // B&W interior
    'cream': 0.0025,     // B&W interior cream paper
    'color': 0.002347,   // Color interior
  };
  
  const spineWidth = pageCount * (spineFormulas[paperType] || spineFormulas.white);
  
  // Full cover dimensions (with bleed)
  const coverWidth = bleed + trim.width + spineWidth + trim.width + bleed;
  const coverHeight = bleed + trim.height + bleed;
  
  // Convert to pixels at 300 DPI
  const DPI = 300;
  return {
    width: Math.round(coverWidth * DPI),
    height: Math.round(coverHeight * DPI),
    trimWidth: trim.width,
    trimHeight: trim.height,
    bleed,
    spineWidth,
  };
}
```

### Pattern 3: Back Cover Dual Mode

**What:** Allow users to provide back cover content as either an image or text.

**When to use:** When some users have pre-designed back covers while others want to write text.

**Database Schema:**
```typescript
// src/db/schema/covers.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { books } from './books'

export const covers = sqliteTable('covers', {
  id: text('id').primaryKey(),
  bookId: text('book_id').references(() => books.id).notNull(),
  
  // Front cover
  frontCoverUrl: text('front_cover_url'),
  frontCoverWidth: integer('front_cover_width'),
  frontCoverHeight: integer('front_cover_height'),
  
  // Back cover - dual mode
  backCoverType: text('back_cover_type', { enum: ['image', 'text'] }),
  backCoverImageUrl: text('back_cover_image_url'),
  backCoverImageWidth: integer('back_cover_image_width'),
  backCoverImageHeight: integer('back_cover_image_height'),
  backCoverText: text('back_cover_text'),  // HTML or plain text
  
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
```

### Pattern 4: Cover Upload Endpoint

**What:** API route for handling cover image uploads with type-specific validation.

**When to use:** When implementing cover upload functionality.

```typescript
// src/app/api/upload/cover/route.ts
import { NextRequest, NextResponse } from "next/server"
import { saveImage } from "@/lib/storage"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/tiff", "image/webp"]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB - KDP allows larger files

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bookId = formData.get("bookId") as string | null
    const coverType = formData.get("coverType") as string | null // 'front' or 'back'

    if (!file || !bookId || !coverType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: jpg, png, tiff, webp" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 50MB" }, { status: 400 })
    }

    // Save with cover-specific subfolder
    const subfolder = coverType === 'front' ? 'covers/front' : 'covers/back'
    const { url } = await saveImage(file, `${bookId}/${subfolder}`)
    
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Cover upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image dimension validation | Custom parsing | Native `Image()` object in browser | Reliable, client-side, no server needed |
| Cover dimension calculations | Hardcoded values | KDP formulas (documented above) | Accurate, adapts to trim size/page count |
| File storage | Custom S3/Blob | Existing `storage.ts` | Already tested, works with project |
| Cover metadata storage | JSON in books table | Separate `covers` table | Clean separation, easier queries |

---

## Common Pitfalls

### Pitfall 1: Dimension Validation Using Original File Name
**What goes wrong:** Users upload small images that look fine on screen but fail KDP validation when printed.

**Why it happens:** Not validating actual pixel dimensions, only file size.

**How to avoid:**
- Always use client-side `Image()` to get actual dimensions
- Compare against KDP minimums (300 DPI, full cover size with bleed)
- Show clear error messages with required vs. actual dimensions

**Warning signs:** Upload succeeds but KDP rejects final cover.

### Pitfall 2: Not Accounting for Bleed in Validation
**What goes wrong:** User uploads an image sized exactly to trim size, but KDP requires bleed.

**Why it happens:** Ignoring the 0.125" bleed requirement on all sides.

**How to avoid:**
- Calculate minimum dimensions including bleed
- Formula: minWidth = (trimWidth + spineWidth + 0.25) × 300 DPI
- Show users the minimum required size based on their book settings

**Warning signs:** KDP error "cover dimensions don't match trim size"

### Pitfall 3: Ignoring DPI in Dimension Calculations
**What goes wrong:** Validating pixel dimensions without considering DPI, leading to blurry prints.

**Why it happens:** KDP requires 300 DPI minimum, but users may upload 72 DPI images.

**How to avoid:**
- Either validate DPI metadata (complex) or set minimum pixel dimensions at 300 DPI equivalent
- KDP minimum: For a 6"×9" book, minimum cover = (6×300) × (9×300) = 1800×2700 pixels

**Warning signs:** Print quality issues, KDP warnings about resolution

### Pitfall 4: Back Cover Text Not Rendering in PDF
**What goes wrong:** Back cover text stored but not included in generated PDF.

**Why it happens:** PDF generation only handles front cover image, not text content.

**How to avoid:**
- In Phase 7 (Cover PDF Generation), add back cover text rendering
- Use @react-pdf/renderer to render text on back cover
- This is a Phase 7 concern but should be noted now

**Warning signs:** PDF missing back cover content.

---

## Code Examples

### Complete Cover Uploader Component
```typescript
// src/components/covers/CoverUploader.tsx
'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { validateCoverImage, getMinCoverDimensions } from '@/lib/covers/validation'

interface CoverUploaderProps {
  bookId: string
  trimSizeId: string
  pageCount: number
  currentCoverUrl?: string
  onUploadComplete: (url: string, width: number, height: number) => void
}

export function CoverUploader({ 
  bookId, 
  trimSizeId, 
  pageCount, 
  currentCoverUrl,
  onUploadComplete 
}: CoverUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null)

  const minDims = getMinCoverDimensions(trimSizeId, pageCount)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Client-side validation first
      const validation = await validateCoverImage(file, minDims.width, minDims.height)
      
      if (!validation.valid) {
        setError(validation.error || 'Image does not meet minimum dimensions')
        setUploading(false)
        return
      }

      // Show preview
      setPreview(URL.createObjectURL(file))

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bookId', bookId)
      formData.append('coverType', 'front')

      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { url } = await response.json()
      onUploadComplete(url, validation.width!, validation.height!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploading(false)
    }
  }, [bookId, minDims, onUploadComplete])

  return (
    <div className="cover-uploader">
      <label className="block text-sm font-medium mb-2">
        Front Cover Image
        <span className="text-gray-500 text-xs ml-2">
          (min: {minDims.width}×{minDims.height}px)
        </span>
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        {preview ? (
          <div className="relative inline-block">
            <Image 
              src={preview} 
              alt="Cover preview" 
              width={200} 
              height={300}
              className="max-h-64 object-contain"
            />
            <button
              onClick={() => { setPreview(null); onUploadComplete('', 0, 0) }}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              ×
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/tiff,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className="cursor-pointer text-blue-600 hover:underline"
            >
              {uploading ? 'Uploading...' : 'Click to upload cover image'}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPEG, PNG, TIFF, or WebP. Minimum {minDims.width}×{minDims.height}px at 300 DPI.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
```

### Back Cover Input Component
```typescript
// src/components/covers/BackCoverInput.tsx
'use client'

import { useState } from 'react'

interface BackCoverInputProps {
  bookId: string
  initialType?: 'image' | 'text'
  initialImageUrl?: string
  initialText?: string
  onSave: (data: { type: 'image' | 'text'; imageUrl?: string; text?: string }) => Promise<void>
}

export function BackCoverInput({
  initialType = 'text',
  initialImageUrl,
  initialText,
  onSave,
}: BackCoverInputProps) {
  const [coverType, setCoverType] = useState<'image' | 'text'>(initialType)
  const [text, setText] = useState(initialText || '')
  const [saving, setSaving] = useState(false)

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bookId', bookId)
    formData.append('coverType', 'back')

    const response = await fetch('/api/upload/cover', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Upload failed')
    const { url } = await response.json()
    return url
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        type: coverType,
        ...(coverType === 'image' ? { imageUrl: initialImageUrl } : { text }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="back-cover-input space-y-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="backCoverType"
            checked={coverType === 'text'}
            onChange={() => setCoverType('text')}
          />
          Text Back Cover
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="backCoverType"
            checked={coverType === 'image'}
            onChange={() => setCoverType('image')}
          />
          Image Back Cover
        </label>
      </div>

      {coverType === 'text' ? (
        <div>
          <label className="block text-sm font-medium mb-2">Back Cover Description</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter your back cover text (author bio, book description, etc.)"
          />
          <p className="text-xs text-gray-500 mt-1">
            This text will appear on the back cover of your book.
          </p>
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/tiff,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) await handleImageUpload(file)
            }}
          />
          {initialImageUrl && (
            <img src={initialImageUrl} alt="Back cover preview" className="mt-2 h-32 object-contain" />
          )}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Back Cover'}
      </button>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side only validation | Client-side validation + server confirm | Modern browsers | Immediate feedback, better UX |
| Single back cover type | Dual mode (image OR text) | This phase | Flexibility for different user needs |
| Hardcoded minimums | Dynamic calculation based on book | This phase | Works for any trim size/combination |

**Deprecated/outdated:**
- Validating only file size (not dimensions)
- Assuming fixed cover sizes
- Only supporting image back covers

---

## Open Questions

1. **Should we offer cover template generation?**
   - What we know: Users need exact dimensions for KDP compliance
   - What's unclear: Whether to generate actual template files or just provide dimension specs
   - Recommendation: For Phase 5, just validate uploads. Template generation could be a future feature.

2. **How to handle DPI warnings?**
   - What we know: KDP requires 300 DPI minimum
   - What's unclear: Whether to block low-DPI uploads or just warn
   - Recommendation: Warn but allow (some users may have specific reasons)

3. **Should front/back covers be one combined upload or separate?**
   - What we know: KDP requires a single full-wrap cover for printing
   - What's unclear: Whether users prefer uploading separate images or a combined cover
   - Recommendation: Phase 5 - separate uploads for flexibility. Phase 7 - combine for final PDF.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)

This phase uses only JavaScript/TypeScript libraries and the existing storage infrastructure. No external tools, services, or CLI utilities are required beyond the existing Node.js runtime.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (from existing project) |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COV-01 | Upload front cover image | unit | `pnpm test --run --reporter=verbose -- --testNamePattern="cover.*upload"` | TODO: Add test |
| COV-02 | Upload back cover image OR text | unit/integration | `pnpm test --run --reporter=verbose -- --testNamePattern="cover.*back"` | TODO: Add test |
| COV-03 (validation) | Validate cover dimensions | unit | `pnpm test --run --reporter=verbose -- --testNamePattern="cover.*valid"` | TODO: Add test |

### Sampling Rate
- **Per task commit:** `pnpm test --run`
- **Per wave merge:** `pnpm test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/covers/cover-upload.test.ts` — covers COV-01 (front cover upload)
- [ ] `tests/covers/back-cover.test.ts` — covers COV-02 (back cover modes)
- [ ] `tests/covers/dimension-validation.test.ts` — covers COV-03 (dimension validation)
- [ ] `tests/utils/cover-fixtures.ts` — shared test fixtures
- [ ] Framework install: Already installed via existing project

---

## Sources

### Primary (HIGH confidence)
- https://kdp.amazon.com/en_US/help/topic/G6GTK3T3NUHKLEFX — Official KDP Cover Image Guidelines [HIGH]
- https://creativeparamita.com/book-cover/kdp-cover-size-guide-2025/ — KDP cover dimension calculations [HIGH]
- https://www.tiptap.dev/docs/editor/api/commands — For potential rich text back cover [HIGH]

### Secondary (MEDIUM confidence)
- https://stackoverflow.com/questions/8903854 — Client-side image dimension validation patterns [MEDIUM]

### Tertiary (LOW confidence)
- Various KDP cover size guides — Cross-referenced for consistency [MEDIUM]

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Reuses existing project infrastructure
- Architecture: HIGH — Patterns from official documentation and existing code
- Pitfalls: MEDIUM — Based on common image upload issues but not project-specific yet

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days for stable libraries)

---

## KDP Cover Specifications Reference

### Full Cover Dimensions Formula
```
Cover Width = Bleed + Back Cover + Spine + Front Cover + Bleed
Cover Height = Bleed + Trim Height + Bleed

Where:
- Bleed = 0.125" (3.2mm) on all sides
- Spine Width (B&W white) = Page Count × 0.002252"
- Spine Width (B&W cream) = Page Count × 0.0025"
- Spine Width (color) = Page Count × 0.002347"
```

### Minimum Requirements
- Resolution: 300 DPI minimum (600 DPI recommended)
- Color mode: RGB (KDP converts to CMYK)
- File format: JPEG, PNG, TIFF, or PDF
- File size: 50MB maximum
- Spine text: Only for books with 80+ pages

### Example: 6"×9" Book, 300 Pages, Cream Paper
- Spine = 300 × 0.0025" = 0.75"
- Cover Width = 0.125 + 6 + 0.75 + 6 + 0.125 = 13.0"
- Cover Height = 0.125 + 9 + 0.125 = 9.25"
- Min Pixels at 300 DPI = 3900 × 2775 pixels
