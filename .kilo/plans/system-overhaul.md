# System Overhaul Plan: Publik v1.0 Fix

**Created:** 2026-03-31
**Status:** Planning
**Scope:** Complete system overhaul to fix architectural, security, and functional issues

---

## Problem Summary

The system compiles and tests pass, but has fundamental issues across every layer:
- **SQL Injection vulnerabilities** throughout the codebase
- **Drizzle ORM schemas defined but never used** — all queries are raw SQL
- **Duplicate route directories** (`(dashboard)/` and `dashboard/`)
- **Two TipTap editor implementations** with different capabilities
- **Editor with empty extensions** (`extensions: []`) = no formatting
- **HTML content rendered as raw text in PDFs** — all formatting lost
- **Cover dimensions only support 4 of 16 KDP trim sizes**
- **No cover management page route** — CoverEditor component exists but is inaccessible
- **Author hardcoded** as `"Author"` — not in DB schema
- **Client-side raw SQL bypass** in editor-page-client.tsx
- **TOC sidebar never rendered**
- **FileDownloads validation always "pending"**
- **CoverDocument missing `<Document>` wrapper**

---

## Phase Structure

### Phase A: Database Layer — Drizzle ORM Migration (Foundation)

**Goal:** Replace all raw sql.js queries with Drizzle ORM. Eliminate SQL injection. Add persistence with better-sqlite3 driver.

**Files to create/modify:**
- `src/infrastructure/db/client.ts` — Rewrite: use Drizzle ORM with better-sqlite3 driver, remove sql.js
- `src/infrastructure/db/schema/books.ts` — Add `author` field
- `src/infrastructure/db/schema/chapters.ts` — No changes needed
- `src/infrastructure/db/schema/covers.ts` — No changes needed
- `src/infrastructure/db/schema/toc.ts` — No changes needed
- `drizzle.config.ts` — Update for better-sqlite3
- `package.json` — Add `better-sqlite3`, remove `sql.js`

**Key changes:**
1. Replace `sql.js` with `better-sqlite3` as the SQLite driver (Drizzle supports it natively)
2. Use Drizzle ORM for ALL database queries — no raw SQL
3. Add `author` column to `books` table schema
4. Add `bleedSetting` column to `books` table schema
5. Remove `initDb()`/`getDb()`/`saveDb()`/`closeDb()` — Drizzle handles connection management
6. Export a single `db` instance from `client.ts` using Drizzle
7. Create a migration with `drizzle-kit generate` to handle schema changes

**Success criteria:**
- [ ] All database access uses Drizzle ORM query builder (zero raw SQL strings)
- [ ] SQL injection impossible by design (parameterized queries via Drizzle)
- [ ] `author` field in books table
- [ ] Database persists to `publik.db` file via better-sqlite3
- [ ] All existing tests pass with new DB layer
- [ ] `drizzle-kit push` works to sync schema

---

### Phase B: Data Access Layer — Repositories

**Goal:** Create a clean repository layer that centralizes all data access. Remove duplicate query logic scattered across pages, actions, and client components.

**Files to create:**
- `src/infrastructure/db/repositories/book-repository.ts`
- `src/infrastructure/db/repositories/chapter-repository.ts`
- `src/infrastructure/db/repositories/cover-repository.ts`
- `src/infrastructure/db/repositories/toc-repository.ts`
- `src/infrastructure/db/repositories/index.ts`

**Files to modify:**
- `src/app/(dashboard)/books/[bookId]/actions.ts` — Use repositories instead of raw SQL
- `src/server/actions/covers.ts` — Use repositories instead of raw SQL
- `src/server/actions/toc.ts` — Use repositories instead of raw SQL
- All page components — Remove inline `require()` DB calls, use server actions or repositories

**Key changes:**
1. Each repository provides typed CRUD methods using Drizzle queries
2. Column name mapping (snake_case → camelCase) handled in one place by Drizzle
3. Soft delete pattern centralized
4. All server actions call repositories — no direct DB access in actions
5. Remove `getChaptersUpdated()` from editor-page-client.tsx (client-side DB access)
6. Remove all `require("@/infrastructure/db/client")` calls from page components

**Success criteria:**
- [ ] Zero `require()` calls for DB in page components
- [ ] Zero raw SQL strings in server actions
- [ ] All data access goes through repository layer
- [ ] Column mapping centralized — no manual mapping in page components

---

### Phase C: Route Cleanup — Remove Duplicates

**Goal:** Remove duplicate `dashboard/` route directory. Keep only `(dashboard)/` route group.

**Files to delete:**
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/books/new/page.tsx`
- `src/app/dashboard/books/[bookId]/page.tsx`
- `src/app/dashboard/books/[bookId]/editor/page.tsx`
- `src/app/dashboard/books/[bookId]/export/page.tsx`
- `src/app/dashboard/books/[bookId]/chapters/[chapterId]/page.tsx`
- Delete entire `src/app/dashboard/` directory

**Files to modify:**
- `src/app/(dashboard)/layout.tsx` — Ensure it works as standalone layout
- Move `src/app/dashboard/page.tsx` content (books listing) to `src/app/(dashboard)/page.tsx` or keep the redirect from `src/app/page.tsx`

**Key changes:**
1. Move dashboard listing page into `(dashboard)` route group if not already there
2. Delete all re-export files in `src/app/dashboard/`
3. Verify all links still resolve correctly (`/dashboard`, `/dashboard/books/new`, etc.)

**Success criteria:**
- [ ] `src/app/dashboard/` directory fully removed
- [ ] All routes accessible via `(dashboard)` route group
- [ ] No 404s on any existing URL patterns
- [ ] Build passes

---

### Phase D: Editor Consolidation — Single TipTap Editor

**Goal:** Consolidate two TipTap editor implementations into one. Fix the empty extensions bug. Wire up auto-save correctly.

**Files to delete:**
- `src/components/books/tiptap-editor.tsx` (simpler, unused by main editor)

**Files to modify:**
- `src/components/editor/tiptap-editor.tsx` — Ensure it has all needed features (StarterKit, Image, Underline, Placeholder)
- `src/app/(dashboard)/books/[bookId]/editor/editor-page-client.tsx` — Major rewrite:
  - Fix `useEditor` to include proper extensions
  - Fix `useMemo` misuse for content sync → use `useEffect`
  - Remove `getChaptersUpdated()` raw SQL call → use server action `getChapters`
  - Fix `handleContentChange` empty callback
  - Wire `currentContent` state correctly with editor `onUpdate`
  - Add TOC sidebar rendering
- `src/components/books/chapter-editor.tsx` — Update to use consolidated editor
- `src/components/editor/editor-toolbar.tsx` — Ensure complete toolbar

**Key changes:**
1. Single TipTap editor component with all extensions: StarterKit, Image, Underline, Placeholder
2. `useEditor` in editor-page-client.tsx includes extensions array
3. Content sync via `useEffect` on `selectedChapterId` change
4. Auto-save wired via editor's `onUpdate` callback → `setCurrentContent` → `useAutoSave`
5. Chapter list refresh via server action `getChapters` (not raw SQL)
6. TOC sidebar rendered alongside editor

**Success criteria:**
- [ ] One TipTap editor component used everywhere
- [ ] Editor has working formatting (bold, italic, headings, lists, images)
- [ ] Auto-save triggers on content change
- [ ] Chapter switching updates editor content
- [ ] TOC sidebar visible and interactive
- [ ] No raw SQL in client components

---

### Phase E: Cover System Fix

**Goal:** Fix cover dimensions for all 16 trim sizes. Add cover management page route. Fix CoverDocument PDF structure.

**Files to modify:**
- `src/lib/covers/dimensions.ts` — Expand TRIM_SIZES to all 16 KDP trim sizes from domain
- `src/lib/pdf/cover-document.tsx` — Wrap content in `<Document>` component
- `src/lib/pdf/cover-dimensions.ts` — Use domain trim sizes instead of hardcoded 4

**Files to create:**
- `src/app/(dashboard)/books/[bookId]/cover/page.tsx` — Cover management page using CoverEditor component

**Files to modify:**
- `src/app/(dashboard)/books/[bookId]/page.tsx` — Add link to cover management page

**Key changes:**
1. `dimensions.ts` TRIM_SIZES: import from `@/domain/kdp/trim-sizes` or duplicate all 16 entries
2. CoverDocument: wrap `<Page>` in `<Document>` for valid PDF
3. Cover management route at `/dashboard/books/[bookId]/cover`
4. Link from book detail page to cover editor
5. Fix hardcoded `author: "Author"` in PDF routes → use `book.author`

**Success criteria:**
- [ ] All 16 KDP trim sizes supported in cover calculations
- [ ] CoverDocument generates valid PDF with `<Document>` wrapper
- [ ] Cover editor accessible via `/dashboard/books/[id]/cover`
- [ ] Author field comes from book data, not hardcoded

---

### Phase F: Interior PDF — HTML-to-PDF Conversion

**Goal:** Fix the interior PDF to properly convert HTML content from the editor into formatted PDF output, instead of dumping raw text.

**Files to modify:**
- `src/lib/pdf/interior-document.tsx` — Implement proper HTML-to-PDF rendering

**New files to create:**
- `src/lib/pdf/html-to-pdf.ts` — HTML parser that converts TipTap HTML to @react-pdf/renderer components

**Key changes:**
1. Parse chapter HTML content (from TipTap) into structured elements
2. Convert `<h1>`-`<h6>` → styled `<Text>` with heading fonts
3. Convert `<p>` → `<Text>` with body font and line height
4. Convert `<strong>`, `<em>` → inline styled text
5. Convert `<ul>`, `<ol>`, `<li>` → nested `<View>` + `<Text>`
6. Convert `<blockquote>` → indented styled `<View>`
7. Handle multi-page content (text wrapping, page breaks)
8. Remove the single `<Text>{chapter.content}</Text>` raw dump

**Approach:** Write a custom lightweight HTML-to-react-pdf converter for the limited HTML subset that TipTap generates (no external deps needed).

**Success criteria:**
- [ ] Headings render with correct font sizes and weights
- [ ] Paragraphs have proper spacing and line height
- [ ] Bold, italic, underline text works
- [ ] Lists render with bullets/numbers
- [ ] Long chapters span multiple pages (auto page break)
- [ ] Images in content are rendered (if feasible with react-pdf)

---

### Phase G: Export & Validation Fixes

**Goal:** Fix FileDownloads validation. Fix createBook redirect. Fix chapter reorder bug.

**Files to modify:**
- `src/components/export/FileDownloads.tsx` — Actually call `/api/validate` and show real results
- `src/components/books/book-form.tsx` — Fix redirect after book creation
- `src/components/books/chapter-list.tsx` — Fix reorder swap logic
- `src/app/(dashboard)/books/[bookId]/export/page.tsx` — Wire validation properly

**Key changes:**
1. FileDownloads: fetch validation from `/api/validate?bookId=...` on mount, display results
2. BookForm: use `router.push("/dashboard")` or server-side `redirect()` after create
3. Chapter list reorder: fix array swap logic (swap elements, not IDs)
4. ValidationReport: use real data from API

**Success criteria:**
- [ ] Validation status shows real results (pass/fail), not perpetual "pending"
- [ ] Creating a book redirects to book detail page
- [ ] Chapter reorder works correctly (up/down swaps elements properly)

---

### Phase H: UI Polish & Missing Pages

**Goal:** Add loading/error states. Fix navigation. Clean up remaining issues.

**Files to create:**
- `src/app/(dashboard)/loading.tsx`
- `src/app/(dashboard)/error.tsx`
- `src/app/(dashboard)/books/[bookId]/loading.tsx`
- `src/app/(dashboard)/books/[bookId]/error.tsx`
- `src/app/(dashboard)/books/[bookId]/editor/loading.tsx`
- `src/app/(dashboard)/books/[bookId]/export/loading.tsx`

**Files to modify:**
- `src/app/(dashboard)/layout.tsx` — Add navigation links (Editor, Cover, Export, Settings)
- `src/app/(dashboard)/books/[bookId]/page.tsx` — Add navigation tabs/links to sub-pages

**Key changes:**
1. Add `loading.tsx` for all major routes
2. Add `error.tsx` for all major routes
3. Sidebar navigation: links to all book sub-pages (editor, cover, export, settings)
4. Book detail page: tabs or cards linking to editor, cover, export
5. Breadcrumb navigation

**Success criteria:**
- [ ] Loading spinners show while pages load
- [ ] Error pages display for failed loads
- [ ] Navigation between book sections is intuitive
- [ ] All book management actions accessible from UI

---

## Execution Order

```
Phase A (DB Layer) → Phase B (Repositories) → Phase C (Routes) → Phase D (Editor)
                                                                    ↓
Phase E (Cover) ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ┘
     ↓
Phase F (Interior PDF)
     ↓
Phase G (Export/Validation)
     ↓
Phase H (UI Polish)
```

**Phases A and B must come first** — they are the foundation for everything else.
**Phase C is independent** — can run in parallel with A/B or after.
**Phases D through H depend on A and B** being complete.

## Estimated Effort

| Phase | Complexity | Est. Time |
|-------|-----------|-----------|
| A: Database Layer | High | 2-3 hours |
| B: Repositories | Medium | 1-2 hours |
| C: Route Cleanup | Low | 30 min |
| D: Editor Consolidation | High | 2-3 hours |
| E: Cover System | Medium | 1-2 hours |
| F: Interior PDF | Very High | 3-4 hours |
| G: Export & Validation | Medium | 1-2 hours |
| H: UI Polish | Low | 1-2 hours |
| **Total** | | **~12-18 hours** |

## Risk Areas

1. **Phase A (DB Migration):** Changing from sql.js to better-sqlite3 could break existing publik.db files. Need migration strategy.
2. **Phase D (Editor):** TipTap `useEditor` hook lifecycle with content sync is tricky — React strict mode can cause double-renders.
3. **Phase F (HTML-to-PDF):** Writing a custom HTML parser is error-prone. The subset TipTap generates is limited but still needs comprehensive handling.
4. **Breaking changes:** All phases modify core infrastructure — need to verify no regressions after each phase.

## Dependencies to Add/Remove

**Add:**
- `better-sqlite3` — Drizzle ORM SQLite driver
- `@types/better-sqlite3` — TypeScript types

**Remove:**
- `sql.js` — Replaced by better-sqlite3

## Test Strategy

After each phase:
1. Run `pnpm build` — must pass
2. Run `pnpm test` — all existing tests pass
3. Add new tests for repository layer (Phase B)
4. Add tests for HTML-to-PDF converter (Phase F)
5. Manual verification of editor functionality (Phase D)
