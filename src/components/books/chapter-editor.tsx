"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { TipTapEditor } from "@/components/books/tiptap-editor"
import { updateChapter } from "@/app/(dashboard)/books/[bookId]/actions"
import { Chapter } from "@/domain/book/chapter"
import { useAutoSave } from "@/components/editor/use-auto-save"

interface ChapterEditorProps {
  bookId: string
  chapter: Chapter
}

export function ChapterEditor({ bookId, chapter: initialChapter }: ChapterEditorProps) {
  const [content, setContent] = useState(initialChapter.content || "")
  
  const handleSave = useCallback(async (newContent: string) => {
    await updateChapter(initialChapter.id, bookId, { content: newContent })
  }, [bookId, initialChapter.id])
  
  const { status, retry } = useAutoSave({
    content,
    onSave: handleSave,
  })

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("bookId", bookId)
    
    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error("Upload failed")
    }
    
    const data = await response.json()
    return data.url
  }

  const getStatusText = () => {
    switch (status) {
      case "saving": return "Saving..."
      case "saved": return "Saved"
      case "error": return "Error saving"
      default: return ""
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/books/${bookId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Book
        </Link>
        <div className="flex items-center gap-2">
          {status === "error" && (
            <button
              onClick={retry}
              className="text-sm text-red-600 hover:underline"
            >
              Retry
            </button>
          )}
          <span className={`text-sm ${
            status === "saved" ? "text-green-600" :
            status === "error" ? "text-red-600" :
            status === "saving" ? "text-gray-500" : "text-gray-400"
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-4">{initialChapter.title}</h1>
      
      <TipTapEditor
        content={content}
        onChange={setContent}
        onImageUpload={handleImageUpload}
      />
    </div>
  )
}
