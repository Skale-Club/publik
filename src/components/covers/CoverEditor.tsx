"use client"

import { useState, useEffect } from "react"
import { CoverUploader } from "./CoverUploader"
import { BackCoverInput } from "./BackCoverInput"
import { CoverValidationStatus } from "./CoverValidationStatus"
import { getCover, saveFrontCover, getBook, type CoverData, type BookData } from "@/server/actions/covers"
import { getChapters } from "@/app/(dashboard)/books/[bookId]/actions"
import { validateCoverForKDP, type CoverValidationResult } from "@/lib/covers"
import { estimatePageCount } from "@/lib/pdf/page-count"

interface CoverEditorProps {
  bookId: string
}

export function CoverEditor({ bookId }: CoverEditorProps) {
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [coverData, setCoverData] = useState<CoverData | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frontValidation, setFrontValidation] = useState<CoverValidationResult | null>(null)

  // Load book and cover data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load book settings
        const book = await getBook(bookId)
        setBookData(book)

        // Load cover data
        const cover = await getCover(bookId)
        setCoverData(cover)

        const chapters = await getChapters(bookId)
        setPageCount(estimatePageCount(chapters.map((c) => c.content ?? "")))
      } catch (err) {
        console.error("Failed to load data:", err)
        setError("Failed to load book data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [bookId])

  const handleFrontCoverUpload = async (url: string, width: number, height: number) => {
    if (!bookData) return

    if (!url) {
      // Cover removed
      setFrontValidation(null)
      return
    }

    // Validate against KDP
    const validation = validateCoverForKDP(
      url,
      width,
      height,
      bookData.trimSizeId,
      pageCount,
      bookData.paperType
    )
    setFrontValidation(validation)

    // Save to database
    if (validation.valid || validation.warnings.length > 0) {
      await saveFrontCover(bookId, url, width, height)
    }
  }

  const handleBackCoverSave = () => {
    // Reload cover data to get updated back cover info
    async function reload() {
      const cover = await getCover(bookId)
      setCoverData(cover)
    }
    reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!bookData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Book not found</div>
      </div>
    )
  }

  return (
    <div className="cover-editor space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cover</h1>
        {bookData.title && <p className="text-gray-600 mt-1">{bookData.title}</p>}
      </div>

      {/* Two-column layout on desktop, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Front Cover Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Front Cover</h2>
          <CoverUploader
            bookId={bookId}
            trimSizeId={bookData.trimSizeId}
            pageCount={pageCount}
            paperType={bookData.paperType}
            currentCoverUrl={coverData?.frontCoverUrl || undefined}
            onUploadComplete={handleFrontCoverUpload}
          />
        </div>

        {/* Back Cover Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Back Cover</h2>
          <BackCoverInput
            bookId={bookId}
            trimSizeId={bookData.trimSizeId}
            initialType={coverData?.backCoverType as "image" | "text" | undefined}
            initialImageUrl={coverData?.backCoverImageUrl || undefined}
            initialText={coverData?.backCoverText || undefined}
            onSave={handleBackCoverSave}
          />
        </div>
      </div>

      {/* Validation Status */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">KDP Validation Status</h2>
        <div className="space-y-4">
          {frontValidation && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Front Cover</p>
              <CoverValidationStatus validationResult={frontValidation} />
            </div>
          )}
          
          {(!frontValidation && coverData?.frontCoverUrl) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">Front cover uploaded and validated</p>
            </div>
          )}
          
          {(!frontValidation && !coverData?.frontCoverUrl) && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600">Upload a front cover to see validation status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}