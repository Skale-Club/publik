import Link from "next/link"
import { FileDownloads } from "@/components/export/FileDownloads"
import { ZipDownloadButton } from "@/components/export/ZipDownloadButton"
import { getBook } from "@/server/queries/books"

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function ExportPage({ params }: PageProps) {
  const { bookId } = await params

  const book = await getBook(bookId)

  if (!book) {
    return (
      <div className="p-8">
        <p>Book not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link
        href={`/books/${bookId}`}
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
            View Publishing Guide
          </Link>
        </div>
      </section>
    </div>
  )
}
