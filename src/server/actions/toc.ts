"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Anchor } from "@/types/toc"
import {
  getTOCEntriesForBook,
  getTOCEntryById,
  updateTOCEntryTitle,
  reorderTOCEntries,
  addCustomTOCEntry,
  removeTOCEntry,
  syncTOCWithHeadings,
  type TOCEntryRow,
} from "@/lib/toc/sync"

// Validation schemas
const updateTOCEntrySchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
})

const reorderTOCEntriesSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  entryIds: z.array(z.string()).min(0),
})

const addTOCEntrySchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  level: z.number().int().min(1).max(6).default(1),
  position: z.number().int().optional(),
})

const removeTOCEntrySchema = z.object({
  id: z.string().min(1, "Entry ID is required"),
})

const syncTOCSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  anchors: z.array(
    z.object({
      id: z.string(),
      textContent: z.string(),
      level: z.number().int(),
      originalLevel: z.number().int(),
      pos: z.number().int(),
      isActive: z.boolean(),
      isScrolledOver: z.boolean(),
    })
  ),
})

// Types for responses
export interface TOCEntryResponse {
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
 * Convert internal row to response type
 */
function rowToResponse(row: TOCEntryRow): TOCEntryResponse {
  return {
    id: row.id,
    bookId: row.bookId,
    title: row.title,
    level: row.level,
    anchorId: row.anchorId,
    position: row.position,
    isCustom: row.isCustom,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * Get all TOC entries for a book
 */
export async function getTOCEntries(bookId: string): Promise<TOCEntryResponse[]> {
  const entries = getTOCEntriesForBook(bookId)
  return entries.map(rowToResponse)
}

/**
 * Update a TOC entry's title
 */
export async function updateTOCEntry(
  id: string,
  title: string
): Promise<{ success: boolean; entry?: TOCEntryResponse; error?: string }> {
  try {
    const validated = updateTOCEntrySchema.parse({ id, title })
    
    const updated = updateTOCEntryTitle(validated.id, validated.title)
    
    if (!updated) {
      return { success: false, error: "Entry not found" }
    }
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true, entry: rowToResponse(updated) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Reorder TOC entries based on new position array
 */
export async function reorderTOCEntriesAction(
  bookId: string,
  entryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = reorderTOCEntriesSchema.parse({ bookId, entryIds })
    
    reorderTOCEntries(validated.bookId, validated.entryIds)
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Add a custom TOC entry
 */
export async function addTOCEntry(
  bookId: string,
  title: string,
  level: number = 1,
  position?: number
): Promise<{ success: boolean; entry?: TOCEntryResponse; error?: string }> {
  try {
    const validated = addTOCEntrySchema.parse({ bookId, title, level, position })
    
    const entry = addCustomTOCEntry(validated.bookId, {
      title: validated.title,
      level: validated.level,
      position: validated.position,
    })
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true, entry: rowToResponse(entry) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Remove a TOC entry
 */
export async function removeTOCEntryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = removeTOCEntrySchema.parse({ id })
    
    removeTOCEntry(validated.id)
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Sync TOC entries with editor headings
 */
export async function syncTOC(
  bookId: string,
  anchors: Anchor[]
): Promise<{ success: boolean; result?: { added: number; updated: number; preserved: number }; error?: string }> {
  try {
    const validated = syncTOCSchema.parse({ bookId, anchors })
    
    const result = syncTOCWithHeadings(validated.bookId, validated.anchors)
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true, result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
