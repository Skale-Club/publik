import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { chapters as chaptersTable } from "@/infrastructure/db/schema/chapters"
import { covers as coversTable } from "@/infrastructure/db/schema/covers"
import { CoverDocument, type CoverBookData } from "@/lib/pdf/cover-document"
import { isValidTrimSize } from "@/lib/pdf/page-layout"
import { estimatePageCount } from "@/lib/pdf/page-count"
import { eq, and, isNull } from "drizzle-orm"

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
    if (!bookRow) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const coverRows = await db.select().from(coversTable).where(eq(coversTable.bookId, bookId))
    const coverRow = coverRows[0]

    if (!coverRow || !coverRow.frontCoverUrl) {
      return NextResponse.json(
        { error: "Front cover image required. Please upload a cover first." },
        { status: 400 }
      )
    }

    const chapterRows = await db
      .select({ content: chaptersTable.content })
      .from(chaptersTable)
      .where(and(eq(chaptersTable.bookId, bookId), isNull(chaptersTable.deletedAt)))

    const pageCount = estimatePageCount(chapterRows.map((r) => r.content ?? ""))

    const inkType = bookRow.inkType
    let paperType: "white" | "cream" | "premium-color" | "standard-color" = "white"
    if (inkType === "premium-color") {
      paperType = "premium-color"
    } else if (inkType === "standard-color") {
      paperType = "standard-color"
    } else {
      paperType = bookRow.paperType as "white" | "cream"
    }

    const bookData: CoverBookData = {
      id: bookId,
      title: bookRow.title,
      author: bookRow.author,
      trimSizeId: isValidTrimSize(bookRow.trimSizeId) ? bookRow.trimSizeId : "6x9",
      paperType,
      pageCount,
    }

    const coverDocument = CoverDocument({
      book: bookData,
      frontCoverUrl: coverRow.frontCoverUrl,
      backCoverUrl: coverRow.backCoverType === "image" ? coverRow.backCoverImageUrl || undefined : undefined,
      backCoverText: coverRow.backCoverType === "text" ? coverRow.backCoverText || undefined : undefined,
    })

    const pdfBuffer = await renderToBuffer(coverDocument)

    const filename = `${bookRow.title.replace(/[^a-z0-9]/gi, "_")}-cover.pdf`
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Cover PDF generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cover PDF" },
      { status: 500 }
    )
  }
}
