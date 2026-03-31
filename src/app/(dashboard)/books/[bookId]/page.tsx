import Link from "next/link"
import { initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"
import { Chapter } from "@/domain/book/chapter"
import { deleteBook, createChapter, getChapters } from "./actions"
import { BookSettingsForm } from "@/components/books/book-settings-form"
import { ChapterList } from "@/components/books/chapter-list"

interface PageProps {
  params: Promise<{ bookId: string }>
}

function getBook(bookId: string): Book | null {
  const { getDb } = require("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM books WHERE id = '${bookId}' AND deleted_at IS NULL`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const book: any = {}
  columns.forEach((col: string, i: number) => {
    book[col] = row[i]
  })
  return book as Book
}

function getChaptersSync(bookId: string): Chapter[] {
  const { getDb } = require("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL ORDER BY "order" ASC`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }
  
  const columns = result[0].columns
  return result[0].values.map((row: any[]) => {
    const chapter: any = {}
    columns.forEach((col: string, i: number) => {
      const key = col === "book_id" ? "bookId" : col === "created_at" ? "createdAt" : col === "updated_at" ? "updatedAt" : col === "deleted_at" ? "deletedAt" : col
      chapter[key] = row[i]
    })
    return chapter as Chapter
  })
}

export default async function BookDetailPage({ params }: PageProps) {
  const { bookId } = await params
  await initDb()
  
  const book = getBook(bookId)
  
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
  
  const chapters = getChaptersSync(bookId)
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      <Link
        href="/dashboard"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Dashboard
      </Link>
      
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold">{book.title}</h1>
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
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Content</h2>
            {chapters.length === 0 ? (
              <p className="text-gray-500 mb-4">No chapters yet</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <Link
                      href={`/dashboard/books/${bookId}/chapters/${chapter.id}`}
                      className="block p-3 border rounded hover:bg-gray-50"
                    >
                      {chapter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            
            <form action={async () => {
              "use server"
              await createChapter(bookId, "New Chapter")
            }}>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Chapter
              </button>
            </form>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <BookSettingsForm book={book} />
          </div>
        </div>
        
        <div>
          <ChapterList chapters={chapters} bookId={bookId} />
        </div>
      </div>
    </div>
  )
}
