"use client"

import { useEditor as useTiptapEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react"

interface TipTapEditorProps {
  content?: string
  onChange?: (content: string) => void
  editable?: boolean
  placeholder?: string
  editor?: Editor | null
  onImageUpload?: (file: File) => Promise<string>
}

export interface TipTapEditorRef {
  focus: () => void
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  function TipTapEditor(
    {
      content = "",
      onChange,
      editable = true,
      placeholder = "Start writing your chapter...",
      editor: externalEditor,
      onImageUpload,
    },
    ref
  ) {
    const internalEditorRef = useRef<Editor | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [uploading, setUploading] = useState(false)

    const internalEditor = useTiptapEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({ placeholder }),
        Underline,
        Image.configure({ inline: false, allowBase64: false }),
      ],
      content: content || "",
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
        },
      },
    })

    const editor = externalEditor || internalEditor

    useEffect(() => {
      setIsMounted(true)
    }, [])

    useEffect(() => {
      if (editor && isMounted) {
        internalEditorRef.current = editor
      }
    }, [editor, isMounted])

    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.chain().focus().run()
      },
    }))

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "")
      }
    }, [content, editor])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!editor) {
      return (
        <div className="border rounded-lg min-h-[400px] flex items-center justify-center bg-gray-50">
          <span className="text-gray-500">Loading editor...</span>
        </div>
      )
    }

    return (
      <div className="min-h-[400px]">
        {onImageUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        )}
        <EditorContent editor={editor} className="min-h-[400px]" />
      </div>
    )
  }
)
