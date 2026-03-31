"use client"

import { useRef } from "react"
import { Editor } from "@tiptap/react"
import { Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { clsx } from "clsx"
import { fileToBase64, validateImageFile } from "@/lib/import/image-utils"

interface ImageInsertButtonProps {
  editor: Editor | null
  bookId?: string
}

export function ImageInsertButton({ editor, bookId }: ImageInsertButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (!editor) {
    return null
  }

  const buttonClass = (isActive: boolean) =>
    clsx(
      "p-2 rounded hover:bg-gray-100 transition-colors",
      isActive ? "bg-gray-200 text-blue-600" : "text-gray-700"
    )

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file)

      // Insert image into editor
      editor.chain().focus().setImage({ src: base64 }).run()
      toast.success("Image inserted")
    } catch (error) {
      console.error("Image insert error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to insert image")
    } finally {
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className={buttonClass(false)}
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </>
  )
}
