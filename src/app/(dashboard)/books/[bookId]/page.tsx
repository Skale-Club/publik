import Link from "next/link"
import { initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"
import { deleteBook } from "./actions"
import { BookSettingsForm } from "@/components/books/book-settings-form"

interface PageProps {
  params: Promise<{ bookId: string }>
}

async function getBook(bookId: string): Promise<Book | null> {
  await initDb()
  const { getDb } = await import("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM books WHERE id = '${bookId}' AND deleted_at IS NULL`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const book: any = {}
  columns.forEach((col, i) => {
    book[col] = row[i]
  })
  return book as Book
}

export default async function BookDetailPage({ params }: PageProps) {
  const { bookId } = await params
  const book = await getBook(bookId)
  
  if (!book) {
    return (
      <div className="p-8">
        <p>Book not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link
        href="/dashboard"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Book Settings</h1>
        <form action={async () => {
          "use server"
          await deleteBook(bookId)
        }}>
          <button
            type="submit"
            className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
            onClick={(e) => {
              if (!confirm("Are you sure you want to delete this book?")) {
                e.preventDefault()
              }
            }}
          >
            Delete
          </button>
        </form>
      </div>
      
      <BookSettingsForm book={book} />
    </div>
  )
}
