import Link from "next/link"
import { Chapter } from "@/domain/book/chapter"
import { ChapterEditor } from "@/components/books/chapter-editor"
import { db } from "@/infrastructure/db/client"
import { chapters } from "@/infrastructure/db/schema/chapters"
import { eq, and } from "drizzle-orm"

interface PageProps {
  params: Promise<{ bookId: string; chapterId: string }>
}

async function getChapter(bookId: string, chapterId: string): Promise<Chapter | null> {
  const rows = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.bookId, bookId)))

  const row = rows[0]
  if (!row || row.deletedAt) return null

  return {
    id: row.id,
    bookId: row.bookId,
    title: row.title,
    order: row.order,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookId, chapterId } = await params

  const chapter = await getChapter(bookId, chapterId)

  if (!chapter) {
    return (
      <div className="p-8">
        <p>Chapter not found</p>
        <Link href={`/books/${bookId}`} className="text-blue-600 hover:underline">
          Back to Book
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <ChapterEditor bookId={bookId} chapter={chapter} />
    </div>
  )
}
