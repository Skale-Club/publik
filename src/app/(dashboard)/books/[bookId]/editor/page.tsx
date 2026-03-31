import Link from "next/link"
import { notFound } from "next/navigation"
import { initDb } from "@/infrastructure/db/client"
import { Book } from "@/domain/book/book"
import { Chapter } from "@/domain/book/chapter"
import { getChapters, createChapter } from "../actions"
import { EditorPageClient } from "./editor-page-client"

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
  const book: Record<string, unknown> = {}
  columns.forEach((col: string, i: number) => {
    const key = col === "book_id" ? "bookId" : 
                col === "trim_size_id" ? "trimSizeId" :
                col === "paper_type" ? "paperType" :
                col === "ink_type" ? "inkType" :
                col === "cover_finish" ? "coverFinish" :
                col === "created_at" ? "createdAt" :
                col === "updated_at" ? "updatedAt" :
                col === "deleted_at" ? "deletedAt" : col
    book[key] = row[i]
  })
  return book as unknown as Book
}

export default async function EditorPage({ params }: PageProps) {
  const { bookId } = await params
  await initDb()
  
  const book = getBook(bookId)
  
  if (!book) {
    notFound()
  }
  
  const chapters = await getChapters(bookId)
  
  return (
    <EditorPageClient book={book} chapters={chapters} />
  )
}
