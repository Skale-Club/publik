/**
 * Client-side image validation for cover uploads
 * Uses browser Image API to get actual dimensions
 */

export interface ValidationResult {
  valid: boolean
  width?: number
  height?: number
  error?: string
}

/**
 * Validate an image file meets minimum dimension requirements
 * 
 * @param file - The image file to validate
 * @param minWidth - Minimum required width in pixels
 * @param minHeight - Minimum required height in pixels
 * @returns Validation result with dimensions if valid
 */
export function validateCoverImage(
  file: File,
  minWidth: number,
  minHeight: number
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    // Check file type first
    const allowedTypes = ["image/jpeg", "image/png", "image/tiff", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `Invalid file type. Allowed: JPEG, PNG, TIFF, WebP`,
      })
      return
    }

    // Check file size (KDP max is 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: `File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      })
      return
    }

    // Load image to get dimensions
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      if (img.width >= minWidth && img.height >= minHeight) {
        resolve({
          valid: true,
          width: img.width,
          height: img.height,
        })
      } else {
        resolve({
          valid: false,
          width: img.width,
          height: img.height,
          error: `Image must be at least ${minWidth}×${minHeight}px. Your image is ${img.width}×${img.height}px`,
        })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        valid: false,
        error: "Could not load image. Please try a different file.",
      })
    }

    img.src = objectUrl
  })
}

/**
 * Get allowed MIME types for KDP cover images
 */
export function getAllowedCoverTypes(): string[] {
  return ["image/jpeg", "image/png", "image/tiff", "image/webp"]
}

/**
 * Get allowed file extensions for display
 */
export function getAllowedExtensions(): string {
  return "JPEG, PNG, TIFF, or WebP"
}
