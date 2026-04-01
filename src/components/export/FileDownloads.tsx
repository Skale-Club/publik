'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  FileText,
  Image
} from 'lucide-react'
import { downloadFile, getFileDownloadUrl, type ValidationStatus } from '@/lib/export/file-download'

interface FileDownloadsProps {
  bookId: string
  bookTitle?: string
}

interface FileConfig {
  label: string
  key: string
  description: string
  endpoint: string
  filename: string
  icon: React.ReactNode
}

export function FileDownloads({ bookId, bookTitle }: FileDownloadsProps) {
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({
    interior: 'pending',
    cover: 'pending'
  })

  const fetchValidation = useCallback(async () => {
    try {
      const res = await fetch(`/api/validate?bookId=${encodeURIComponent(bookId)}`)
      if (!res.ok) return
      const data = await res.json()

      setValidationStatus({
        interior: data.interior?.valid
          ? (data.interior.warnings?.length > 0 ? 'warning' : 'valid')
          : 'error',
        cover: data.cover?.valid
          ? (data.cover.warnings?.length > 0 ? 'warning' : 'valid')
          : (data.cover?.issues?.length > 0 ? 'error' : 'pending')
      })
    } catch {
      // Leave current status as-is on network error
    }
  }, [bookId])

  useEffect(() => {
    fetchValidation()
  }, [fetchValidation])

  const files: FileConfig[] = [
    {
      label: 'Interior PDF',
      key: 'interior',
      description: 'The main book content formatted for KDP',
      endpoint: '/api/generate/pdf',
      filename: `${bookTitle || 'book'}-interior.pdf`,
      icon: <FileText className="w-5 h-5" />
    },
    {
      label: 'Cover PDF',
      key: 'cover',
      description: 'The book cover with spine formatted for KDP',
      endpoint: '/api/generate/cover',
      filename: `${bookTitle || 'book'}-cover.pdf`,
      icon: <Image className="w-5 h-5" />
    }
  ]

  const handleDownload = async (file: FileConfig) => {
    setLoadingState(prev => ({ ...prev, [file.label]: true }))
    
    try {
      const url = getFileDownloadUrl(file.endpoint, bookId)
      await downloadFile(url, file.filename)
      toast.success(`${file.label} downloaded successfully`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(`Failed to download ${file.label}. Please try again.`)
    } finally {
      setLoadingState(prev => ({ ...prev, [file.label]: false }))
    }
  }

  const getStatusIcon = (status: ValidationStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
      default:
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {files.map((file) => {
          const isLoading = loadingState[file.label]
          const status = validationStatus[file.key]
          
          return (
            <button
              key={file.label}
              onClick={() => handleDownload(file)}
              disabled={isLoading}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex-shrink-0 mt-1 text-gray-600">
                {file.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{file.label}</span>
                  {getStatusIcon(status)}
                </div>
                <p className="text-sm text-gray-500 mt-1">{file.description}</p>
                
                {isLoading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating file...</span>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
