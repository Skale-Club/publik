'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Archive, Loader2 } from 'lucide-react'

interface ZipDownloadButtonProps {
  bookId: string
  bookTitle?: string
}

/**
 * ZIP download button component
 * Downloads all KDP-ready files in one package
 */
export function ZipDownloadButton({ bookId, bookTitle }: ZipDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDownload = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/download/zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ZIP package')
      }
      
      // Get the blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${bookTitle?.replace(/[^a-z0-9]/gi, '_') || 'book'}-kdp-files.zip`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      toast.success('ZIP package downloaded successfully')
    } catch (error) {
      console.error('ZIP download error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download ZIP package')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="
        flex items-center justify-center gap-3
        px-6 py-4
        bg-blue-600 text-white
        rounded-lg
        font-medium
        hover:bg-blue-700
        active:scale-[0.98]
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-[1.02]
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Creating package...</span>
        </>
      ) : (
        <>
          <Archive className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Download ZIP Package</div>
            <div className="text-sm text-blue-100 font-normal">
              Includes interior.pdf, cover.pdf, and KDP checklist
            </div>
          </div>
        </>
      )}
    </button>
  )
}
