import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { eq } from "drizzle-orm"
import { CoverEditor } from "@/components/covers/CoverEditor"

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function CoverPage({ params }: PageProps) {
  const { bookId } = await params

  const bookRows = await db.select().from(books).where(eq(books.id, bookId))
  const bookRow = bookRows[0]

  if (!bookRow || bookRow.deletedAt) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link
        href={`/books/${bookId}`}
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to {bookRow.title}
      </Link>

      <CoverEditor bookId={bookId} />
    </div>
  )
}
