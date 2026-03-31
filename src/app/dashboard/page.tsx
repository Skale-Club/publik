import Link from "next/link"
import { BookCard } from "@/components/books/book-card"
import { getDb, initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"

export const dynamic = "force-dynamic"

async function getBooks(): Promise<Book[]> {
  await initDb()
  const db = getDb()

  const result = db.exec("SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at DESC")

  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }

  const columns = result[0].columns
  return result[0].values.map((row) => {
    const book: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      book[col] = row[i]
    })
    return book as unknown as Book
  })
}

export default async function DashboardPage() {
  const books = await getBooks()

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Books</h1>
        <Link
          href="/dashboard/books/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          New Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 py-12 text-center">
          <p className="mb-4 text-gray-500 dark:text-gray-400">No books yet</p>
          <Link href="/dashboard/books/new" className="text-blue-600 dark:text-blue-400 hover:underline">
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
