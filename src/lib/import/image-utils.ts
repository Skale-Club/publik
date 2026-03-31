/**
 * Image utility functions for client-side image processing.
 */

/**
 * Validates an image file.
 * @param file - File object to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Valid MIME types
  const validTypes = ["image/jpeg", "image/png", "image/webp"]

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please select JPG, PNG, or WebP.",
    }
  }

  // Max size: 10MB
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    }
  }

  return { valid: true }
}

/**
 * Converts a File object to a base64 data URL.
 * @param file - File object to convert
 * @returns Promise<string> - Base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Extracts the base64 string from a data URL.
 * @param dataUrl - Full data URL (e.g., "data:image/png;base64,...")
 * @returns The base64 content without the prefix
 */
export function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(",")
  return parts.length > 1 ? parts[1] : dataUrl
}

/**
 * Gets the MIME type from a base64 data URL.
 * @param dataUrl - Full data URL
 * @returns MIME type (e.g., "image/png")
 */
export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/)
  return match ? match[1] : "image/png"
}
