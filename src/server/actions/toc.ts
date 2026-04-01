"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Anchor } from "@/types/toc"
import { db } from "@/infrastructure/db/client"
import { tocEntries } from "@/infrastructure/db/schema/toc"
import { eq, isNull, asc, sql, and } from "drizzle-orm"
import { nanoid } from "nanoid"

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

function mapRow(row: typeof tocEntries.$inferSelect): TOCEntryResponse {
  return {
    id: row.id,
    bookId: row.bookId,
    title: row.title,
    level: row.level,
    anchorId: row.anchorId,
    position: row.position,
    isCustom: !!row.isCustom,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }
}

export async function getTOCEntries(bookId: string): Promise<TOCEntryResponse[]> {
  const rows = await db
    .select()
    .from(tocEntries)
    .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
    .orderBy(asc(tocEntries.position))

  return rows.map(mapRow)
}

export async function updateTOCEntry(
  id: string,
  title: string
): Promise<{ success: boolean; entry?: TOCEntryResponse; error?: string }> {
  try {
    const validated = updateTOCEntrySchema.parse({ id, title })
    const now = new Date().toISOString()

    await db
      .update(tocEntries)
      .set({ title: validated.title, isCustom: 1, updatedAt: now })
      .where(eq(tocEntries.id, validated.id))

    const rows = await db.select().from(tocEntries).where(eq(tocEntries.id, validated.id))
    const row = rows[0]
    if (!row || row.deletedAt) {
      return { success: false, error: "Entry not found" }
    }

    revalidatePath(`/books/${row.bookId}`)
    return { success: true, entry: mapRow(row) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function reorderTOCEntriesAction(
  bookId: string,
  entryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = reorderTOCEntriesSchema.parse({ bookId, entryIds })
    const now = new Date().toISOString()

    for (let i = 0; i < validated.entryIds.length; i++) {
      await db
        .update(tocEntries)
        .set({ position: i, updatedAt: now })
        .where(eq(tocEntries.id, validated.entryIds[i]))
    }

    revalidatePath(`/books/${validated.bookId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function addTOCEntry(
  bookId: string,
  title: string,
  level: number = 1,
  position?: number
): Promise<{ success: boolean; entry?: TOCEntryResponse; error?: string }> {
  try {
    const validated = addTOCEntrySchema.parse({ bookId, title, level, position })
    const id = nanoid()
    const now = new Date().toISOString()

    let pos = validated.position
    if (pos === undefined) {
      const maxResult = await db
        .select({ value: sql<number>`coalesce(max(${tocEntries.position}), -1)` })
        .from(tocEntries)
        .where(and(eq(tocEntries.bookId, validated.bookId), isNull(tocEntries.deletedAt)))
      pos = (maxResult[0]?.value ?? -1) + 1
    }

    await db.insert(tocEntries).values({
      id,
      bookId: validated.bookId,
      title: validated.title,
      level: validated.level,
      anchorId: null,
      position: pos,
      isCustom: 1,
      createdAt: now,
      updatedAt: now,
    })

    const rows = await db.select().from(tocEntries).where(eq(tocEntries.id, id))
    const row = rows[0]

    revalidatePath(`/books/${validated.bookId}`)
    return { success: true, entry: row ? mapRow(row) : undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function removeTOCEntryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = removeTOCEntrySchema.parse({ id })
    const now = new Date().toISOString()

    await db
      .update(tocEntries)
      .set({ updatedAt: now, deletedAt: now })
      .where(eq(tocEntries.id, validated.id))

    const rows = await db.select().from(tocEntries).where(eq(tocEntries.id, validated.id))

    revalidatePath(`/books/${rows[0]?.bookId ?? ""}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function syncTOC(
  bookId: string,
  anchors: Anchor[]
): Promise<{ success: boolean; result?: { added: number; updated: number; preserved: number }; error?: string }> {
  try {
    const validated = syncTOCSchema.parse({ bookId, anchors })

    const existing = await db
      .select()
      .from(tocEntries)
      .where(and(eq(tocEntries.bookId, validated.bookId), isNull(tocEntries.deletedAt)))
      .orderBy(asc(tocEntries.position))

    const anchorMap = new Map(validated.anchors.map((a) => [a.id, a]))
    const entryAnchorMap = new Map(
      existing.filter((e) => e.anchorId).map((e) => [e.anchorId!, e])
    )

    let added = 0
    let updated = 0
    let preserved = 0
    const now = new Date().toISOString()

    for (const entry of existing) {
      if (entry.anchorId && anchorMap.has(entry.anchorId)) {
        const newPosition = validated.anchors.findIndex((a) => a.id === entry.anchorId)
        if (entry.position !== newPosition) {
          await db
            .update(tocEntries)
            .set({ position: newPosition, updatedAt: now })
            .where(eq(tocEntries.id, entry.id))
          updated++
        } else {
          preserved++
        }
      }
    }

    for (let index = 0; index < validated.anchors.length; index++) {
      const anchor = validated.anchors[index]
      if (!entryAnchorMap.has(anchor.id)) {
        const id = nanoid()
        await db.insert(tocEntries).values({
          id,
          bookId: validated.bookId,
          title: anchor.textContent,
          level: anchor.level,
          anchorId: anchor.id,
          position: index,
          isCustom: 0,
          createdAt: now,
          updatedAt: now,
        })
        added++
      }
    }

    revalidatePath(`/books/${validated.bookId}`)
    return { success: true, result: { added, updated, preserved } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
