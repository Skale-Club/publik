---
generated: 2026-04-02
focus: concerns
---

# Codebase Concerns

**Analysis Date:** 2026-04-02

---

## Security Issues

### No Authentication on Any Route — CRITICAL
- **Issue:** The entire application has zero authentication. Every API route, server action, and page is publicly accessible. Any person with the URL can read all books, delete any book, upload files, and generate PDFs.
- **Files:** `src/app/(dashboard)/layout.tsx`, `src/app/api/upload/cover/route.ts`, `src/app/api/upload/image/route.ts`, `src/app/api/generate/pdf/route.ts`, `src/app/api/download/zip/route.ts`, `src/app/(dashboard)/books/[bookId]/actions.ts`
- **Impact:** In production with a public URL, all user data is exposed to the open internet. File upload endpoints can be abused to fill Supabase storage. PDF generation endpoints can be hammered to exhaust serverless CPU quotas.
- **Fix approach:** Integrate Better Auth (already in the recommended stack). Add auth middleware to protect the entire `(dashboard)` route group and all `/api/*` routes.

### Upload Routes Accept Unauthenticated Requests — CRITICAL
- **Issue:** `/api/upload/cover` and `/api/upload/image` accept files from anyone without verifying the caller owns the `bookId` being written to. A caller can pass any `bookId` to store files in another user's namespace in Supabase Storage.
- **Files:** `src/app/api/upload/cover/route.ts:7-47`, `src/app/api/upload/image/route.ts:6-31`
- **Impact:** Arbitrary file write into any book's Supabase Storage path; potential storage abuse.
- **Fix approach:** After auth is added, verify that `bookId` belongs to the authenticated user before upload.

### Supabase Admin Client Used for All Storage Operations — HIGH
- **Issue:** `getSupabaseAdmin()` in `src/lib/supabase.ts` uses the service role key, which bypasses RLS entirely. All storage operations (cover upload, image upload) run with superuser privileges. If the service role key is ever leaked or if there is a path traversal bug, an attacker has full Supabase access.
- **Files:** `src/lib/supabase.ts`, `src/lib/storage.ts`
- **Impact:** Over-privileged; a bug in storage path construction could allow cross-user access.
- **Fix approach:** Use scoped storage tokens or RLS policies rather than the service role key for routine uploads.

### RLS Enabled but No Policies Defined — HIGH
- **Issue:** Migration `drizzle/0001_enable_rls_public_tables.sql` enables RLS on all four tables but defines no `ALLOW` policies. This means the service role key (used by `src/infrastructure/db/client.ts`) bypasses RLS and can read/write everything, but a row-level security check with an anon or authenticated Supabase JWT would deny all access. There is no protection model in place.
- **Files:** `drizzle/0001_enable_rls_public_tables.sql`, `src/infrastructure/db/client.ts`
- **Impact:** False sense of security — RLS is enabled but provides no actual access control since all queries run through the service role.
- **Fix approach:** Define RLS policies scoped to user ID once authentication is added, or explicitly document that RLS is intentionally permissive for now.

### `DATABASE_URL` Used with Non-null Assertion, No Startup Validation — MEDIUM
- **Issue:** `src/infrastructure/db/client.ts` uses `process.env.DATABASE_URL!` (non-null assertion). If the env var is missing at runtime, the postgres client throws an unhandled error during module initialization, potentially crashing the server with an opaque message.
- **Files:** `src/infrastructure/db/client.ts:5`
- **Impact:** Silent build success, runtime crash on missing env var.
- **Fix approach:** Add explicit env var validation at startup (e.g., a `src/lib/env.ts` that validates all required vars with zod and fails fast with a clear error).

---

## Bug Risks

### Duplicate `TipTapEditor` Components — HIGH
- **Issue:** There are two completely separate `TipTapEditor` implementations: `src/components/books/tiptap-editor.tsx` and `src/components/editor/tiptap-editor.tsx`. They have different props interfaces, different extension sets, and different behavior. `ChapterEditor` in `src/components/books/chapter-editor.tsx` uses the `books/` version and passes an `onImageUpload` prop that does not exist in `src/components/editor/tiptap-editor.tsx`'s type definition. This is a runtime prop mismatch.
- **Files:** `src/components/books/tiptap-editor.tsx`, `src/components/editor/tiptap-editor.tsx`, `src/components/books/chapter-editor.tsx:84`
- **Impact:** `chapter-editor.tsx` passes `onImageUpload` to a component that may not consume it. Unclear which editor is canonical. Feature divergence risk.
- **Fix approach:** Remove `src/components/books/tiptap-editor.tsx` and consolidate on `src/components/editor/tiptap-editor.tsx`, or clearly document which is used where.

### Auto-Save `onSave` Callback Not Stable — MEDIUM
- **Issue:** In `src/app/(dashboard)/books/[bookId]/editor/editor-page-client.tsx`, `handleSave` is wrapped in `useCallback` with `[selectedChapterId]` dependency. When `selectedChapterId` changes, a new `handleSave` is created. Because `useAutoSave` depends on `onSave` in its effect deps, this causes a re-render loop risk: changing chapter triggers `handleSave` recreation → auto-save re-runs → `lastSavedRef` may not have updated yet → saves old content to new chapter.
- **Files:** `src/app/(dashboard)/books/[bookId]/editor/editor-page-client.tsx:56-64`, `src/components/editor/use-auto-save.ts:19-48`
- **Impact:** When switching chapters rapidly, auto-save may write the previous chapter's content to the newly selected chapter, corrupting book content.
- **Fix approach:** Add a guard in `useAutoSave` or reset `lastSavedRef` when the chapter changes. Cancel pending auto-save timeouts on chapter switch.

### Chapter Content Sync Uses Stale `editor` Reference — MEDIUM
- **Issue:** In `editor-page-client.tsx`, the `useEffect` that syncs content when `selectedChapterId` changes references `editor` and `selectedChapter` in its body but only lists `[selectedChapterId]` in deps (line 54). If `editor` is null at the time, the sync is silently skipped.
- **Files:** `src/app/(dashboard)/books/[bookId]/editor/editor-page-client.tsx:46-54`
- **Impact:** Switching to a newly created chapter before TipTap initializes results in the editor showing stale content from the previous chapter.
- **Fix approach:** Include `editor` in the dependency array, or use a `ref` to avoid dependency issues.

### `reorderChapters` Uses Sequential DB Updates — MEDIUM
- **Issue:** `reorderChapters` in `src/app/(dashboard)/books/[bookId]/actions.ts` issues one `UPDATE` per chapter in a `for` loop (line 153-156). Similarly `reorderTOCEntriesAction` in `src/server/actions/toc.ts` and `reorderTOCEntries` in `src/lib/toc/sync.ts`. For a book with many chapters/TOC entries, this creates N sequential DB round-trips.
- **Files:** `src/app/(dashboard)/books/[bookId]/actions.ts:153-156`, `src/server/actions/toc.ts:120-124`, `src/lib/toc/sync.ts:102-106`
- **Impact:** Each reorder call is slow and not atomic. If one update fails, partial reorder states persist.
- **Fix approach:** Use a single bulk update query or Drizzle's transaction API.

### `syncTOC` Duplicate Logic — MEDIUM
- **Issue:** `syncTOC` in `src/server/actions/toc.ts` and `syncTOCWithHeadings` in `src/lib/toc/sync.ts` implement identical logic. Both exist and are independently maintained.
- **Files:** `src/server/actions/toc.ts:206-271`, `src/lib/toc/sync.ts:43-98`
- **Impact:** Bug fixes in one will not automatically apply to the other.
- **Fix approach:** Remove `src/lib/toc/sync.ts`'s `syncTOCWithHeadings` and call the server action instead, or extract the shared logic to a pure function.

### `ensureBucketExists` Called on Every Upload — MEDIUM
- **Issue:** `saveImage` and `saveCoverImage` call `ensureBucketExists` before every upload. This performs a `listBuckets` API call to Supabase Storage on each file upload request.
- **Files:** `src/lib/storage.ts:13,43`, `src/lib/supabase.ts:42-52`
- **Impact:** Adds latency and an extra API call to every upload. In production with many uploads, this adds unnecessary load.
- **Fix approach:** Initialize bucket existence once at app startup, or use a module-level flag per bucket name.

### TOC Sidebar Syncs on Every `anchors` Change Without Debounce — LOW
- **Issue:** `src/components/editor/toc-sidebar.tsx` calls `handleSync` (which calls the `syncTOC` server action) in a `useEffect` triggered on every `anchors` change. Every keystroke that changes a heading fires a server action + DB writes.
- **Files:** `src/components/editor/toc-sidebar.tsx:59-63`
- **Impact:** High frequency of server action calls while typing in headings; potential DB write storms.
- **Fix approach:** Debounce the `handleSync` call with a 1-2 second delay.

---

## Performance Issues

### PDF Generation Loads All Chapter Content Into Memory — MEDIUM
- **Issue:** The PDF generation endpoint at `src/app/api/generate/pdf/route.ts` loads the full text content of all chapters into memory at once before calling `renderToStream`. For very large books, this can cause memory pressure in serverless environments.
- **Files:** `src/app/api/generate/pdf/route.ts:39-47`
- **Impact:** Large books may cause 500 errors due to memory limits on Vercel serverless functions (typically 1GB).
- **Fix approach:** No immediate fix available with `@react-pdf/renderer`'s API, but page count could be used to warn users before generation.

### ZIP Route Makes Two Internal HTTP Fetches — MEDIUM
- **Issue:** `src/app/api/download/zip/route.ts` uses `fetch()` to call `/api/generate/pdf` and `/api/generate/cover` from within the same Next.js process. This causes the request to leave the process, go through the network stack, and re-enter, adding latency and doubling memory use (PDF buffered twice).
- **Files:** `src/app/api/download/zip/route.ts:51-68`
- **Impact:** Slower ZIP generation; potential timeout issues on large books since the outer route also has `maxDuration = 300` but must wait for two inner 300s routes.
- **Fix approach:** Import the PDF generation logic directly (call the render functions without HTTP) rather than making internal fetch calls.

### `estimatePageCount` Uses Word Splitting on Raw HTML — LOW
- **Issue:** In `src/app/api/generate/pdf/route.ts`, `estimatePageCount` splits `chapter.content` (which is HTML) on whitespace to count words. HTML tags are counted as words, inflating the estimate.
- **Files:** `src/app/api/generate/pdf/route.ts:14-20`
- **Impact:** Inaccurate page count estimate fed into `BookSettings`, which affects KDP margin calculations.
- **Fix approach:** Strip HTML tags before counting words, or use the `htmlToPDFText` utility already available in `src/lib/pdf/html-to-pdf.tsx`.

### Cover Page Count Uses Character Length Estimate — LOW
- **Issue:** `src/components/covers/CoverEditor.tsx` estimates page count from chapter content character length (`contentLength / 2000`), while `src/app/api/generate/cover/route.ts` uses word count (`words / 300`). The two estimates produce different page counts, which means the spine width shown in the UI differs from the spine width in the generated cover PDF.
- **Files:** `src/components/covers/CoverEditor.tsx:38-44`, `src/app/api/generate/cover/route.ts:43-49`
- **Impact:** Cover PDF spine width does not match the user-visible spine width estimate. KDP may reject a cover with wrong spine dimensions.
- **Fix approach:** Centralize page count estimation to a single shared utility and use the same algorithm everywhere.

---

## Architecture Smells

### Business Logic Duplicated Across Pages — MEDIUM
- **Issue:** The `getBook` function that fetches and maps a `Book` from the DB is copy-pasted into at least three page files: `src/app/(dashboard)/books/[bookId]/page.tsx`, `src/app/(dashboard)/books/[bookId]/export/page.tsx`, and `src/app/(dashboard)/books/[bookId]/editor/page.tsx`. The schema-to-domain mapping is repeated each time.
- **Files:** `src/app/(dashboard)/books/[bookId]/page.tsx:15-32`, `src/app/(dashboard)/books/[bookId]/export/page.tsx:13-30`, `src/app/(dashboard)/books/[bookId]/editor/page.tsx`
- **Impact:** Changes to the `Book` domain type or schema mapping must be applied in multiple places. Risk of inconsistent mapping.
- **Fix approach:** Extract a shared `getBook(bookId)` function into `src/server/actions/books.ts` or `src/infrastructure/db/queries/books.ts`.

### `drizzle.config.ts` Exists Twice — LOW
- **Issue:** There are two Drizzle config files: `/drizzle.config.ts` at root and `src/drizzle.config.ts` inside `src/`. Both are identical.
- **Files:** `/c/Users/Vanildo/Dev/publik/drizzle.config.ts`, `/c/Users/Vanildo/Dev/publik/src/drizzle.config.ts`
- **Impact:** Ambiguity about which config is active. Running `drizzle-kit` from the project root uses the root config, but the presence of a second file in `src/` is confusing and may be used accidentally.
- **Fix approach:** Delete `src/drizzle.config.ts`.

### `cover-document.tsx` Has Incorrect Flex Width Math — MEDIUM
- **Issue:** In `src/lib/pdf/cover-document.tsx`, the cover layout is split using percentage widths calculated from `dimensions.totalWidth`. However, the back cover and front cover percentages use `backCoverWidth` and `frontCoverWidth` which already equal `trimWidth` (not accounting for bleed inside them). The separate bleed sections add `bleedPercent` on both sides, meaning the total percentages may not sum to 100% when floating point precision is involved.
- **Files:** `src/lib/pdf/cover-document.tsx:122-133`
- **Impact:** Cover PDF layout may have a sub-pixel gap or overflow, potentially causing KDP rejection.
- **Fix approach:** Sum all section widths and verify they equal `totalWidth`; use fixed widths in points rather than percentages if precision is required.

---

## TypeScript Issues

### `editor: any` in TOC Sidebar — MEDIUM
- **Issue:** The `editor` prop in `src/components/editor/toc-sidebar.tsx` is typed as `any` (line 33). The editor is passed in but never called on, so the type unsafety is low risk currently — but the `editor` prop is unused entirely in the component, making the prop declaration dead code.
- **Files:** `src/components/editor/toc-sidebar.tsx:33`
- **Impact:** No type safety on the editor prop; `editor` is accepted but never used (the sidebar interacts with the DB only via server actions, not the editor directly).
- **Fix approach:** Either type it as `Editor | null` from `@tiptap/react` or remove the unused prop.

### Unsafe Casts from DB Enum Columns — LOW
- **Issue:** Multiple files cast DB string values to TypeScript union types using `as Book["paperType"]` and similar patterns without runtime validation. If a row has a value not in the union (e.g., legacy data), this cast silently passes TypeScript but causes runtime errors downstream.
- **Files:** `src/app/(dashboard)/page.tsx:21-23`, `src/app/(dashboard)/books/[bookId]/page.tsx:20-27`, `src/server/actions/covers.ts:47-52`
- **Impact:** If the database ever has an unexpected enum value, the cast will not catch it.
- **Fix approach:** Use Zod parse or Drizzle's `$inferSelect` with proper enum column types to validate at the boundary.

### `@ts-expect-error` for PDF Bookmark Prop — LOW
- **Issue:** The `bookmark` prop on `@react-pdf/renderer`'s `Text` component is suppressed with `@ts-expect-error` in two files. The comment says "bookmark prop exists at runtime" but this is a missing type in the library's declarations.
- **Files:** `src/lib/pdf/interior-document.tsx:204,290`, `src/lib/pdf/toc-document.tsx:113,172`
- **Impact:** If the library changes its API, the suppression hides compile errors.
- **Fix approach:** Add a module augmentation for `@react-pdf/renderer` that adds the `bookmark` prop to `TextProps`.

---

## Dead Code

### `sql.js` Custom Types with No Active Usage — LOW
- **Issue:** `src/types/sql.js.d.ts` contains custom type declarations for `sql.js`, a browser-side SQLite library. The `next.config.ts` also includes a `serverExternalPackages: ["sql.js"]` entry. The project has fully migrated to Supabase/PostgreSQL (last 4 commits). There is also a `public/vendor/sql.js/sql-wasm.wasm` file (a 900KB+ binary).
- **Files:** `src/types/sql.js.d.ts`, `next.config.ts:4`, `public/vendor/sql.js/sql-wasm.wasm`
- **Impact:** Dead code and a 900KB+ binary bundled in `public/` with no purpose; noise in the codebase.
- **Fix approach:** Remove `sql.js` type declarations, the `serverExternalPackages` entry, and the wasm file.

### `InteriorDocumentWithPageNumbers` Unused Export — LOW
- **Issue:** `src/lib/pdf/interior-document.tsx` exports `InteriorDocumentWithPageNumbers` (line 232), which is a second pass rendering variant. No import of this export can be found in the codebase.
- **Files:** `src/lib/pdf/interior-document.tsx:232-316`
- **Impact:** ~85 lines of unused code that adds maintenance overhead.
- **Fix approach:** Remove or use it (intended for TOC page number resolution on second render pass).

### `src/lib/toc/sync.ts` Largely Superseded — LOW
- **Issue:** `src/lib/toc/sync.ts` exports `syncTOCWithHeadings`, `reorderTOCEntries`, `addCustomTOCEntry`, and `removeTOCEntry`, all of which duplicate functions in `src/server/actions/toc.ts`. None of the functions from `sync.ts` appear to be called anywhere in the UI layer.
- **Files:** `src/lib/toc/sync.ts`
- **Impact:** Duplicate logic that can diverge.
- **Fix approach:** Verify no imports, then delete the file.

### `src/lib/toc/transform.ts` and `src/lib/toc/index.ts` — LOW
- **Issue:** These files exist but their usage should be verified after the above cleanup.
- **Files:** `src/lib/toc/transform.ts`, `src/lib/toc/index.ts`

---

## Missing Critical Features

### No Session Persistence for Auth — CRITICAL (prerequisite)
- **Problem:** No authentication system exists. The app cannot be safely deployed for multi-user use or even as a single-user tool on the public internet.
- **Blocks:** Any SaaS path; safe production deployment.

### TOC Page Numbers Are Always "..." — HIGH
- **Problem:** The `InteriorDocument` function (which is what is actually called in the PDF route) renders TOC page entries with `"..."` for page numbers because `transformTOCForPDF` does not know actual page numbers. The `InteriorDocumentWithPageNumbers` variant that resolves page numbers is never called.
- **Files:** `src/lib/pdf/interior-document.tsx:115`, `src/app/api/generate/pdf/route.ts:79`
- **Impact:** Every generated interior PDF has an unusable Table of Contents showing `...` for all page numbers. This is a core feature gap for a publishing tool.
- **Fix approach:** Use `@react-pdf/renderer`'s two-pass rendering or its `<Text render={({pageNumber}) => ...} />` pattern to inject actual page numbers.

### Image MIME Type Not Validated for Inline Editor Images — MEDIUM
- **Problem:** The inline image upload in `src/app/api/upload/image/route.ts` checks only file size, not MIME type. Any file type can be uploaded via the image insert button as long as it is under 10MB.
- **Files:** `src/app/api/upload/image/route.ts:18-22`
- **Impact:** Potential for non-image files to be stored and served; XSS risk if SVG files are uploaded and rendered directly in the browser.
- **Fix approach:** Add MIME type validation identical to the cover upload route.

### Base64 Images Embedded in Chapter Content — MEDIUM
- **Problem:** Both TipTap editor components enable `allowBase64: true`. If a user pastes an image directly from clipboard, TipTap embeds it as a base64 data URI in the chapter content HTML, which is then stored in the `chapters.content` DB column. A single pasted screenshot can embed several MB of base64 in a text column.
- **Files:** `src/components/books/tiptap-editor.tsx:48`, `src/components/editor/tiptap-editor.tsx:41`
- **Impact:** Database row bloat; slow chapter loads; potential DB column size issues.
- **Fix approach:** Intercept paste events in TipTap to upload images to Supabase Storage instead of embedding base64. Set `allowBase64: false` after implementing the paste handler.

---

## Dependency Issues

### Fonts Loaded from CDN (`unpkg.com`) at PDF Generation Time — HIGH
- **Issue:** `src/lib/pdf/font-registration.ts` registers 12 font variants from `unpkg.com` CDN URLs. Every PDF generation request downloads fonts from the internet. If `unpkg.com` is down, slow, or the specific package version is removed, PDF generation fails completely.
- **Files:** `src/lib/pdf/font-registration.ts:12-28`
- **Impact:** PDF generation is coupled to internet availability and CDN uptime; breaks in serverless cold-start environments where outbound internet may have latency restrictions.
- **Fix approach:** Download the TTF files to `/public/fonts/` (the README.md in that directory describes exactly how to do this). The README already acknowledges this as a planned improvement.

### `pdfjs-dist` v5 Uses Legacy Build Path — LOW
- **Issue:** `src/lib/import/pdf-utils.ts` imports from `pdfjs-dist/legacy/build/pdf.mjs`. `pdfjs-dist` v5 changed its build structure. Using the `legacy/` path may work but deviates from the recommended import path for v5, which could break on patch updates.
- **Files:** `src/lib/import/pdf-utils.ts:3`
- **Impact:** Potential breakage on `pdfjs-dist` patch update.
- **Fix approach:** Verify the correct import path for `pdfjs-dist` v5 and update.

### `lucide-react` v1.7.0 — LOW
- **Issue:** `package.json` lists `lucide-react: "^1.7.0"`. The lucide-react versioning is unusual — v1.x is the new major version after a long period in 0.x. Icon names or APIs may have changed. Verify all icon names used are valid in 1.x.
- **Files:** `package.json:21`

---

## Deployment Risks

### `publik.db-shm` Committed to Git — HIGH
- **Issue:** `publik.db-shm` (a SQLite shared memory file) is tracked by git (`git ls-files` confirms it is staged). This is a leftover from the pre-Supabase SQLite era. The `.gitignore` only ignores `publik.db` and `publik.db-journal`, not `publik.db-shm` or `publik.db-wal`.
- **Files:** `/c/Users/Vanildo/Dev/publik/publik.db-shm`, `.gitignore`
- **Impact:** Committing a platform-specific binary file to git; could expose local DB artifacts; `.gitignore` is incomplete.
- **Fix approach:** Add `publik.db-shm` and `publik.db-wal` to `.gitignore` and remove the tracked file with `git rm --cached publik.db-shm`.

### No Environment Variable Validation at Build Time — MEDIUM
- **Issue:** There is no zod-based env validation (no `src/env.ts` or equivalent). Required env vars (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are only discovered to be missing at runtime when the first DB/storage call fails.
- **Files:** `src/infrastructure/db/client.ts:5`, `src/lib/supabase.ts:6-10`
- **Impact:** Deploy succeeds even with missing env vars; first user request crashes with an unhelpful error.
- **Fix approach:** Add a `src/lib/env.ts` that uses `z.object({}).parse(process.env)` and is imported at the top of `src/infrastructure/db/client.ts` and `src/lib/supabase.ts`.

### `maxDuration = 300` on Multiple Routes — MEDIUM
- **Issue:** Three routes set `export const maxDuration = 300` (5 minutes): PDF generation, cover generation, and ZIP download. Vercel's free and Pro plans have lower limits (10s and 60s for Hobby, 300s for Pro). On Vercel Hobby, these routes will silently timeout.
- **Files:** `src/app/api/generate/pdf/route.ts:9`, `src/app/api/generate/cover/route.ts:10`, `src/app/api/download/zip/route.ts:9`
- **Impact:** PDF and cover generation will fail with a gateway timeout on Vercel Hobby plans.
- **Fix approach:** Document the Vercel Pro requirement. Consider offloading PDF generation to a background job if supporting Hobby tier is needed.

### ZIP Route Uses Internal `fetch` with Hardcoded `request.nextUrl.origin` — MEDIUM
- **Issue:** `src/app/api/download/zip/route.ts` calls `${request.nextUrl.origin}/api/generate/pdf` using `fetch`. In some Next.js serverless deployments (especially during SSG/build), `request.nextUrl.origin` may resolve to `localhost` or an internal URL that is not accessible.
- **Files:** `src/app/api/download/zip/route.ts:51-55`
- **Impact:** ZIP generation fails in environments where the server cannot make HTTP requests to itself.
- **Fix approach:** Import and call the PDF generation logic directly rather than via HTTP, removing the internal fetch entirely.

---

## Test Coverage Gaps

### No Tests for Server Actions — HIGH
- **What's not tested:** `src/app/(dashboard)/books/[bookId]/actions.ts` contains all book and chapter CRUD operations. The only test for actions (`tests/app/books/actions.test.ts`) just checks that the exports exist; it does not test any behavior.
- **Files:** `src/app/(dashboard)/books/[bookId]/actions.ts`, `src/server/actions/covers.ts`, `src/server/actions/toc.ts`
- **Risk:** Book creation, deletion, chapter reordering, cover saving — all untested. A refactor could silently break all CRUD operations.
- **Priority:** HIGH

### No Tests for PDF Generation — HIGH
- **What's not tested:** `src/lib/pdf/html-to-pdf.tsx`, `src/lib/pdf/interior-document.tsx`, `src/lib/pdf/cover-document.tsx`. The HTML-to-PDF converter is a custom parser with complex edge cases.
- **Files:** `src/lib/pdf/html-to-pdf.tsx`
- **Risk:** HTML edge cases (nested inline elements, empty content, malformed HTML from TipTap) could produce broken PDFs silently.
- **Priority:** HIGH

### No Tests for API Routes — MEDIUM
- **What's not tested:** All routes in `src/app/api/` — upload, import, generate, validate, download.
- **Risk:** Auth bypass, file validation bugs, and error paths are untested.
- **Priority:** MEDIUM

### No Tests for TOC Sync Logic — MEDIUM
- **What's not tested:** `src/lib/toc/sync.ts` and `src/server/actions/toc.ts` — the anchor-to-DB sync logic, reorder, add, remove.
- **Risk:** TOC sync has complex state management (anchor maps, position tracking). Silent data loss possible on edge cases.
- **Priority:** MEDIUM

---

*Concerns audit: 2026-04-02*
