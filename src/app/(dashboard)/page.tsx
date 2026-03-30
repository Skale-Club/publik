import Link from "next/link"
import { BookCard } from "@/components/books/book-card"
import { BookForm } from "@/components/books/book-form"
import { initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"

async function getBooks(): Promise<Book[]> {
  await initDb()
  const { getDb } = await import("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec("SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at DESC")
  
  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }
  
  const columns = result[0].columns
  return result[0].values.map((row) => {
    const book: any = {}
    columns.forEach((col, i) => {
      book[col] = row[i]
    })
    return book as Book
  })
}

export default async function DashboardPage() {
  const books = await getBooks()
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Books</h1>
        <Link
          href="/dashboard/books/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Book
        </Link>
      </div>
      
      {books.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No books yet</p>
          <Link
            href="/dashboard/books/new"
            className="text-blue-600 hover:underline"
          >
            Create your first book
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}
