---
phase: 04-table-of-contents
plan: "01"
subsystem: editor
tags: [tiptap, table-of-contents, slugify, headings]

# Dependency graph
requires: []
provides:
  - TOC type definitions (TOCEntry, Anchor, TOCSyncResult)
  - Heading extraction utilities (slugify, getHierarchicalIndexes, extractAnchors)
  - TableOfContents extension configuration with getId and getIndex
affects: [editor, pdf-generation]

# Tech tracking
tech-stack:
  added: [@tiptap/extension-table-of-contents, slugify]
  patterns: [TOC extension integration with TipTap editor]

key-files:
  created:
    - src/types/toc.ts - TypeScript interfaces for TOC
    - src/lib/toc/headings.ts - Heading extraction utilities
    - src/lib/toc/index.ts - TOC library exports and configuration
  modified:
    - package.json - Added dependencies

key-decisions:
  - "Use built-in getHierarchicalIndexes from extension instead of custom implementation"
  - "Use slugify function for deterministic heading IDs instead of UUID"

patterns-established:
  - "TOC extension configured with getIndex and getId for consistent indexing"
  - "Anchor extraction from editor.storage.tableOfContents for real-time updates"

requirements-completed: [TOC-01]

# Metrics
duration: 4min
completed: 2026-03-30
---

# Phase 4 Plan 1: Auto-generated TOC from Chapter Headings Summary

**TipTap TableOfContents extension installed with slugify-based ID generation for deterministic heading anchors**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-30T22:15:35Z
- **Completed:** 2026-03-30T22:19:24Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Installed @tiptap/extension-table-of-contents (v3.21.0) and slugify (v1.6.8)
- Created TypeScript type definitions for TOCEntry, Anchor, and TOCSyncResult
- Created heading extraction utilities with slugify, hierarchical index generation, and subscription functions
- Created TOC library index with extension configuration for getIndex (hierarchical) and getId (slugify)

## Task Commits

All tasks committed atomically:

1. **Task 1: Install TOC extension and dependencies** - Installed packages via pnpm
2. **Task 2: Create TOC type definitions** - `src/types/toc.ts` created
3. **Task 3: Create heading extraction utilities** - `src/lib/toc/headings.ts` created  
4. **Task 4: Create TOC library index** - `src/lib/toc/index.ts` created

**Plan metadata:** `82e045e` (feat: complete TOC implementation)

## Files Created/Modified
- `package.json` - Added @tiptap/extension-table-of-contents and slugify dependencies
- `src/types/toc.ts` - TOCEntry, Anchor, TOCSyncResult interfaces
- `src/lib/toc/headings.ts` - slugify, getHierarchicalIndexes, extractAnchorsFromEditor, subscribeToTOCUpdates
- `src/lib/toc/index.ts` - TOC library exports with TableOfContents.configure()

## Decisions Made
- Used built-in `getHierarchicalIndexes` from @tiptap/extension-table-of-contents instead of custom implementation
- Used slugify function for deterministic ID generation instead of UUID (more readable, consistent with PDF bookmarks)
- Extended Editor storage type with type assertion for TOC storage access

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed
**Impact on plan:** All tasks completed as specified

## Issues Encountered
- TypeScript errors with TipTap TOC extension types - Fixed by using proper type signatures from official documentation
- Pre-existing build error in PDF import route (DOMMatrix not defined) - Unrelated to TOC changes

## Next Phase Readiness
- TOC extension is installed and configured
- Ready for integration with TipTap editor component
- Next plan should integrate TOC extension into the editor and create UI component
- Build error in PDF import route is a separate pre-existing issue that should be addressed separately

---
*Phase: 04-table-of-contents*
*Completed: 2026-03-30*
