import { NextRequest, NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { chapters as chaptersTable } from "@/infrastructure/db/schema/chapters"
import { tocEntries } from "@/infrastructure/db/schema/toc"
import { InteriorDocument, type BookSettings, type ChapterContent } from "@/lib/pdf/interior-document"
import { isValidTrimSize } from "@/lib/pdf/page-layout"
import { estimatePageCount } from "@/lib/pdf/page-count"
import { eq, isNull, asc, and } from "drizzle-orm"
import type { TOCEntry } from "@/types/toc"

export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 })
    }

    const bookRows = await db.select().from(books).where(eq(books.id, bookId))
    const bookRow = bookRows[0]
    if (!bookRow || bookRow.deletedAt) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

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

    const stream = await renderToStream(document)

    return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bookRow.title.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
