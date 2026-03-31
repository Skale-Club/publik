/**
 * File Download Utilities
 * Helper functions for downloading generated files
 */

/**
 * Configuration for file downloads
 */
export interface DownloadConfig {
  endpoint: string
  bookId: string
  filename: string
}

/**
 * Downloads a file from the given URL and triggers browser download
 * @param url - URL to fetch the file from
 * @param filename - Name to save the file as
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
  }
  
  const blob = await response.blob()
  
  // Create a temporary link to trigger download
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  // Clean up
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(link)
}

/**
 * Constructs a download URL with query parameters
 * @param endpoint - API endpoint path
 * @param bookId - Book ID
 * @returns Full download URL
 */
export function getFileDownloadUrl(endpoint: string, bookId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}${endpoint}?bookId=${encodeURIComponent(bookId)}`
}

/**
 * Validation status for download buttons
 */
export type ValidationStatus = 'valid' | 'warning' | 'error' | 'pending'

/**
 * Get status icon and color based on validation status
 * @param status - Validation status
 * @returns CSS classes for the status indicator
 */
export function getStatusClasses(status: ValidationStatus): string {
  switch (status) {
    case 'valid':
      return 'text-green-600'
    case 'warning':
      return 'text-yellow-600'
    case 'error':
      return 'text-red-600'
    case 'pending':
    default:
      return 'text-gray-400'
  }
}
