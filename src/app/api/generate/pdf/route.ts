/**
 * PDF Generation API Endpoint
 * Generates PDF with TOC integration and KDP trim sizes
 */

import { NextRequest, NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { getDb } from "@/infrastructure/db/client"
import { InteriorDocument, type BookSettings, type ChapterContent } from "@/lib/pdf/interior-document"
import { isValidTrimSize } from "@/lib/pdf/page-layout"
import type { TOCEntry } from "@/types/toc"

export const maxDuration = 300 // 5 minutes for large documents

/**
 * GET handler for PDF generation
 * Expects bookId as query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 })
    }

    const db = getDb()

    // Fetch book
    const bookResult = db.exec(`SELECT id, title, trim_size_id FROM books WHERE id = '${bookId}'`)
    if (bookResult.length === 0 || bookResult[0].values.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const bookColumns = bookResult[0].columns
    const bookValues = bookResult[0].values[0]
    const bookTitle = String(bookValues[bookColumns.indexOf("title")])
    const bookTrimSize = String(bookValues[bookColumns.indexOf("trim_size_id")])

    // Fetch chapters ordered by position
    const chaptersResult = db.exec(
      `SELECT id, title, content FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL ORDER BY \`order\` ASC`
    )

    const chapterContents: ChapterContent[] = []
    if (chaptersResult.length > 0 && chaptersResult[0].values.length > 0) {
      const chapterColumns = chaptersResult[0].columns
      const idIdx = chapterColumns.indexOf("id")
      const titleIdx = chapterColumns.indexOf("title")
      const contentIdx = chapterColumns.indexOf("content")

      chaptersResult[0].values.forEach((row: unknown[]) => {
        const id = String(row[idIdx])
        const title = String(row[titleIdx])
        const content = row[contentIdx] ? String(row[contentIdx]) : ""
        
        chapterContents.push({
          id,
          title,
          anchorId: `chapter-${id}`,
          content,
          level: 1,
        })
      })
    }

    // Fetch TOC entries ordered by position
    const tocResult = db.exec(
      `SELECT id, book_id, title, level, anchor_id, position, is_custom, created_at, updated_at 
       FROM toc_entries WHERE book_id = '${bookId}' ORDER BY position ASC`
    )

    const bookTocEntries: TOCEntry[] = []
    if (tocResult.length > 0 && tocResult[0].values.length > 0) {
      const tocColumns = tocResult[0].columns
      const idIdx = tocColumns.indexOf("id")
      const bookIdIdx = tocColumns.indexOf("book_id")
      const titleIdx = tocColumns.indexOf("title")
      const levelIdx = tocColumns.indexOf("level")
      const anchorIdIdx = tocColumns.indexOf("anchor_id")
      const positionIdx = tocColumns.indexOf("position")
      const isCustomIdx = tocColumns.indexOf("is_custom")
      const createdAtIdx = tocColumns.indexOf("created_at")
      const updatedAtIdx = tocColumns.indexOf("updated_at")

      tocResult[0].values.forEach((row: unknown[]) => {
        bookTocEntries.push({
          id: String(row[idIdx]),
          bookId: String(row[bookIdIdx]),
          title: String(row[titleIdx]),
          level: Number(row[levelIdx]),
          anchorId: row[anchorIdIdx] ? String(row[anchorIdIdx]) : null,
          position: Number(row[positionIdx]),
          isCustom: row[isCustomIdx] === 1,
          createdAt: new Date(String(row[createdAtIdx])),
          updatedAt: new Date(String(row[updatedAtIdx])),
        })
      })
    }

    // Map book settings
    const bookSettings: BookSettings = {
      title: bookTitle,
      author: "Author", // TODO: Get from book or user
      trimSizeId: isValidTrimSize(bookTrimSize) ? bookTrimSize : undefined,
    }

    // Generate PDF
    const document = InteriorDocument({
      book: bookSettings,
      chapters: chapterContents,
      tocEntries: bookTocEntries,
    })

    // Render to stream
    const stream = await renderToStream(document)

    // Return PDF stream
    return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${bookTitle.replace(/[^a-z0-9]/gi, "_")}.pdf"`,
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
