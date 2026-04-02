---
generated: 2026-04-02
focus: quality
---

# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:**
- Vitest
- Config: `vitest.config.ts`
- React plugin: `@vitejs/plugin-react`
- Test environment: `jsdom`

**Assertion Library:**
- Vitest built-in (`expect`)
- `@testing-library/jest-dom/vitest` — extended DOM matchers imported in setup (e.g., `toBeInTheDocument`, `toHaveTextContent`)

**Run Commands:**
```bash
pnpm test            # Run all tests (vitest watch mode by default)
pnpm test --run      # Run once without watch
```
No dedicated coverage or watch-mode scripts are defined in `package.json`. Only `"test": "vitest"`.

## Test File Organization

**Location:** All tests live under `tests/` at the project root — separate from `src/`. Tests are NOT co-located with source files.

**Naming:** `{module-name}.test.ts`

**Directory structure:**
```
tests/
├── setup.ts                          # Global test setup
├── app/
│   └── books/
│       └── actions.test.ts           # Server action smoke tests
├── domain/
│   ├── book/
│   │   └── book-validator.test.ts    # Zod schema validation
│   └── kdp/
│       ├── cover-finishes.test.ts    # KDP constant structure
│       ├── margins.test.ts           # Margin calculation logic
│       ├── paper-types.test.ts       # KDP paper type constants
│       ├── spine-width.test.ts       # Spine width formula (domain layer)
│       └── trim-sizes.test.ts        # KDP trim size constants
└── lib/
    └── pdf/
        ├── spine-calculator.test.ts  # Spine calculator with unit conversion
        └── trim-sizes.test.ts        # PDF page dimension calculations
```

**Setup file:** `tests/setup.ts` — imports `@testing-library/jest-dom/vitest` for extended matchers. Single line; no global mocks or database setup.

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect } from "vitest"
import { myFunction } from "../../../src/domain/..."

describe("module-name", () => {
  describe("functionName", () => {
    it("specific behavior description", () => {
      const result = myFunction(input)
      expect(result.field).toBe(expectedValue)
    })
  })
})
```

**Import paths:** Tests in `tests/domain/` and `tests/app/` use relative paths (`../../../src/...`). Tests in `tests/lib/` use the `@/` alias (configured in `vitest.config.ts`).

**No setup/teardown:** No `beforeEach`, `afterEach`, `beforeAll`, or `afterAll` hooks are used in any test file. All tests are pure input/output assertions.

## Mocking

No mocking is used in any test file. All tested modules are pure functions or constants with no side effects, no database calls, and no network requests. The database and server action layers are not under test.

## Test Coverage by Area

### What IS Tested

**Domain logic — KDP calculations (well-covered):**
- `tests/domain/kdp/margins.test.ts` → `src/domain/kdp/margins.ts` (`getMargins`)
  - 12 cases covering all page-count thresholds and bleed settings
- `tests/domain/kdp/spine-width.test.ts` → `src/domain/kdp/spine-width.ts` (`calculateSpineWidth`)
  - 6 cases: each paper type, zero pages, `MIN_PAGES_FOR_SPINE_TEXT` constant
- `tests/domain/kdp/trim-sizes.test.ts` → `src/domain/kdp/trim-sizes.ts` (`KDP_TRIM_SIZES`)
  - Structure validation: count, required fields, unique IDs, specific dimensions
- `tests/domain/kdp/cover-finishes.test.ts` → `src/domain/kdp/cover-finishes.ts`
  - Count, values, required fields
- `tests/domain/kdp/paper-types.test.ts` → `src/domain/kdp/paper-types.ts`
  - (Assumed similar shape — KDP constants structure)

**Domain logic — book validation (well-covered):**
- `tests/domain/book/book-validator.test.ts` → `src/domain/book/book-validator.ts`
  - `bookCreateSchema`: 8 cases — defaults, all fields, empty title, too-long title/description, invalid enum values
  - `bookUpdateSchema`: 3 cases — empty object, single field, multi-field partial update

**Lib utilities — PDF calculations (well-covered):**
- `tests/lib/pdf/spine-calculator.test.ts` → `src/lib/pdf/spine-calculator.ts`
  - 7 cases: each paper type calculation, multi-unit output, `canHaveSpineText` boundary (79/80 pages), warning generation
- `tests/lib/pdf/trim-sizes.test.ts` → `src/lib/pdf/page-layout.ts` (`getPageDimensions`, `getTrimSizeLabel`, `isValidTrimSize`)
  - 32+ cases: all 16 trim sizes tested twice (dimensions + inch-to-point conversion), error on invalid input, label/validity functions

**App — Server actions (smoke test only):**
- `tests/app/books/actions.test.ts` → `src/app/(dashboard)/books/[bookId]/actions.ts`
  - Single test: dynamic import verifying `createBook`, `updateBook`, `deleteBook` are exported functions
  - Does NOT test behavior, inputs, or outputs

### What is NOT Tested

**Server actions (untested behavior):**
- `createBook`, `updateBook`, `deleteBook` in `src/app/(dashboard)/books/[bookId]/actions.ts` — only their existence is verified, not their behavior
- `createChapter`, `updateChapter`, `deleteChapter`, `reorderChapters`, `updateChapterContent`, `getChapters`
- All actions in `src/server/actions/covers.ts` (`saveFrontCover`, `saveBackCoverImage`, `saveBackCoverText`, `deleteCover`)
- All actions in `src/server/actions/toc.ts`

**API routes (completely untested):**
- `src/app/api/generate/pdf/route.ts` — PDF generation endpoint
- `src/app/api/generate/cover/route.ts` — Cover generation endpoint
- `src/app/api/upload/cover/route.ts` — Cover upload endpoint
- `src/app/api/upload/image/route.ts` — Image upload endpoint
- `src/app/api/import/docx/route.ts` — DOCX import endpoint
- `src/app/api/import/pdf/route.ts` — PDF import endpoint
- `src/app/api/download/zip/route.ts` — ZIP download endpoint
- `src/app/api/validate/route.ts` — KDP validation endpoint

**Lib utilities (completely untested):**
- `src/lib/export/validator.ts` (`validateBookForKDP`) — complex validation logic with multiple branches
- `src/lib/export/file-download.ts`
- `src/lib/export/checklist.ts`
- `src/lib/covers/kdp-validation.ts` (`validateCoverForKDP`) — cover dimension validation logic
- `src/lib/covers/dimensions.ts`
- `src/lib/covers/validation.ts`
- `src/lib/toc/headings.ts`, `src/lib/toc/sync.ts`, `src/lib/toc/transform.ts`
- `src/lib/import/docx-utils.ts`, `src/lib/import/image-utils.ts`, `src/lib/import/pdf-utils.ts`
- `src/lib/pdf/html-to-pdf.tsx`, `src/lib/pdf/interior-document.tsx`, `src/lib/pdf/cover-document.tsx`
- `src/lib/pdf/page-margins.ts`, `src/lib/pdf/cover-dimensions.ts`, `src/lib/pdf/font-registration.ts`
- `src/lib/pdf/layout-options.ts`, `src/lib/pdf/toc-document.tsx`

**React components (completely untested):**
- No component tests exist. No `@testing-library/react` imports in any test file.
- All components under `src/components/` are untested
- All pages under `src/app/` are untested

**Domain modules (partially untested):**
- `src/domain/book/chapter-validator.ts` — no tests
- `src/domain/book/chapter.ts` — no tests
- `src/domain/kdp/bleed.ts` — no tests
- `src/domain/kdp/margins.ts` does NOT test the bleed-aware margin logic (only `outsideIn` tested for bleed, not the full matrix)

## Test Quality Assessment

**Strengths:**
- KDP calculation tests are precise — use `toBeCloseTo(value, 4)` for floating point math
- Boundary conditions are explicitly tested (e.g., page count thresholds 150/151, 300/301, 500/501, 700/701 in margins tests)
- Trim size test parametrizes all 16 cases in a `testCases` array and iterates — reduces duplication
- Tests import types alongside functions: `import type { SpineWidthResult, PaperType }` verifies type exports work
- No infrastructure required to run tests — pure unit tests, all pass offline

**Weaknesses:**
- `tests/app/books/actions.test.ts` is a non-test: it only checks that functions are exported, not what they do. Provides false coverage confidence.
- No component tests at all — UI rendering, user interactions, and form submissions are untested
- No integration tests — the interaction between server actions and the database is untested
- `src/lib/export/validator.ts` contains the most complex business logic in the codebase (KDP validation with multiple branches) and has zero tests
- `src/lib/covers/kdp-validation.ts` is called by both the cover upload flow and the export validator but has no tests
- The duplicate TipTap editor (`src/components/books/tiptap-editor.tsx` vs `src/components/editor/tiptap-editor.tsx`) is untested, making it hard to know which is canonical

## Coverage Summary

| Layer | Files | Tested | Notes |
|-------|-------|--------|-------|
| `src/domain/kdp/` | 6 files | ~5/6 | bleed.ts untested |
| `src/domain/book/` | 4 files | 1/4 | only book-validator.ts |
| `src/lib/pdf/` | ~10 files | 2/10 | page-layout.ts, spine-calculator.ts |
| `src/lib/covers/` | 4 files | 0/4 | none |
| `src/lib/export/` | 3 files | 0/3 | none |
| `src/lib/toc/` | 4 files | 0/4 | none |
| `src/lib/import/` | 3 files | 0/3 | none |
| `src/app/api/` | 7 routes | 0/7 | none |
| `src/server/actions/` | 2 files | 0/2 | none |
| `src/components/` | ~20 files | 0/20 | none |

---

*Testing analysis: 2026-04-02*
