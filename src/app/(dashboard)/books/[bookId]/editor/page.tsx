import { notFound } from "next/navigation"
import { getChapters } from "../actions"
import { EditorPageClient } from "./editor-page-client"
import { getBook } from "@/server/queries/books"

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { bookId } = await params

  const book = await getBook(bookId)

  if (!book) {
    notFound()
  }

  const chapters = await getChapters(bookId)

  return (
    <EditorPageClient book={book} chapters={chapters} />
  )
}
