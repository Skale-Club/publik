"use client"

import { useEditor as useTiptapEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import { useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react"

interface TipTapEditorProps {
  content?: string
  onChange?: (content: string) => void
  editable?: boolean
  placeholder?: string
  editor?: Editor | null
}

export interface TipTapEditorRef {
  focus: () => void
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  function TipTapEditor({ content = "", onChange, editable = true, placeholder = "Start writing your chapter...", editor: externalEditor }, ref) {
    const internalEditorRef = useRef<Editor | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    // Use external editor if provided, otherwise create internal
    const internalEditor = useTiptapEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        Underline,
      ],
      content: content || "",
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
        },
      },
    })

    // Use either external or internal editor
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
      }
    }))

    // Sync content changes from parent
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "")
      }
    }, [content, editor])

    if (!editor) {
      return (
        <div className="border rounded-lg min-h-[400px] flex items-center justify-center bg-gray-50">
          <span className="text-gray-500">Loading editor...</span>
        </div>
      )
    }

    return (
      <div className="min-h-[400px]">
        <EditorContent
          editor={editor}
          className="min-h-[400px]"
        />
      </div>
    )
  }
)
