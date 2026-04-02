import { renderToBuffer } from "@react-pdf/renderer"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { chapters as chaptersTable } from "@/infrastructure/db/schema/chapters"
import { covers as coversTable } from "@/infrastructure/db/schema/covers"
import { CoverDocument, type CoverBookData } from "./cover-document"
import { isValidTrimSize } from "./page-layout"
import { estimatePageCount } from "./page-count"
import { eq, and, isNull } from "drizzle-orm"

export async function generateCoverPDF(bookId: string): Promise<Buffer> {
  const bookRows = await db.select().from(books).where(eq(books.id, bookId))
  const bookRow = bookRows[0]
  if (!bookRow || bookRow.deletedAt) throw new Error("Book not found")

  const coverRows = await db.select().from(coversTable).where(eq(coversTable.bookId, bookId))
  const coverRow = coverRows[0]
  if (!coverRow || !coverRow.frontCoverUrl) {
    throw new Error("Front cover image required. Please upload a cover first.")
  }

  const chapterRows = await db
    .select({ content: chaptersTable.content })
    .from(chaptersTable)
    .where(and(eq(chaptersTable.bookId, bookId), isNull(chaptersTable.deletedAt)))

  const pageCount = estimatePageCount(chapterRows.map((r) => r.content ?? ""))

  const inkType = bookRow.inkType
  let paperType: CoverBookData["paperType"] = "white"
  if (inkType === "premium-color") paperType = "premium-color"
  else if (inkType === "standard-color") paperType = "standard-color"
  else paperType = bookRow.paperType as "white" | "cream"

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
    backCoverUrl:
      coverRow.backCoverType === "image" ? coverRow.backCoverImageUrl || undefined : undefined,
    backCoverText:
      coverRow.backCoverType === "text" ? coverRow.backCoverText || undefined : undefined,
  })

  return Buffer.from(await renderToBuffer(coverDocument))
}
