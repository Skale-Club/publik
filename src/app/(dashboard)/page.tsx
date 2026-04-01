import Link from "next/link"
import { BookCard } from "@/components/books/book-card"
import { Book } from "@/domain/book/book"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { isNull, desc } from "drizzle-orm"

export const dynamic = "force-dynamic"

async function getBooks(): Promise<Book[]> {
  const rows = await db
    .select()
    .from(books)
    .where(isNull(books.deletedAt))
    .orderBy(desc(books.createdAt))

  return rows.map((row) => ({
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
  }))
}

export default async function DashboardPage() {
  const books = await getBooks()

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Books</h1>
        <Link
          href="/books/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 py-12 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">No books yet</p>
          <Link href="/books/new" className="text-blue-600 dark:text-blue-400 hover:underline">
            Create your first book
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}
