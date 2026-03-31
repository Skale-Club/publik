"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { calculateMinCoverDimensions, validateCoverImage, getAllowedCoverTypes, getAllowedExtensions } from "@/lib/covers"

interface CoverUploaderProps {
  bookId: string
  trimSizeId: string
  pageCount: number
  paperType: "white" | "cream" | "standard-color" | "premium-color"
  currentCoverUrl?: string
  onUploadComplete: (url: string, width: number, height: number) => void
}

export function CoverUploader({
  bookId,
  trimSizeId,
  pageCount,
  paperType,
  currentCoverUrl,
  onUploadComplete,
}: CoverUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate required dimensions based on book settings
  const minDims = calculateMinCoverDimensions(trimSizeId, pageCount, paperType)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)
      setUploading(true)

      try {
        // Client-side validation first - get actual image dimensions
        const validation = await validateCoverImage(file, minDims.width, minDims.height)

        if (!validation.valid) {
          setError(validation.error || "Image does not meet minimum dimensions")
          setUploading(false)
          // Clear the input so user can select the same file again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          return
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        // Upload to server
        const formData = new FormData()
        formData.append("file", file)
        formData.append("bookId", bookId)
        formData.append("coverType", "front")

        const response = await fetch("/api/upload/cover", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Upload failed")
        }

        const { url } = await response.json()
        
        // Clean up preview object URL (we're now using server URL)
        URL.revokeObjectURL(objectUrl)
        setPreview(url)
        
        // Notify parent with the validated dimensions
        onUploadComplete(url, validation.width!, validation.height!)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        // Clear preview on error
        if (preview && preview !== currentCoverUrl) {
          URL.revokeObjectURL(preview)
        }
        setPreview(currentCoverUrl || null)
      } finally {
        setUploading(false)
      }
    },
    [bookId, minDims, onUploadComplete, currentCoverUrl, preview]
  )

  const handleRemove = useCallback(() => {
    setPreview(null)
    setError(null)
    onUploadComplete("", 0, 0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onUploadComplete])

  return (
    <div className="cover-uploader">
      <label className="block text-sm font-medium mb-2">
        Front Cover Image
        <span className="text-gray-500 text-xs ml-2">(min: {minDims.width}×{minDims.height}px)</span>
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        {preview ? (
          <div className="relative inline-block">
            <div className="relative w-[200px] h-[300px]">
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className="object-contain"
                sizes="200px"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              aria-label="Remove cover"
            >
              ×
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept={getAllowedCoverTypes().join(",")}
              onChange={handleFileChange}
              disabled={uploading}
              ref={fileInputRef}
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className="cursor-pointer text-blue-600 hover:underline inline-block"
            >
              {uploading ? "Uploading..." : "Click to upload cover image"}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {getAllowedExtensions()}. Minimum {minDims.width}×{minDims.height}px at 300 DPI.
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
