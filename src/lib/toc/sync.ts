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
    isCustom: row.isCustom,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function getTOCEntriesForBook(bookId: string): TOCEntryRow[] {
  const rows = db
    .select()
    .from(tocEntries)
    .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
    .orderBy(asc(tocEntries.position))
    .all()

  return rows.map(mapRow)
}

export function isCustomEntry(
  entry: TOCEntryRow,
  anchor?: Anchor
): boolean {
  if (entry.isCustom) return true
  if (anchor && entry.anchorId === anchor.id && entry.title !== anchor.textContent) return true
  return false
}

export function syncTOCWithHeadings(
  bookId: string,
  anchors: Anchor[]
): { added: number; updated: number; preserved: number } {
  const existing = getTOCEntriesForBook(bookId)
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
        db.update(tocEntries)
          .set({ position: newPosition, updatedAt: now })
          .where(eq(tocEntries.id, entry.id))
          .run()
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
      db.insert(tocEntries).values({
        id,
        bookId,
        title: anchor.textContent,
        level: anchor.level,
        anchorId: anchor.id,
        position: index,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      }).run()
      added++
    }
  }

  return { added, updated, preserved }
}

export function debounceSync<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getTOCEntryById(id: string): TOCEntryRow | null {
  const rows = db.select().from(tocEntries).where(eq(tocEntries.id, id)).all()
  const row = rows[0]
  if (!row || row.deletedAt) return null
  return mapRow(row)
}

export function updateTOCEntryTitle(id: string, title: string): TOCEntryRow | null {
  const now = new Date().toISOString()
  db.update(tocEntries)
    .set({ title, isCustom: true, updatedAt: now })
    .where(eq(tocEntries.id, id))
    .run()
  return getTOCEntryById(id)
}

export function reorderTOCEntries(bookId: string, entryIds: string[]): void {
  const now = new Date().toISOString()
  for (let i = 0; i < entryIds.length; i++) {
    db.update(tocEntries)
      .set({ position: i, updatedAt: now })
      .where(eq(tocEntries.id, entryIds[i]))
      .run()
  }
}

export function addCustomTOCEntry(
  bookId: string,
  data: { title: string; level: number; position?: number }
): TOCEntryRow {
  let position = data.position
  if (position === undefined) {
    const maxResult = db
      .select({ value: sql<number>`coalesce(max(${tocEntries.position}), -1)` })
      .from(tocEntries)
      .where(and(eq(tocEntries.bookId, bookId), isNull(tocEntries.deletedAt)))
      .all()
    position = (maxResult[0]?.value ?? -1) + 1
  }

  const id = nanoid()
  const now = new Date().toISOString()

  db.insert(tocEntries).values({
    id,
    bookId,
    title: data.title,
    level: data.level,
    anchorId: null,
    position,
    isCustom: true,
    createdAt: now,
    updatedAt: now,
  }).run()

  return getTOCEntryById(id)!
}

export function removeTOCEntry(id: string): void {
  const now = new Date().toISOString()
  db.update(tocEntries)
    .set({ updatedAt: now, deletedAt: now })
    .where(eq(tocEntries.id, id))
    .run()
}
