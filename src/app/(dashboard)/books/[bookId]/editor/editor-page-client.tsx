"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Book } from "@/domain/book/book"
import { Chapter } from "@/domain/book/chapter"
import { createChapter, updateChapter } from "../actions"
import { TipTapEditor } from "@/components/editor/tiptap-editor"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { useAutoSave } from "@/components/editor/use-auto-save"
import { useEditor } from "@tiptap/react"
import { toast } from "sonner"
import { Plus, ChevronDown } from "lucide-react"

interface EditorPageClientProps {
  book: Book
  chapters: Chapter[]
}

export function EditorPageClient({ book, chapters: initialChapters }: EditorPageClientProps) {
  const [chapters, setChapters] = useState(initialChapters)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    initialChapters.length > 0 ? initialChapters[0].id : null
  )
  const [isCreating, setIsCreating] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [showChapterDropdown, setShowChapterDropdown] = useState(false)

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId)

  const editor = useEditor({
    extensions: [],
    content: selectedChapter?.content || "",
    editable: true,
  })

  // Update editor content when chapter changes
  useMemo(() => {
    if (editor && selectedChapter) {
      const currentContent = editor.getHTML()
      const newContent = selectedChapter.content || ""
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent)
      }
    }
  }, [selectedChapterId, selectedChapter, editor])

  const handleContentChange = useCallback((newContent: string) => {
    // This will trigger auto-save via useAutoSave
    // We need a different approach - let's use onChange directly
  }, [])

  const [currentContent, setCurrentContent] = useState(selectedChapter?.content || "")

  const handleSave = useCallback(async (contentToSave: string) => {
    if (!selectedChapterId) return
    await updateChapter(selectedChapterId, book.id, { content: contentToSave })
  }, [book.id, selectedChapterId])

  const { status, retry } = useAutoSave({
    content: currentContent,
    onSave: handleSave,
  })

  const handleChapterChange = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId)
    if (chapter) {
      setSelectedChapterId(chapterId)
      setCurrentContent(chapter.content || "")
      setShowChapterDropdown(false)
    }
  }

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChapterTitle.trim()) return

    const result = await createChapter(book.id, newChapterTitle.trim())
    const updatedChapters = await getChaptersUpdated(book.id)
    setChapters(updatedChapters)
    setSelectedChapterId(result.id)
    setCurrentContent("")
    setNewChapterTitle("")
    setIsCreating(false)
    toast.success("Chapter created")
  }

  const getStatusText = () => {
    switch (status) {
      case "saving": return "Saving..."
      case "saved": return "Saved"
      case "error": return "Error saving"
      default: return ""
    }
  }

  const handleEditorChange = (content: string) => {
    setCurrentContent(content)
  }

  // No chapters - show create prompt
  if (chapters.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Link
          href={`/dashboard/books/${book.id}`}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Book
        </Link>
        
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
          <p className="text-gray-600 mb-8">Create your first chapter to start writing</p>
          
          <form onSubmit={handleCreateChapter} className="max-w-md mx-auto">
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full px-4 py-3 border rounded-lg mb-4"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newChapterTitle.trim()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create First Chapter
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/books/${book.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold">{book.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Chapter Selector */}
          <div className="relative">
            <button
              onClick={() => setShowChapterDropdown(!showChapterDropdown)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <span>{selectedChapter?.title || "Select chapter"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showChapterDropdown && (
              <div className="absolute right-0 mt-1 w-64 border rounded-lg bg-white shadow-lg z-10">
                <div className="max-h-64 overflow-y-auto">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterChange(chapter.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        selectedChapterId === chapter.id ? "bg-blue-50" : ""
                      }`}
                    >
                      {index + 1}. {chapter.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Save Status */}
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
      </div>

      {/* Editor */}
      {selectedChapter && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <EditorToolbar editor={editor} />
          <TipTapEditor
            editor={editor}
            content={currentContent}
            onChange={handleEditorChange}
            placeholder={`Write "${selectedChapter.title}" here...`}
          />
        </div>
      )}

      {/* Add Chapter Button (floating) */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Chapter
        </button>
      )}

      {/* Create Chapter Form */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateChapter} className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create New Chapter</h3>
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full px-4 py-2 border rounded mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newChapterTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// Helper to get updated chapters
async function getChaptersUpdated(bookId: string): Promise<Chapter[]> {
  const { getDb } = await import("@/infrastructure/db/client")
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL ORDER BY "order" ASC`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }
  
  const columns = result[0].columns
  return result[0].values.map((row: unknown[]) => {
    const chapter: Record<string, unknown> = {}
    columns.forEach((col: string, i: number) => {
      const key = col === "book_id" ? "bookId" : 
                  col === "created_at" ? "createdAt" : 
                  col === "updated_at" ? "updatedAt" : 
                  col === "deleted_at" ? "deletedAt" : col
      chapter[key] = row[i]
    })
    return chapter as unknown as Chapter
  })
}
