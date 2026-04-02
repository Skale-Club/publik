import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { eq } from "drizzle-orm"
import type { Book } from "@/domain/book/book"

export async function getBook(bookId: string): Promise<Book | null> {
  const rows = await db.select().from(books).where(eq(books.id, bookId))
  const row = rows[0]
  if (!row || row.deletedAt) return null
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    trimSizeId: row.trimSizeId,
    paperType: row.paperType as Book["paperType"],
    inkType: row.inkType as Book["inkType"],
    coverFinish: row.coverFinish as Book["coverFinish"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}
