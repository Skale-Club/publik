/**
 * TOC synchronization utilities
 * Keeps stored TOC entries in sync with editor headings
 */

import type { TOCEntry, Anchor } from "@/types/toc"
import { getDb, saveDb } from "@/infrastructure/db/client"
import { nanoid } from "nanoid"

export interface TOCEntryRow {
  id: string
  bookId: string
  title: string
  level: number
  anchorId: string | null
  position: number
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Fetch all TOC entries for a book ordered by position
 */
export function getTOCEntriesForBook(bookId: string): TOCEntryRow[] {
  const db = getDb()
  
  const result = db.exec(
    `SELECT * FROM toc_entries WHERE book_id = '${bookId}' AND deleted_at IS NULL ORDER BY position ASC`
  )
  
  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }
  
  const columns = result[0].columns
  return result[0].values.map((row) => {
    const entry: any = {}
    columns.forEach((col, i) => {
      // Map snake_case columns to camelCase
      switch (col) {
        case "book_id":
          entry.bookId = row[i]
          break
        case "anchor_id":
          entry.anchorId = row[i]
          break
        case "is_custom":
          entry.isCustom = row[i] === 1
          break
        case "created_at":
          entry.createdAt = row[i]
          break
        case "updated_at":
          entry.updatedAt = row[i]
          break
        default:
          entry[col] = row[i]
      }
    })
    return entry as TOCEntryRow
  })
}

/**
 * Check if a TOC entry is custom
 * An entry is custom if isCustom flag is true OR title differs from anchor text
 */
export function isCustomEntry(
  entry: TOCEntryRow,
  anchor?: Anchor
): boolean {
  if (entry.isCustom) {
    return true
  }
  // If entry has an anchor but title differs from anchor text, consider it custom
  if (anchor && entry.anchorId === anchor.id && entry.title !== anchor.textContent) {
    return true
  }
  return false
}

/**
 * Sync TOC entries with headings from the editor
 * - New headings: create new TOC entries
 * - Removed headings: mark as removed (keep for undo capability)
 * - Changed headings: preserve custom title, update anchor reference
 */
export function syncTOCWithHeadings(
  bookId: string,
  anchors: Anchor[]
): { added: number; updated: number; preserved: number } {
  const db = getDb()
  const now = new Date().toISOString()
  
  // Get existing entries
  const existingEntries = getTOCEntriesForBook(bookId)
  
  // Create maps for quick lookup
  const anchorMap = new Map(anchors.map((a) => [a.id, a]))
  const entryAnchorMap = new Map(
    existingEntries
      .filter((e) => e.anchorId)
      .map((e) => [e.anchorId!, e])
  )
  
  let added = 0
  let updated = 0
  let preserved = 0
  
  // First, update existing entries that still have matching anchors
  existingEntries.forEach((entry) => {
    if (entry.anchorId && anchorMap.has(entry.anchorId)) {
      // Entry still has a matching anchor - just update position if needed
      const anchor = anchorMap.get(entry.anchorId)!
      const newPosition = anchors.findIndex((a) => a.id === entry.anchorId)
      
      if (entry.position !== newPosition) {
        db.run(
          `UPDATE toc_entries SET position = ?, updated_at = ? WHERE id = ?`,
          [newPosition, now, entry.id]
        )
        updated++
      } else {
        preserved++
      }
    }
  })
  
  // Second, add new entries for anchors that don't have corresponding entries
  anchors.forEach((anchor, index) => {
    if (!entryAnchorMap.has(anchor.id)) {
      // New anchor - create entry
      const id = nanoid()
      db.run(
        `INSERT INTO toc_entries (id, book_id, title, level, anchor_id, position, is_custom, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, bookId, anchor.textContent, anchor.level, anchor.id, index, 0, now, now]
      )
      added++
    }
  })
  
  saveDb()
  
  return { added, updated, preserved }
}

/**
 * Debounce utility for TOC sync
 * Prevents excessive DB writes during rapid editor changes
 */
export function debounceSync<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Get TOC entry by ID
 */
export function getTOCEntryById(id: string): TOCEntryRow | null {
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM toc_entries WHERE id = '${id}' AND deleted_at IS NULL`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const entry: any = {}
  columns.forEach((col, i) => {
    switch (col) {
      case "book_id":
        entry.bookId = row[i]
        break
      case "anchor_id":
        entry.anchorId = row[i]
        break
      case "is_custom":
        entry.isCustom = row[i] === 1
        break
      case "created_at":
        entry.createdAt = row[i]
        break
      case "updated_at":
        entry.updatedAt = row[i]
        break
      default:
        entry[col] = row[i]
    }
  })
  
  return entry as TOCEntryRow
}

/**
 * Update TOC entry title
 */
export function updateTOCEntryTitle(
  id: string,
  title: string
): TOCEntryRow | null {
  const db = getDb()
  const now = new Date().toISOString()
  
  db.run(
    `UPDATE toc_entries SET title = ?, is_custom = 1, updated_at = ? WHERE id = ?`,
    [title, now, id]
  )
  saveDb()
  
  return getTOCEntryById(id)
}

/**
 * Reorder TOC entries based on new position array
 */
export function reorderTOCEntries(
  bookId: string,
  entryIds: string[]
): void {
  const db = getDb()
  const now = new Date().toISOString()
  
  entryIds.forEach((id, index) => {
    db.run(
      `UPDATE toc_entries SET position = ?, updated_at = ? WHERE id = ?`,
      [index, now, id]
    )
  })
  
  saveDb()
}

/**
 * Add a custom TOC entry
 */
export function addCustomTOCEntry(
  bookId: string,
  data: { title: string; level: number; position?: number }
): TOCEntryRow {
  const db = getDb()
  const id = nanoid()
  const now = new Date().toISOString()
  
  // Get the next position if not provided
  let position = data.position
  if (position === undefined) {
    const result = db.exec(
      `SELECT MAX(position) as maxPos FROM toc_entries WHERE book_id = '${bookId}' AND deleted_at IS NULL`
    )
    const maxPos = result[0]?.values[0]?.[0] as number | null
    position = (maxPos ?? -1) + 1
  }
  
  db.run(
    `INSERT INTO toc_entries (id, book_id, title, level, anchor_id, position, is_custom, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, bookId, data.title, data.level, null, position, 1, now, now]
  )
  saveDb()
  
  return getTOCEntryById(id)!
}

/**
 * Remove a TOC entry
 */
export function removeTOCEntry(id: string): void {
  const db = getDb()
  const now = new Date().toISOString()
  
  // Soft delete - mark as removed
  db.run(
    `UPDATE toc_entries SET updated_at = ?, deleted_at = ? WHERE id = ?`,
    [now, now, id]
  )
  saveDb()
}
