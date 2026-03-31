import Link from "next/link"
import { initDb } from "@/infrastructure/db/client"
import { Chapter } from "@/domain/book/chapter"
import { ChapterEditor } from "@/components/books/chapter-editor"

interface PageProps {
  params: Promise<{ bookId: string; chapterId: string }>
}

function getChapter(bookId: string, chapterId: string): Chapter | null {
  const { getDb } = require("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM chapters WHERE id = '${chapterId}' AND book_id = '${bookId}' AND deleted_at IS NULL`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const chapter: any = {}
  columns.forEach((col: string, i: number) => {
    const key = col === "book_id" ? "bookId" : col === "created_at" ? "createdAt" : col === "updated_at" ? "updatedAt" : col === "deleted_at" ? "deletedAt" : col
    chapter[key] = row[i]
  })
  return chapter as Chapter
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookId, chapterId } = await params
  await initDb()
  
  const chapter = getChapter(bookId, chapterId)
  
  if (!chapter) {
    return (
      <div className="p-8">
        <p>Chapter not found</p>
        <Link href={`/dashboard/books/${bookId}`} className="text-blue-600 hover:underline">
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
