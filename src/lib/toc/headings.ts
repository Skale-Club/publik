/**
 * Heading extraction utilities for TipTap editor TOC integration
 */

import type { Editor } from '@tiptap/react'
import type { Anchor } from '@/types/toc'

/**
 * Slugify text to create deterministic IDs for headings
 * Converts text to lowercase, replaces spaces with hyphens, removes special characters
 * @param text - The text to slugify
 * @returns Slugified string suitable for use as ID
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Hierarchical index generator for TOC entries
 * Generates indexes like 1, 1.1, 1.1.1 based on heading levels
 * @param level - Current heading level (1-6)
 * @param prevLevel - Previous heading level
 * @param index - Array tracking current position at each level
 * @returns Formatted hierarchical index string
 */
export function getHierarchicalIndexes(
  level: number,
  prevLevel: number,
  index: number[]
): string {
  // Reset deeper levels when moving back up
  if (level < prevLevel) {
    for (let i = level; i < index.length; i++) {
      index[i] = 0
    }
  }

  // Increment current level
  if (level <= index.length) {
    index[level - 1] = (index[level - 1] || 0) + 1
  } else {
    index.push(1)
  }

  // Build the hierarchical index
  const result: string[] = []
  for (let i = 0; i < level; i++) {
    result.push(String(index[i] || 0))
  }

  return result.join('.')
}

/**
 * Extended storage type for TipTap TableOfContents extension
 */
interface TOCStorage {
  anchors?: Anchor[]
}

/**
 * Extended Editor storage type
 */
interface ExtendedEditorStorage {
  tableOfContents?: TOCStorage
}

/**
 * Extract current anchors from the TipTap editor's TableOfContents storage
 * @param editor - The TipTap editor instance
 * @returns Array of Anchor objects representing current headings
 */
export function extractAnchorsFromEditor(editor: Editor): Anchor[] {
  if (!editor) {
    return []
  }

  try {
    const extendedStorage = editor.storage as unknown as ExtendedEditorStorage
    const tocStorage = extendedStorage.tableOfContents

    if (tocStorage?.anchors && Array.isArray(tocStorage.anchors)) {
      return tocStorage.anchors
    }
  } catch (error) {
    console.warn('Failed to extract anchors from editor:', error)
  }

  return []
}

/**
 * Subscribe to TOC updates from the TipTap editor
 * Sets up an onUpdate listener for real-time TOC changes
 * @param editor - The TipTap editor instance
 * @param callback - Function to call when TOC updates
 * @returns Cleanup function to remove the listener
 */
export function subscribeToTOCUpdates(
  editor: Editor | null,
  callback: (anchors: Anchor[]) => void
): () => void {
  if (!editor) {
    return () => {}
  }

  // Get initial anchors
  const initialAnchors = extractAnchorsFromEditor(editor)
  if (initialAnchors.length > 0) {
    callback(initialAnchors)
  }

  // Set up onUpdate listener via the editor's onUpdate
  const handleUpdate = () => {
    const anchors = extractAnchorsFromEditor(editor)
    callback(anchors)
  }

  // Listen to editor updates
  editor.on('update', handleUpdate)

  // Return cleanup function
  return () => {
    editor.off('update', handleUpdate)
  }
}

/**
 * Generate a unique anchor ID from heading text
 * Ensures no duplicate IDs by adding a suffix if needed
 * @param text - The heading text
 * @param existingIds - Set of existing IDs to avoid duplicates
 * @returns Unique slugified ID
 */
export function generateUniqueAnchorId(
  text: string,
  existingIds: Set<string> = new Set()
): string {
  let id = slugify(text)
  let counter = 1

  while (existingIds.has(id)) {
    id = `${slugify(text)}-${counter}`
    counter++
  }

  return id
}
