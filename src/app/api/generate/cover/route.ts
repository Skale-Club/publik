/**
 * Cover PDF Generation API Endpoint
 * Generates a complete KDP cover PDF with front cover, back cover, spine, and bleed
 */

import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { getDb } from "@/infrastructure/db/client"
import { CoverDocument, type CoverBookData } from "@/lib/pdf/cover-document"
import { isValidTrimSize } from "@/lib/pdf/page-layout"

export const maxDuration = 300 // 5 minutes for large documents

/**
 * GET handler for cover PDF generation
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

    // Fetch book with all needed fields
    const bookResult = db.exec(
      `SELECT id, title, trim_size_id, paper_type, ink_type 
       FROM books WHERE id = '${bookId}'`
    )

    if (bookResult.length === 0 || bookResult[0].values.length === 0) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    const bookColumns = bookResult[0].columns
    const bookValues = bookResult[0].values[0]

    const bookTitle = String(bookValues[bookColumns.indexOf("title")])
    const bookTrimSize = String(bookValues[bookColumns.indexOf("trim_size_id")])
    const bookPaperType = String(bookValues[bookColumns.indexOf("paper_type")] || "white")

    // Fetch cover data
    const coverResult = db.exec(
      `SELECT front_cover_url, back_cover_type, back_cover_image_url, back_cover_text 
       FROM covers WHERE book_id = '${bookId}'`
    )

    // Validate front cover exists
    if (coverResult.length === 0 || coverResult[0].values.length === 0) {
      return NextResponse.json(
        { error: "Front cover image required. Please upload a cover first." },
        { status: 400 }
      )
    }

    const coverColumns = coverResult[0].columns
    const coverValues = coverResult[0].values[0]

    const frontCoverUrl = String(coverValues[coverColumns.indexOf("front_cover_url")] || "")
    const backCoverType = String(coverValues[coverColumns.indexOf("back_cover_type")] || "")
    const backCoverImageUrl = String(coverValues[coverColumns.indexOf("back_cover_image_url")] || "")
    const backCoverText = String(coverValues[coverColumns.indexOf("back_cover_text")] || "")

    if (!frontCoverUrl) {
      return NextResponse.json(
        { error: "Front cover image required. Please upload a cover first." },
        { status: 400 }
      )
    }

    // Fetch chapters to estimate page count
    const chaptersResult = db.exec(
      `SELECT id, title, content FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL`
    )

    // Estimate page count from chapters
    let pageCount = 24 // Default minimum
    if (chaptersResult.length > 0 && chaptersResult[0].values.length > 0) {
      let totalWords = 0
      const contentIdx = chaptersResult[0].columns.indexOf("content")

      chaptersResult[0].values.forEach((row: unknown[]) => {
        if (contentIdx >= 0 && row[contentIdx]) {
          const content = String(row[contentIdx])
          totalWords += content.split(/\s+/).filter(Boolean).length
        }
      })

      // ~300 words per page for cover calculation (conservative)
      pageCount = Math.max(24, Math.ceil(totalWords / 300))
    }

    // Map paper type for spine calculation
    // inkType maps to paper type: bw/standard-color → white, premium-color → premium-color
    // But we need actual paper type (white, cream, premium-color, standard-color)
    // From books table: paper_type is "white" or "cream"
    // inkType can be "bw", "standard-color", "premium-color"
    // Map: paper_type="white" + inkType="bw" → "white"
    //       paper_type="cream" + inkType="bw" → "cream"
    //       paper_type="white" + inkType="standard-color" → "standard-color"
    //       paper_type="white" + inkType="premium-color" → "premium-color"
    const inkType = String(bookValues[bookColumns.indexOf("ink_type")] || "bw")
    let paperType: "white" | "cream" | "premium-color" | "standard-color" = "white"

    if (inkType === "premium-color") {
      paperType = "premium-color"
    } else if (inkType === "standard-color") {
      paperType = "standard-color"
    } else {
      // bw - use paper_type
      paperType = bookPaperType as "white" | "cream"
    }

    // Prepare book data for cover document
    const bookData: CoverBookData = {
      id: bookId,
      title: bookTitle,
      author: "Author", // TODO: Get from book or user
      trimSizeId: isValidTrimSize(bookTrimSize) ? bookTrimSize : "6x9",
      paperType,
      pageCount,
    }

    // Prepare cover data
    const coverDocument = CoverDocument({
      book: bookData,
      frontCoverUrl,
      backCoverUrl: backCoverType === "image" ? backCoverImageUrl || undefined : undefined,
      backCoverText: backCoverType === "text" ? backCoverText || undefined : undefined,
    })

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(coverDocument)

    // Return PDF
    const filename = `${bookTitle.replace(/[^a-z0-9]/gi, "_")}-cover.pdf`
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