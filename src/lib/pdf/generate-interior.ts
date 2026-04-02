import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { chapters as chaptersTable } from "@/infrastructure/db/schema/chapters"
import { tocEntries } from "@/infrastructure/db/schema/toc"
import { InteriorDocument, type BookSettings, type ChapterContent } from "./interior-document"
import { isValidTrimSize } from "./page-layout"
import { estimatePageCount } from "./page-count"
import { eq, isNull, asc, and } from "drizzle-orm"
import type { TOCEntry } from "@/types/toc"

export async function generateInteriorPDF(bookId: string): Promise<Buffer> {
  const bookRows = await db.select().from(books).where(eq(books.id, bookId))
  const bookRow = bookRows[0]
  if (!bookRow || bookRow.deletedAt) throw new Error("Book not found")

  const chapterRows = await db
    .select()
    .from(chaptersTable)
    .where(and(eq(chaptersTable.bookId, bookId), isNull(chaptersTable.deletedAt)))
    .orderBy(asc(chaptersTable.order))

  const chapterContents: ChapterContent[] = chapterRows.map((row) => ({
    id: row.id,
    title: row.title,
    anchorId: `chapter-${row.id}`,
    content: row.content || "",
    level: 1,
  }))

  const tocRows = await db
    .select()
    .from(tocEntries)
    .where(eq(tocEntries.bookId, bookId))
    .orderBy(asc(tocEntries.position))

  const bookTocEntries: TOCEntry[] = tocRows.map((row) => ({
    id: row.id,
    bookId: row.bookId,
    title: row.title,
    level: row.level,
    anchorId: row.anchorId,
    position: row.position,
    isCustom: Boolean(row.isCustom),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }))

  const pageCount = estimatePageCount(chapterContents.map((c) => c.content))
  const bookSettings: BookSettings = {
    title: bookRow.title,
    author: bookRow.author,
    trimSizeId: isValidTrimSize(bookRow.trimSizeId) ? bookRow.trimSizeId : undefined,
    pageCount,
    bleedSetting: "no-bleed",
  }

  const document = InteriorDocument({
    book: bookSettings,
    chapters: chapterContents,
    tocEntries: bookTocEntries,
  })

  return Buffer.from(await renderToBuffer(document))
}
