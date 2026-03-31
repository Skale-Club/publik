"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
  onImageUpload?: (file: File) => Promise<string>
}

export interface TipTapEditorRef {
  insertImage: (url: string) => void
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  function TipTapEditor({ content, onChange, editable = true, onImageUpload }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    
    const handleImageUpload = async () => {
      if (!onImageUpload || uploading) return
      fileInputRef.current?.click()
    }
    
    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !onImageUpload) return
      
      setUploading(true)
      try {
        const url = await onImageUpload(file)
        editor?.chain().focus().setImage({ src: url }).run()
      } catch (err) {
        console.error("Image upload failed:", err)
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }
    
    const editor = useEditor({
      extensions: [
        StarterKit,
        Image.configure({ inline: false, allowBase64: true }),
      ],
      content: content || "",
      editable,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
    })

    useImperativeHandle(ref, () => ({
      insertImage: (url: string) => {
        editor?.chain().focus().setImage({ src: url }).run()
      }
    }))

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "")
      }
    }, [content, editor])

    if (!editor) {
      return <div className="p-4 border rounded-lg min-h-[200px]">Loading editor...</div>
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {editable && (
          <div className="border-b p-2 bg-gray-50 flex gap-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-2 py-1 rounded ${
                editor.isActive("bold") ? "bg-gray-200" : ""
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 rounded italic ${
                editor.isActive("italic") ? "bg-gray-200" : ""
              }`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2 py-1 rounded font-bold ${
                editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
              }`}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 rounded font-bold ${
                editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
              }`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 rounded ${
                editor.isActive("bulletList") ? "bg-gray-200" : ""
              }`}
            >
              • List
            </button>
            {onImageUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploading}
                  className="px-2 py-1 rounded disabled:opacity-50"
                  title="Insert image"
                >
                  {uploading ? "..." : "IMG"}
                </button>
              </>
            )}
          </div>
        )}
        <EditorContent
          editor={editor}
          className="prose max-w-none p-4 min-h-[300px]"
        />
      </div>
    )
  }
)
