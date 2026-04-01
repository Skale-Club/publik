import type { TOCEntry, Anchor } from "@/types/toc"
import { db } from "@/infrastructure/db/client"
import { tocEntries } from "@/infrastructure/db/schema/toc"
import { eq, isNull, asc, sql, and } from "drizzle-orm"
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

function mapRow(row: typeof tocEntries.$inferSelect): TOCEntryRow {
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

export async function getTOCEntriesForBook(bookId: string): Promise<TOCEntryRow[]> {
  const rows = await db
    .select()
    .from(tocEntries)
    .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
    .orderBy(asc(tocEntries.position))

  return rows.map(mapRow)
}

export async function syncTOCWithHeadings(
  bookId: string,
  anchors: Anchor[]
): Promise<{ added: number; updated: number; preserved: number }> {
  const existing = await db
    .select()
    .from(tocEntries)
    .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
    .orderBy(asc(tocEntries.position))

  const anchorMap = new Map(anchors.map((a) => [a.id, a]))
  const entryAnchorMap = new Map(
    existing.filter((e) => e.anchorId).map((e) => [e.anchorId!, e])
  )

  let added = 0
  let updated = 0
  let preserved = 0
  const now = new Date().toISOString()

  for (const entry of existing) {
    if (entry.anchorId && anchorMap.has(entry.anchorId)) {
      const newPosition = anchors.findIndex((a) => a.id === entry.anchorId)
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

  for (let index = 0; index < anchors.length; index++) {
    const anchor = anchors[index]
    if (!entryAnchorMap.has(anchor.id)) {
      const id = nanoid()
      await db.insert(tocEntries).values({
        id,
        bookId,
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

  return { added, updated, preserved }
}

export async function reorderTOCEntries(bookId: string, entryIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  for (let i = 0; i < entryIds.length; i++) {
    await db.update(tocEntries)
      .set({ position: i, updatedAt: now })
      .where(eq(tocEntries.id, entryIds[i]))
  }
}

export async function addCustomTOCEntry(
  bookId: string,
  data: { title: string; level: number; position?: number }
): Promise<TOCEntryRow> {
  let position = data.position
  if (position === undefined) {
    const maxResult = await db
      .select({ value: sql<number>`coalesce(max(${tocEntries.position}), -1)` })
      .from(tocEntries)
      .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
    position = (maxResult[0]?.value ?? -1) + 1
  }

  const id = nanoid()
  const now = new Date().toISOString()

  await db.insert(tocEntries).values({
    id,
    bookId,
    title: data.title,
    level: data.level,
    anchorId: null,
    position,
    isCustom: 1,
    createdAt: now,
    updatedAt: now,
  })

  const rows = await db.select().from(tocEntries).where(eq(tocEntries.id, id))
  return mapRow(rows[0]!)
}

export async function removeTOCEntry(id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.update(tocEntries)
    .set({ updatedAt: now, deletedAt: now })
    .where(eq(tocEntries.id, id))
}
