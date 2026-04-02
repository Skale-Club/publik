---
generated: 2026-04-02
focus: quality
---

# Coding Conventions

**Analysis Date:** 2026-04-02

## TypeScript Usage

**Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`). Also uses `"noEmit": true`, `"isolatedModules": true`, `"moduleResolution": "bundler"`.

**`any` Usage:** Almost none in production code. Two isolated occurrences:
- `src/types/sql.js.d.ts` — third-party type declaration stub; all `any` uses are intentional and scoped to that file
- `src/components/editor/toc-sidebar.tsx:33` — `editor: any` in the `TOCSidebarProps` interface, with a comment "TipTap editor instance". This is the only untyped prop in production components.

**Type Export Pattern:** Domain types are defined as plain `interface` or `type` in dedicated files, then re-exported from the module. Zod schemas always export their inferred types alongside the schema:
```typescript
// src/domain/book/book-validator.ts
export const bookCreateSchema = z.object({ ... })
export type BookCreateInput = z.infer<typeof bookCreateSchema>
```

**Type Casting:** Used in data-fetching server code when mapping Drizzle rows to typed domain objects. Pattern is explicit cast to a known union type, not cast to `unknown` or `any`:
```typescript
// src/app/(dashboard)/page.tsx
paperType: row.paperType as Book["paperType"],
inkType: row.inkType as Book["inkType"],
```

**Path Aliases:** `@/` maps to `src/` (configured in both `tsconfig.json` and `vitest.config.ts`). Used consistently across all imports.

## Naming Conventions

**Files:**
- React components: `kebab-case.tsx` for most components (`book-card.tsx`, `chapter-editor.tsx`, `toc-sidebar.tsx`)
- **Exception:** `src/components/covers/` uses `PascalCase.tsx` (`CoverEditor.tsx`, `CoverUploader.tsx`, `BackCoverInput.tsx`). This is the only directory that deviates from kebab-case files.
- Server actions: `kebab-case.ts` (`actions.ts`, `covers.ts`, `toc.ts`)
- Domain modules: `kebab-case.ts` (`book-validator.ts`, `spine-width.ts`, `trim-sizes.ts`)
- Custom hooks: `use-{name}.ts` (`use-auto-save.ts`)

**React Components:** Always PascalCase named exports — `export function BookCard(...)`, `export function TipTapEditor(...)`. No default exports for components except Next.js page/layout files which require them.

**Functions:**
- Regular functions: camelCase (`createBook`, `getMargins`, `calculateSpineWidth`)
- Event handlers: `handle{EventName}` (`handleSave`, `handleFrontCoverUpload`, `handleDragEnd`, `handleCreateChapter`)
- Async data loaders inside components: named inner functions in camelCase (`loadData`, `loadEntries`, `reload`)

**Variables:**
- State setters follow React convention: `[noun, setNoun]` (`[loading, setLoading]`, `[entries, setEntries]`)
- Boolean state: plain noun not `is`-prefixed for loading states; `is`-prefixed for UI toggles (`isLoading`, `isCreating`, `isCollapsed`, `isAdding`)

**Constants:** SCREAMING_SNAKE_CASE for module-level domain constants: `KDP_TRIM_SIZES`, `COVER_FINISHES`, `SPINE_WIDTH_PER_PAGE`, `MIN_PAGES_FOR_SPINE_TEXT`, `MIN_PAGES_FOR_PUBLISHING`.

**Database Schema:** Column names use `snake_case` strings (`trim_size_id`, `paper_type`, `deleted_at`). TypeScript property names use camelCase (`trimSizeId`, `paperType`, `deletedAt`). Drizzle handles the mapping.

**Interfaces:** PascalCase suffixed with the role — `BookCardProps`, `CoverEditorProps`, `UseAutoSaveOptions`, `SpineWidthResult`. Data shapes without "Props" suffix when they are domain objects: `BookData`, `CoverData`, `ValidationResult`.

## Component Patterns

**Server vs Client Split:**
- Next.js page files are async Server Components by default — they fetch data at the top level and pass it as props
- Interactive components have `"use client"` at the top
- Server Actions have `"use server"` at the top
- The pattern is: Server Component (data fetch) → passes typed props → Client Component (interactivity)

**Props Typing:**
- Always typed with a local `interface {ComponentName}Props` directly above the component declaration
- Props interfaces are not exported unless needed externally
```typescript
// Standard pattern (src/components/books/book-card.tsx)
interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) { ... }
```

**Ref Pattern:** `forwardRef` used when a parent component needs to call methods on the child (e.g., `TipTapEditor` exposes `focus()`). Custom ref type is a named interface:
```typescript
// src/components/editor/tiptap-editor.tsx
export interface TipTapEditorRef {
  focus: () => void
}
export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(...)
```

**Loading/Error States in Components:**
- Loading: render a simple `<div>Loading...</div>` or spinner JSX inline, not a dedicated skeleton
- Error: render a `<div className="text-red-500">Error message</div>` inline
- Route-level error boundary: `src/app/(dashboard)/error.tsx` catches unhandled errors with a "Try again" reset button
- Route-level loading: `src/app/(dashboard)/loading.tsx` for Suspense boundaries

**Data Fetching in Client Components:**
- Use `useEffect` to call Server Actions directly from client components (not `fetch`)
- Pattern: `async function loadData() { ... }` defined inside `useEffect`, called immediately
- Tracks `loading` and `error` state manually

## Error Handling Patterns

**Server Actions (no return value expected):**
- Throw propagates up; Next.js catches it with the error boundary
- `revalidatePath` is called unconditionally after mutations (no error branch needed)
- Exception: `updateChapterContent` returns `{ success: boolean; error?: string }` for client-side status display

**Server Actions (return value expected):**
- Return `{ success: boolean; error?: string }` for operations where the caller needs to react
- Catch `z.ZodError` separately from generic errors to return field-level validation messages:
```typescript
// src/server/actions/covers.ts
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: error.issues[0].message }
  }
  return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
}
```

**API Routes:**
- Always wrap handler body in `try/catch`
- Return `NextResponse.json({ error: "..." }, { status: NNN })` for all error cases
- Log with `console.error("context:", error)` before returning error response
- Check preconditions at the top of the handler before processing, returning 400 for missing params
```typescript
// src/app/api/upload/cover/route.ts
if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
if (!bookId) return NextResponse.json({ error: "No bookId provided" }, { status: 400 })
```

**Validation:**
- `schema.parse()` (throws) used in Server Actions — the error propagates to the error boundary or is caught by the action's own try/catch
- Never use `schema.safeParse()` — all code uses `.parse()` with a wrapping try/catch

## Form Handling Patterns

**Pattern:** Native HTML `<form>` with React Server Action as the `action` prop. No form library (react-hook-form, Formik, etc.) is used.

```typescript
// src/components/books/book-form.tsx
<form
  ref={formRef}
  action={async (formData) => {
    const result = await createBook(formData)
    formRef.current?.reset()
    if (result?.id) router.push(`/books/${result.id}`)
  }}
>
```

**Controlled vs Uncontrolled:**
- Create forms: uncontrolled (no `value`, uses `defaultValue` or nothing)
- Edit forms: uncontrolled with `defaultValue` pre-populated from existing data
- Chapter title inputs inside editor UI: controlled with `useState`

**Validation:** HTML `required` and `maxLength` attributes for client-side feedback. Zod schema validates on the server inside the Server Action. No client-side Zod validation.

**No Error Message Display in Forms:** Current forms do not show per-field server validation errors back to the user. A failed `schema.parse()` inside a Server Action throws and hits the error boundary, not a form error state.

## Import Organization

**Order (observed pattern):**
1. React and Next.js framework imports
2. Third-party library imports
3. Internal imports using `@/` alias (domain, components, lib, server)

**No barrel files at the domain level** except `src/domain/kdp/index.ts` and `src/components/covers/index.ts`. All other imports go directly to the file.

**Path Alias:** Always `@/` — no relative `../` imports between `src/` directories.

## API Route Patterns

**Structure:**
- Named export of `GET`, `POST`, etc. (no default export)
- `NextRequest` parameter, `NextResponse` return
- Input from `request.url` searchParams (GET) or `request.formData()` (POST)
- No Zod validation on API route inputs — manual checks only

```typescript
// src/app/api/generate/pdf/route.ts
export const maxDuration = 300  // Vercel timeout override at module level

export async function GET(request: NextRequest) {
  try {
    const bookId = new URL(request.url).searchParams.get("bookId")
    if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 })
    // ... process
    return new NextResponse(stream, { headers: { ... } })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "..." }, { status: 500 })
  }
}
```

## Module Design

**Domain modules (`src/domain/`):** Pure TypeScript, no framework dependencies. Export constants, interfaces, and pure functions. No classes.

**Lib modules (`src/lib/`):** Utility functions, calculations, and thin service wrappers. No React.

**Server actions (`src/server/actions/`, `src/app/**/actions.ts`):** All marked `"use server"`. Call `db` directly. Call `revalidatePath` after mutations.

**Infrastructure (`src/infrastructure/`):** Database client and schema definitions only.

**Duplicate TipTap editor files:**
- `src/components/books/tiptap-editor.tsx` — older version with internal editor creation
- `src/components/editor/tiptap-editor.tsx` — newer version with `forwardRef` and external editor support
Both are actively imported in different places. The `books/` version appears to be a legacy copy.

## Logging

`console.error(context, error)` is the only logging mechanism. No structured logging library. Used in:
- Server actions on catch
- API route error handlers
- Client-side async event handlers when DB operations fail silently

## Comments

**JSDoc:** Used selectively in `src/lib/pdf/spine-calculator.ts` (function-level JSDoc with `@param`/`@returns`). Used in `src/types/toc.ts` (field-level JSDoc on all interface members).

**Inline comments:** Used to explain non-obvious business logic (KDP formulas, page count estimates). Not used for obvious code.

---

*Convention analysis: 2026-04-02*
