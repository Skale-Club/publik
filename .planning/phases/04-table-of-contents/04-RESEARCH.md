# Phase 4: Table of Contents - Research

**Researched:** 2026-03-30
**Domain:** TipTap TOC Extension + @react-pdf/renderer Bookmarks
**Confidence:** HIGH

## Summary

Phase 4 implements an auto-generated, editable table of contents that integrates with the TipTap editor and gets included in the final PDF output. The core approach uses `@tiptap/extension-table-of-contents` to extract headings from the editor content, stores custom TOC entries in the database for manual editing, and uses `@react-pdf/renderer` bookmarks to include the TOC in the generated PDF.

**Primary recommendation:** Use TipTap's TableOfContents extension with onUpdate callback to extract headings, store editable TOC entries separately in the database, and generate PDF bookmarks using the same ID system.

---

## User Constraints (from ROADMAP.md)

### Phase Requirements
| ID | Description | Research Support |
|----|-------------|------------------|
| TOC-01 | System automatically generates a TOC from chapter headings in the book | TipTap TableOfContents extension extracts headings automatically |
| TOC-02 | User can manually edit TOC entries (rename, reorder, add, or remove entries) | Custom TOC storage in database with Zod validation |
| TOC-03 | The TOC is included in the generated PDF output | @react-pdf/renderer bookmarks + visual TOC page |

### Success Criteria (from ROADMAP.md)
1. System automatically generates a TOC from chapter headings in the book
2. User can manually edit TOC entries (rename, reorder, add, or remove entries)
3. The TOC is included in the generated PDF output

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/extension-table-of-contents | 3.20.5 | Auto TOC generation from headings | Official TipTap extension, actively maintained (published Mar 24, 2026) |
| @tiptap/react | 3.x | React integration for TipTap | Required for using TipTap with React |
| @tiptap/pm | 3.x | ProseMirror core | Required peer dependency |
| @tiptap/starter-kit | 3.x | Core editor extensions | Includes Heading node which TOC parses |

### PDF Integration
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-pdf/renderer | 4.x | PDF generation with bookmarks | Required for PDF TOC (bookmarks + visual page) |
| pdf-lib | 1.17.1 | PDF post-processing | Merge TOC with content if needed separately |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | latest | Drag-and-drop reordering | For reorderable TOC UI |
| @dnd-kit/sortable | latest | Sortable list | For drag-and-drop TOC entries |
| zod | 3.x | TOC entry validation | Validate TOC entries before storage |

**Installation:**
```bash
pnpm add @tiptap/extension-table-of-contents @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @react-pdf/renderer
pnpm add @dnd-kit/core @dnd-kit/sortable zod
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── editor/
│   │   ├── TableOfContents.tsx      # TOC sidebar/drawer component
│   │   └── TOCEntry.tsx             # Individual TOC entry row
│   └── pdf/
│       ├── TOCDocument.tsx          # TOC page in PDF
│       └── BookmarkWrapper.tsx       # Component with bookmark prop
├── lib/
│   ├── toc/
│   │   ├── index.ts                 # TOC utilities
│   │   ├── headings.ts              # Extract headings from TipTap
│   │   └── transform.ts             # Transform TOC to PDF structure
│   └── editor/
│       └── extensions.ts            # TipTap extensions config
├── server/
│   └── actions/
│       └── toc.ts                   # TOC CRUD server actions
├── types/
│   └── toc.ts                       # TOC types
└── db/
    └── schema/
        └── toc.ts                   # Drizzle TOC schema
```

### Pattern 1: TipTap Table of Contents Integration

**What:** Uses TipTap's TableOfContents extension to automatically extract headings from editor content and provide them via onUpdate callback.

**When to use:** When you need to auto-generate a TOC from book chapter headings.

**Example:**
```typescript
// Source: https://www.tiptap.dev/docs/editor/extensions/functionality/table-of-contents
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TableOfContents from '@tiptap/extension-table-of-contents'

const [tocAnchors, setTocAnchors] = useState([])

const editor = useEditor({
  extensions: [
    StarterKit,
    TableOfContents.configure({
      // Which node types to use for TOC
      anchorTypes: ['heading'],
      // Generate hierarchical or linear indexes
      getIndex: getHierarchicalIndexes,
      // Custom ID generation (use slugify for readable IDs)
      getId: (content) => slugify(content),
      // CRITICAL: Callback when TOC updates
      onUpdate: ({ anchors }) => {
        setTocAnchors(anchors)
      },
    }),
  ],
  content: '<h1>Chapter 1</h1><p>...</p>',
})
```

**Anchor object structure:**
```typescript
{
  id: string           // Unique ID for linking
  textContent: string // Heading text
  level: number       // Heading level (1-6)
  originalLevel: number
  pos: number         // Position in document
  isActive: boolean   // Currently visible in editor
  isScrolledOver: boolean
}
```

### Pattern 2: Editable TOC Storage

**What:** Store TOC entries separately in the database so users can manually edit (rename, reorder, add, remove) without modifying the underlying editor content.

**When to use:** When users need to customize TOC entries independently from headings.

**Database Schema:**
```typescript
// src/db/schema/toc.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { books } from './books'

export const tocEntries = sqliteTable('toc_entries', {
  id: text('id').primaryKey(),  // Matches TipTap anchor ID
  bookId: text('book_id').references(() => books.id),
  title: text('title').notNull(),  // User-editable title
  level: integer('level').notNull(),
  anchorId: text('anchor_id'),  // Links to TipTap heading (nullable for custom entries)
  position: integer('position').notNull(),  // For manual ordering
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})
```

### Pattern 3: PDF Bookmarks Integration

**What:** Use @react-pdf/renderer's bookmark prop to create navigable PDF TOC that appears in PDF reader sidebar.

**When to use:** When generating PDF output for KDP.

**Example:**
```typescript
// Source: https://react-pdf.org/advanced#document-navigation
import { Document, Page, Text, View } from '@react-pdf/renderer'

// For each chapter/heading in PDF
const Chapter = ({ title, id, children }) => (
  <View>
    <Text
      id={id}
      bookmark={{
        title: title,
        fit: true,
        expanded: true
      }}
      style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}
    >
      {title}
    </Text>
    {children}
  </View>
)

// Full document with bookmarks
const BookDocument = ({ chapters, tocData }) => (
  <Document>
    {/* TOC Page */}
    <Page size="A4" bookmark="Table of Contents">
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Table of Contents</Text>
      {tocData.map((entry, index) => (
        <Link key={entry.id} src={`#${entry.anchorId}`}>
          <Text style={{ marginLeft: entry.level * 15 }}>
            {entry.title}
            {/* Dot leaders using dots repeated */}
            {'....................................'.slice(0, 30 - entry.title.length)}
            {/* Page number would be dynamically determined */}
          </Text>
        </Link>
      ))}
    </Page>

    {/* Content Pages with chapter bookmarks */}
    {chapters.map((chapter) => (
      <Chapter key={chapter.id} title={chapter.title} id={chapter.anchorId}>
        <Text>{chapter.content}</Text>
      </Chapter>
    ))}
  </Document>
)
```

### Pattern 4: Bidirectional TOC Sync

**What:** Keep stored TOC entries in sync with TipTap headings, allowing users to edit entries while maintaining the link to source headings.

**When to use:** Always - to maintain consistency between editable TOC and source content.

```typescript
// Sync strategy:
// 1. When editor content changes → onUpdate fires → extract headings
// 2. Compare with stored entries:
//    - New headings → create new TOC entries (position based on heading order)
//    - Removed headings → mark orphan entries (keep for undo, or auto-remove)
//    - Changed headings → update anchorId reference, keep custom title
// 3. User edits → update stored entry (title, position, add/remove)
// 4. PDF generation → use stored entries for both visual TOC and bookmarks
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heading extraction | Custom regex/parser | @tiptap/extension-table-of-contents | Already handles all edge cases, ProseMirror integration |
| TOC UI reordering | Custom drag-drop | @dnd-kit/sortable | Accessible, touch-friendly, well-maintained |
| PDF navigation | External links only | @react-pdf/renderer bookmarks | Native PDF feature, works in all readers |
| ID generation | Math.random() | slugify() or uuid | Deterministic, readable, SEO-friendly |

---

## Common Pitfalls

### Pitfall 1: TOC IDs Not Matching Between Editor and PDF
**What goes wrong:** TipTap generates UUIDs for heading IDs, but PDF uses different ID system. Bookmarks don't navigate to correct pages.

**Why it happens:** No shared ID generation strategy between TipTap and PDF components.

**How to avoid:** 
- Use consistent ID generation: pass the same `getId` function to TipTap TOC extension
- Store anchor IDs in TOC entries table
- Use those IDs when generating PDF bookmarks

**Warning signs:** Bookmarks navigate to wrong pages, TOC links don't work.

### Pitfall 2: TOC Not Updating When Headings Change
**What goes wrong:** User adds/changes a heading but TOC doesn't reflect the change.

**Why it happens:** onUpdate callback not properly wired to state, or TOC stored statically without sync logic.

**How to avoid:**
- Always use onUpdate callback from TableOfContents extension
- Implement sync function that compares extracted headings with stored entries
- Debounce updates to avoid excessive database writes

**Warning signs:** TOC shows stale data, headings missing from TOC.

### Pitfall 3: User Edits Lost on Heading Rename
**What goes wrong:** User customizes a TOC entry title, but when the underlying heading changes, the custom title is overwritten.

**Why it happens:** No distinction between "linked to heading" and "custom" entries.

**How to avoid:**
- Store `isCustom` flag and original `anchorId` separately from `title`
- When syncing, preserve custom titles when anchorId still exists
- Show visual indicator for custom vs. auto-generated entries

**Warning signs:** User complains their custom TOC titles keep disappearing.

### Pitfall 4: PDF Page Numbers Unknown at Render Time
**What goes wrong:** TOC page numbers show as "..." or wrong numbers because total pages unknown during initial render.

**Why it happens:** @react-pdf/renderer calls render function twice - first for layout, then for actual page numbers.

**How to avoid:**
- Use the `render` prop with `{ pageNumber, totalPages }` context
- Show loading state or "..." during first render pass
- This is expected behavior, not a bug

**Warning signs:** Page numbers show incorrect values or throw errors.

---

## Code Examples

### Complete TOC Sidebar Component
```typescript
// src/components/editor/TableOfContents.tsx
'use client'

import { useState, useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { TOCEntry } from './TOCEntry'

interface TableOfContentsProps {
  editor: ReturnType<typeof useEditor>
  entries: TOCEntryType[]
  onReorder: (oldIndex: number, newIndex: number) => void
  onUpdateEntry: (id: string, title: string) => void
  onRemove: (id: string) => void
  onAdd: (entry: Partial<TOCEntryType>) => void
}

export function TableOfContents({ editor, entries, onReorder, onUpdateEntry, onRemove, onAdd }: TableOfContentsProps) {
  const [anchors, setAnchors] = useState<Anchor[]>([])

  useEffect(() => {
    if (!editor) return
    
    const tocExtension = editor.extensionManager.extensions.find(
      ext => ext.name === 'tableOfContents'
    )
    
    if (tocExtension?.storage?.tableOfContents?.anchors) {
      setAnchors(tocExtension.storage.tableOfContents.anchors)
    }
  }, [editor])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = entries.findIndex(e => e.id === active.id)
    const newIndex = entries.findIndex(e => e.id === over.id)
    onReorder(oldIndex, newIndex)
  }

  return (
    <div className="toc-sidebar">
      <h3>Table of Contents</h3>
      
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {entries.map((entry) => (
            <TOCEntry
              key={entry.id}
              entry={entry}
              isLinkedToHeading={!!entry.anchorId}
              onUpdate={(title) => onUpdateEntry(entry.id, title)}
              onRemove={() => onRemove(entry.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={() => onAdd({ title: 'New Entry', level: 1, isCustom: true })}
        className="add-entry-btn"
      >
        + Add Custom Entry
      </button>
    </div>
  )
}
```

### TOC Sync Server Action
```typescript
// src/server/actions/toc.ts
'use server'

import { db } from '@/db'
import { tocEntries } from '@/db/schema/toc'
import { eq, asc } from 'drizzle-orm'

export async function syncTOCWithHeadings(bookId: string, headings: Anchor[]) {
  const existingEntries = await db.query.tocEntries.findMany({
    where: eq(tocEntries.bookId, bookId),
    orderBy: asc(tocEntries.position),
  })

  const updates: Promise<any>[] = []

  // Build a map of existing entries by anchorId for quick lookup
  const entryByAnchor = new Map(existingEntries.map(e => [e.anchorId, e]))

  // Process incoming headings
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    const existing = entryByAnchor.get(heading.id)

    if (existing) {
      // Update position if changed, preserve custom title
      if (existing.position !== i) {
        updates.push(db.update(tocEntries)
          .set({ position: i })
          .where(eq(tocEntries.id, existing.id)))
      }
    } else {
      // New heading - create new TOC entry
      updates.push(db.insert(tocEntries).values({
        id: crypto.randomUUID(),
        bookId,
        title: heading.textContent, // Default to heading text
        level: heading.level,
        anchorId: heading.id,
        position: i,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    }
  }

  await Promise.all(updates)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual TOC creation | Auto-extraction from headings | TipTap 2.x+ | Eliminates manual work for users |
| Static PDF links | Native PDF bookmarks | @react-pdf 2.2.0+ | Works in all PDF readers |
| Single-level TOC | Hierarchical index support | TipTap 3.x | Supports nested headings |
| Server-side TOC parsing | Client-side onUpdate callback | TipTap 2.x | Real-time updates, better UX |

**Deprecated/outdated:**
- Using heading IDs based on position only (breaks on reorder) - use slugify-based IDs
- Storing TOC as part of book content JSON (should be separate for editability)

---

## Open Questions

1. **Should TOC be stored in book content or separate table?**
   - What we know: TipTap stores TOC as editor storage, but for user editing we need persistence
   - What's unclear: Whether to store as JSON in books table or separate TOC table
   - Recommendation: Separate table for flexibility (allows custom entries, easier querying)

2. **How to handle page numbers in PDF TOC?**
   - What we know: @react-pdf/renderer can access page numbers via render prop
   - What's unclear: Whether to show exact page numbers or let KDP handle
   - Recommendation: Show placeholder during render, use post-processing to add real page numbers

3. **Should custom TOC entries link to specific editor positions?**
   - What we know: TipTap anchors have pos (position) field
   - What's unclear: Whether custom entries should create new anchors or just be visual
   - Recommendation: Custom entries should be visual-only in editor, but can create anchors in PDF

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified)

This phase uses only JavaScript/TypeScript libraries already in the project stack. No external tools, services, or CLI utilities are required beyond the existing Node.js runtime.

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
| TOC-01 | Auto-generate TOC from headings | unit | `pnpm test --run --reporter=verbose -- --testNamePattern="toc.*auto"` | TODO: Add test |
| TOC-02 | Edit TOC entries (CRUD) | unit/integration | `pnpm test --run --reporter=verbose -- --testNamePattern="toc.*edit"` | TODO: Add test |
| TOC-03 | TOC in PDF output | integration | `pnpm test --run --reporter=verbose -- --testNamePattern="pdf.*bookmark"` | TODO: Add test |

### Sampling Rate
- **Per task commit:** `pnpm test --run`
- **Per wave merge:** `pnpm test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/toc/toc-sync.test.ts` — covers TOC-01 (auto-generation)
- [ ] `tests/toc/toc-crud.test.ts` — covers TOC-02 (editing)
- [ ] `tests/pdf/bookmark.test.ts` — covers TOC-03 (PDF integration)
- [ ] `tests/utils/toc-fixtures.ts` — shared test fixtures
- [ ] Framework install: Already installed via existing project

---

## Sources

### Primary (HIGH confidence)
- https://www.tiptap.dev/docs/editor/extensions/functionality/table-of-contents — Official TipTap TOC extension docs [HIGH]
- https://react-pdf.org/advanced#document-navigation — @react-pdf/renderer bookmarks documentation [HIGH]
- https://www.npmjs.com/package/@tiptap/extension-table-of-contents — Package version 3.20.5, published Mar 24, 2026 [HIGH]
- https://www.npmjs.com/package/@react-pdf/renderer — Package version 4.3.2, published Dec 29, 2025 [HIGH]

### Secondary (MEDIUM confidence)
- https://github.com/diegomura/react-pdf/issues/1015 — TOC feature request/discussion [MEDIUM]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries are official and actively maintained
- Architecture: HIGH — Patterns derived from official documentation
- Pitfalls: MEDIUM — Based on common ProseMirror/PDF issues but not project-specific

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (30 days for stable libraries)
