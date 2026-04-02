---
phase: 05-cover-management
plan: 02
subsystem: covers
tags:
  - covers
  - back-cover
  - dual-mode
  - upload
  - server-actions
  - drizzle

dependency_graph:
  requires:
    - phase: 05-01
      provides: covers table with front cover fields, cover upload API endpoint
  provides:
    - back cover schema fields (backCoverType, backCoverImageUrl, backCoverText)
    - cover server actions (getCover, saveFrontCover, saveBackCover, deleteCover)
    - BackCoverInput component with image/text dual-mode
  affects:
    - Phase 7 (cover PDF generation needs backCoverType/backCoverText)

tech-stack:
  added:
    - Drizzle ORM upsert pattern for cover CRUD
  patterns:
    - Dual-mode input (image OR text) with preserved state on mode switch
    - Client-side image upload with server action save
    - Zod validation in server actions

key-files:
  created:
    - src/server/actions/covers.ts
    - src/components/covers/BackCoverInput.tsx
  modified:
    - src/infrastructure/db/schema/covers.ts

key-decisions:
  - "Separated saveBackCoverImage and saveBackCoverText as distinct server actions (cleaner validation logic per type)"
  - "Mode switching preserves both text and image URL in component state so switching back restores previous input"
  - "Back cover type defaults to 'text' in schema to match common use case"

patterns-established:
  - "Upsert pattern: check existing row, UPDATE if found, INSERT if not (Drizzle with PostgreSQL)"
  - "Radio toggle for dual-mode inputs with preserved state on mode switch"

requirements-completed:
  - COV-02

duration: ~10min
completed: 2026-03-30
---

# Phase 05 Plan 02: Back Cover Input Summary

**Back cover dual-mode input supporting image upload OR text content, with Drizzle server actions and schema extension for backCoverType/backCoverImageUrl/backCoverText fields.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-30
- **Completed:** 2026-03-30
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extended covers schema with 5 back cover fields (backCoverType, backCoverImageUrl, backCoverImageWidth, backCoverImageHeight, backCoverText)
- Created cover server actions: getCover, saveFrontCover, saveBackCoverImage, saveBackCoverText, deleteCover with Zod validation
- Created BackCoverInput component with radio toggle for image/text modes, file upload with dimension validation, textarea for text, and image preview

## Task Commits

All tasks were committed together as part of the Phase 05 batch implementation:

1. **Task 1: Extend covers schema with back cover fields** - `ec8cb9c` (feat)
2. **Task 2: Create cover server actions** - `ec8cb9c` (feat)
3. **Task 3: Create BackCoverInput component** - `ec8cb9c` (feat)

**Plan metadata:** `309245c` (docs: phase summary)

## Files Created/Modified

- `src/infrastructure/db/schema/covers.ts` - Added backCoverType, backCoverImageUrl, backCoverImageWidth, backCoverImageHeight, backCoverText fields
- `src/server/actions/covers.ts` - getCover, saveFrontCover, saveBackCoverImage, saveBackCoverText, deleteCover server actions
- `src/components/covers/BackCoverInput.tsx` - Dual-mode back cover input with radio toggle, image upload, text textarea

## Decisions Made

- Separated `saveBackCoverImage` and `saveBackCoverText` as distinct server actions rather than one unified `saveBackCover` — cleaner Zod validation schemas per mode
- Mode switching in BackCoverInput preserves both text and image URL in state, so switching back to a previous mode restores the user's prior input
- Back cover type defaults to 'text' in the schema since text is the simpler and more common use case

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Back cover data is stored with type discrimination, ready for Phase 7 cover PDF generation
- Phase 05-03 adds KDP validation integration (already completed in the same batch)

---
*Phase: 05-cover-management*
*Completed: 2026-03-30*
