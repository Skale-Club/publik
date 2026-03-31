/**
 * Table of Contents library - Main entry point
 * Exports utilities, types, and configuration for TOC functionality
 */

// Export utilities from headings.ts
export {
  slugify,
  getHierarchicalIndexes,
  extractAnchorsFromEditor,
  subscribeToTOCUpdates,
  generateUniqueAnchorId,
} from './headings'

// Export types
export type { TOCEntry, Anchor, TOCSyncResult, TOCExtensionConfig } from '@/types/toc'

// Import for configuration
import TableOfContents, {
  getHierarchicalIndexes,
} from '@tiptap/extension-table-of-contents'
import { slugify } from './headings'

/**
 * Default TOC extension configuration
 * Used to configure the TableOfContents extension in the TipTap editor
 */
const tocConfig = TableOfContents.configure({
  // Which node types to use for TOC generation
  anchorTypes: ['heading'],

  // Generate hierarchical or linear indexes (e.g., "1", "1.1", "1.1.1")
  getIndex: getHierarchicalIndexes,

  // Generate deterministic IDs from heading content using slugify
  getId: slugify,
})

/**
 * TableOfContents extension configuration
 * Export this to use in TipTap editor extensions array
 */
export const tableOfContentsExtension = tocConfig

/**
 * Create TOC extension configuration with custom options
 * @param options - Partial configuration options
 * @returns Configured TableOfContents extension
 */
export function createTOCExtension(options?: Partial<{
  anchorTypes: string[]
  onUpdate: (anchors: unknown[]) => void
}>) {
  return TableOfContents.configure({
    anchorTypes: options?.anchorTypes ?? ['heading'],
    getIndex: getHierarchicalIndexes,
    getId: slugify,
    onUpdate: options?.onUpdate,
  })
}
