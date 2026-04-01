"use client"

import { useState } from "react"
import { Chapter } from "@/domain/book/chapter"
import { createChapter, deleteChapter, reorderChapters } from "@/app/(dashboard)/books/[bookId]/actions"

interface ChapterListProps {
  chapters: Chapter[]
  bookId: string
  activeChapterId?: string
}

export function ChapterList({ chapters, bookId, activeChapterId }: ChapterListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    await createChapter(bookId, newTitle.trim())
    setNewTitle("")
    setIsCreating(false)
  }

  const handleDelete = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return
    setDeletingId(chapterId)
    await deleteChapter(chapterId, bookId)
    setDeletingId(null)
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newOrder = [...chapters]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    await reorderChapters(bookId, newOrder.map(c => c.id))
  }

  const handleMoveDown = async (index: number) => {
    if (index === chapters.length - 1) return
    const newOrder = [...chapters]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    await reorderChapters(bookId, newOrder.map(c => c.id))
  }

  return (
    <div className="border rounded-lg">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-medium">Chapters</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isCreating ? "Cancel" : "+ Add"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="p-3 border-b bg-gray-50">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Chapter title"
            className="w-full px-3 py-2 border rounded mb-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Chapter
          </button>
        </form>
      )}

      {chapters.length === 0 ? (
        <p className="p-4 text-gray-500 text-sm">No chapters yet</p>
      ) : (
        <ul className="divide-y">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              className={`flex items-center gap-2 p-3 hover:bg-gray-50 ${
                activeChapterId === chapter.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === chapters.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  title="Move down"
                >
                  ▼
                </button>
              </div>
              <a
                href={`/books/${bookId}/chapters/${chapter.id}`}
                className="flex-1 text-sm hover:text-blue-600"
              >
                {index + 1}. {chapter.title}
              </a>
              <button
                onClick={() => handleDelete(chapter.id)}
                disabled={deletingId === chapter.id}
                className="text-gray-400 hover:text-red-600 text-sm px-2"
                title="Delete chapter"
              >
                {deletingId === chapter.id ? "..." : "✕"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
