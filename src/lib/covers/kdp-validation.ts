/**
 * KDP Specification Validation for Covers
 * Validates cover images against Amazon KDP requirements
 */

import { CoverDimensions, calculateMinCoverDimensions, getBackCoverMinDimensions } from "./dimensions"

export interface CoverValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  details?: {
    requiredWidth: number
    requiredHeight: number
    actualWidth: number
    actualHeight: number
    trimSize: string
    pageCount: number
    paperType: string
  }
}

/**
 * Validate a front cover image against KDP specifications
 * 
 * @param coverUrl - URL of the cover image
 * @param coverWidth - Actual width in pixels
 * @param coverHeight - Actual height in pixels
 * @param trimSizeId - Book trim size
 * @param pageCount - Number of pages in the book
 * @param paperType - Paper type
 * @returns Validation result with errors and warnings
 */
export function validateCoverForKDP(
  coverUrl: string,
  coverWidth: number,
  coverHeight: number,
  trimSizeId: string,
  pageCount: number,
  paperType: "white" | "cream" | "standard-color" | "premium-color"
): CoverValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Calculate required dimensions
  const required: CoverDimensions = calculateMinCoverDimensions(trimSizeId, pageCount, paperType)

  // Check minimum dimensions
  if (coverWidth < required.width) {
    errors.push(`Cover width is too small. Required: ${required.width}px, Your cover: ${coverWidth}px`)
  }

  if (coverHeight < required.height) {
    errors.push(`Cover height is too small. Required: ${required.height}px, Your cover: ${coverHeight}px`)
  }

  // Add warnings for close to minimum
  const widthBuffer = (coverWidth - required.width) / required.width
  const heightBuffer = (coverHeight - required.height) / required.height

  if (widthBuffer < 0.1 && widthBuffer >= 0) {
    warnings.push("Cover width is very close to minimum. 600 DPI recommended for best print quality.")
  }

  if (heightBuffer < 0.1 && heightBuffer >= 0) {
    warnings.push("Cover height is very close to minimum. 600 DPI recommended for best print quality.")
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    details: {
      requiredWidth: required.width,
      requiredHeight: required.height,
      actualWidth: coverWidth,
      actualHeight: coverHeight,
      trimSize: trimSizeId,
      pageCount,
      paperType,
    },
  }
}

/**
 * Validate a back cover image against KDP specifications
 * 
 * @param coverUrl - URL of the back cover image
 * @param coverWidth - Actual width in pixels
 * @param coverHeight - Actual height in pixels
 * @param trimSizeId - Book trim size
 * @returns Validation result with errors and warnings
 */
export function validateBackCoverForKDP(
  coverUrl: string,
  coverWidth: number,
  coverHeight: number,
  trimSizeId: string
): CoverValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Calculate minimum back cover dimensions
  const required = getBackCoverMinDimensions(trimSizeId)

  // Check minimum dimensions
  if (coverWidth < required.width) {
    errors.push(`Back cover width is too small. Required: ${required.width}px, Your image: ${coverWidth}px`)
  }

  if (coverHeight < required.height) {
    errors.push(`Back cover height is too small. Required: ${required.height}px, Your image: ${coverHeight}px`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    details: {
      requiredWidth: required.width,
      requiredHeight: required.height,
      actualWidth: coverWidth,
      actualHeight: coverHeight,
      trimSize: trimSizeId,
      pageCount: 0,
      paperType: "N/A (back cover)",
    },
  }
}

/**
 * Validate a cover file format
 * 
 * @param fileType - MIME type of the file
 * @returns Validation result
 */
export function validateCoverFileType(fileType: string): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/tiff", "image/webp"]
  
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: JPEG, PNG, TIFF, WebP`,
    }
  }

  return { valid: true }
}

/**
 * Validate a cover file size
 * 
 * @param fileSize - File size in bytes
 * @returns Validation result
 */
export function validateCoverFileSize(fileSize: number): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024 // 50MB (KDP max)
  
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 50MB.`,
    }
  }

  return { valid: true }
}

/**
 * Format validation details for display
 * 
 * @param details - Validation details
 * @returns Formatted string
 */
export function formatValidationDetails(details: CoverValidationResult["details"]): string {
  if (!details) return ""
  
  return `Required: ${details.requiredWidth}×${details.requiredHeight}px, Your cover: ${details.actualWidth}×${details.actualHeight}px`
}