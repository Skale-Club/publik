"use client"

import { useRef, useState } from "react"
import { Upload, FileText, FileType, Image as ImageIcon, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { clsx } from "clsx"

interface FileImportButtonProps {
  onDocxSelect?: (file: File) => void
  onPdfSelect?: (file: File) => void
  onImageSelect?: (file: File) => void
  onContentLoaded?: (html: string) => void
  onImageInsert?: (base64: string) => void
}

export function FileImportButton({
  onDocxSelect,
  onPdfSelect,
  onImageSelect,
  onContentLoaded,
  onImageInsert,
}: FileImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle")

  // File input refs
  const docxInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleDocxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadState("uploading")
    setIsOpen(false)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import/docx", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import DOCX")
      }

      onDocxSelect?.(file)
      onContentLoaded?.(data.html)
      toast.success("DOCX imported successfully")
    } catch (error) {
      console.error("DOCX import error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import DOCX")
      setUploadState("error")
    } finally {
      setUploadState("idle")
      // Reset input
      if (docxInputRef.current) {
        docxInputRef.current.value = ""
      }
    }
  }

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadState("uploading")
    setIsOpen(false)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import/pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import PDF")
      }

      onPdfSelect?.(file)
      onContentLoaded?.(data.html)
      toast.success("PDF imported successfully")
    } catch (error) {
      console.error("PDF import error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import PDF")
      setUploadState("error")
    } finally {
      setUploadState("idle")
      // Reset input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = ""
      }
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsOpen(false)

    // Validate image
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please select JPG, PNG, or WebP.")
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 10MB.")
      return
    }

    // Convert to base64
    try {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        onImageSelect?.(file)
        onImageInsert?.(base64)
        toast.success("Image inserted")
      }
      reader.onerror = () => {
        toast.error("Failed to read image file")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Image conversion error:", error)
      toast.error("Failed to process image")
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  return (
    <div className="relative">
      {/* Hidden file inputs */}
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleDocxChange}
        className="hidden"
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePdfChange}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Import button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={uploadState === "uploading"}
        className={clsx(
          "flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors",
          uploadState === "uploading" && "opacity-50 cursor-not-allowed"
        )}
        title="Import file"
      >
        {uploadState === "uploading" ? (
          <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>Import</span>
        <ChevronDown className={clsx("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
          <button
            type="button"
            onClick={() => docxInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Import DOCX
          </button>
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <FileType className="w-4 h-4 text-red-600" />
            Import PDF
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <ImageIcon className="w-4 h-4 text-green-600" />
            Import Image
          </button>
        </div>
      )}
    </div>
  )
}
