"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { validateCoverImage, getAllowedCoverTypes, getAllowedExtensions, getBackCoverMinDimensions } from "@/lib/covers"
import { saveBackCoverImage, saveBackCoverText } from "@/server/actions/covers"

interface BackCoverInputProps {
  bookId: string
  trimSizeId: string
  initialType?: "image" | "text"
  initialImageUrl?: string
  initialText?: string
  onSave?: () => void
}

export function BackCoverInput({
  bookId,
  trimSizeId,
  initialType = "text",
  initialImageUrl,
  initialText,
  onSave,
}: BackCoverInputProps) {
  const [coverType, setCoverType] = useState<"image" | "text">(initialType)
  const [text, setText] = useState(initialText || "")
  const [imageUrl, setImageUrl] = useState(initialImageUrl || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get minimum dimensions for back cover
  const minDims = getBackCoverMinDimensions(trimSizeId)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)
      setUploading(true)

      try {
        // Validate image dimensions
        const validation = await validateCoverImage(file, minDims.width, minDims.height)

        if (!validation.valid) {
          setError(validation.error || "Image does not meet minimum dimensions")
          setUploading(false)
          return
        }

        // Upload to server
        const formData = new FormData()
        formData.append("file", file)
        formData.append("bookId", bookId)
        formData.append("coverType", "back")

        const response = await fetch("/api/upload/cover", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Upload failed")
        }

        const { url } = await response.json()
        setImageUrl(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setUploading(false)
      }
    },
    [bookId, minDims]
  )

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      if (coverType === "image") {
        if (!imageUrl) {
          setError("Please upload a back cover image")
          setSaving(false)
          return
        }
        const result = await saveBackCoverImage(bookId, imageUrl)
        if (!result.success) {
          setError(result.error || "Failed to save")
          setSaving(false)
          return
        }
      } else {
        const result = await saveBackCoverText(bookId, text)
        if (!result.success) {
          setError(result.error || "Failed to save")
          setSaving(false)
          return
        }
      }

      onSave?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleTypeChange = (newType: "image" | "text") => {
    setCoverType(newType)
    setError(null)
  }

  return (
    <div className="back-cover-input space-y-4">
      <label className="block text-sm font-medium mb-2">Back Cover</label>

      {/* Mode Toggle */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="backCoverType"
            checked={coverType === "text"}
            onChange={() => handleTypeChange("text")}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">Text Back Cover</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="backCoverType"
            checked={coverType === "image"}
            onChange={() => handleTypeChange("image")}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm">Image Back Cover</span>
        </label>
      </div>

      {/* Text Mode */}
      {coverType === "text" && (
        <div>
          <label className="block text-sm font-medium mb-2">Back Cover Description</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your back cover text (author bio, book blurb, etc.)"
          />
          <p className="text-xs text-gray-500 mt-1">
            This text will appear on the back cover of your book.
          </p>
        </div>
      )}

      {/* Image Mode */}
      {coverType === "image" && (
        <div>
          <input
            type="file"
            accept={getAllowedCoverTypes().join(",")}
            onChange={handleFileChange}
            disabled={uploading}
            ref={fileInputRef}
            className="hidden"
            id="back-cover-upload"
          />
          
          {imageUrl ? (
            <div className="relative inline-block">
              <div className="relative w-[200px] h-[300px] border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Back cover preview"
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageUrl("")
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              htmlFor="back-cover-upload"
              className="cursor-pointer text-blue-600 hover:underline inline-block"
            >
              {uploading ? "Uploading..." : "Click to upload back cover image"}
            </label>
          )}
          
          {imageUrl && (
            <p className="text-xs text-gray-500 mt-2">
              Min: {minDims.width}×{minDims.height}px. {getAllowedExtensions()}.
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || (coverType === "image" && !imageUrl)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Back Cover"}
      </button>
    </div>
  )
}
