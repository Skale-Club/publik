import Link from "next/link"
import { initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"
import { FileDownloads } from "@/components/export/FileDownloads"
import { ZipDownloadButton } from "@/components/export/ZipDownloadButton"

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

export default async function ExportPage({ params }: PageProps) {
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
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link
        href={`/dashboard/books/${bookId}`}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to {book.title}
      </Link>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Files - {book.title}</h1>
        <p className="text-gray-600 mt-2">
          Download your KDP-ready files. These files are formatted according to Amazon KDP specifications.
        </p>
      </div>
      
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your KDP-Ready Files</h2>
        <FileDownloads bookId={bookId} bookTitle={book.title} />
      </section>
      
      <section className="mb-8 border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Package</h2>
        <ZipDownloadButton bookId={bookId} bookTitle={book.title} />
      </section>
      
      <section className="border-t pt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-800 mb-3">
            New to KDP? Learn how to upload and publish your book step by step.
          </p>
          <Link
            href="/publishing-guide"
            className="inline-flex items-center gap-2 text-blue-700 font-medium hover:text-blue-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-book-open"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            View Publishing Guide
          </Link>
        </div>
      </section>
    </div>
  )
}
