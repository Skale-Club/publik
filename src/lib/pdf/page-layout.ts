/**
 * Page Layout Utilities for KDP Trim Sizes
 * Converts KDP trim size IDs to PDF page dimensions in points
 * 1 inch = 72 points
 */

import { KDP_TRIM_SIZES, type TrimSize } from "@/domain/kdp/trim-sizes"

/**
 * Page dimensions in points for @react-pdf/renderer
 */
export interface PageDimensions {
  width: number
  height: number
}

/**
 * Convert KDP trim size ID to page dimensions in points
 * @param trimSizeId - KDP trim size ID (e.g., "6x9", "5x8", "8.5x11")
 * @returns Page dimensions in points { width, height }
 * @throws Error if trim size not found
 */
export function getPageDimensions(trimSizeId: string): PageDimensions {
  const trimSize = KDP_TRIM_SIZES.find((size) => size.id === trimSizeId)

  if (!trimSize) {
    throw new Error(`Unknown trim size: ${trimSizeId}`)
  }

  // Convert inches to points (1 inch = 72 points)
  const widthPoints = trimSize.widthIn * 72
  const heightPoints = trimSize.heightIn * 72

  return {
    width: widthPoints,
    height: heightPoints,
  }
}

/**
 * Get display label for a KDP trim size
 * @param trimSizeId - KDP trim size ID
 * @returns Display label (e.g., '6" × 9"')
 */
export function getTrimSizeLabel(trimSizeId: string): string {
  const trimSize = KDP_TRIM_SIZES.find((size) => size.id === trimSizeId)

  if (!trimSize) {
    return "Unknown"
  }

  return trimSize.label
}

/**
 * Check if a trim size ID is valid
 * @param trimSizeId - KDP trim size ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidTrimSize(trimSizeId: string): boolean {
  return KDP_TRIM_SIZES.some((size) => size.id === trimSizeId)
}

/**
 * Get all available trim sizes
 * @returns Array of all KDP trim sizes
 */
export function getAllTrimSizes(): TrimSize[] {
  return KDP_TRIM_SIZES
}

/**
 * Check if a trim size is considered "large" (affects page count limits)
 * @param trimSizeId - KDP trim size ID
 * @returns true if large trim size, false otherwise
 */
export function isLargeTrimSize(trimSizeId: string): boolean {
  const trimSize = KDP_TRIM_SIZES.find((size) => size.id === trimSizeId)
  return trimSize?.isLarge ?? false
}

/**
 * Get maximum page count for a given trim size and paper type
 * @param trimSizeId - KDP trim size ID
 * @param paperInkCombo - Paper and ink combination
 * @returns Maximum page count or 0 if invalid
 */
export function getMaxPageCount(
  trimSizeId: string,
  paperInkCombo: "bw-white" | "bw-cream" | "standard-color-white" | "premium-color-white"
): number {
  const trimSize = KDP_TRIM_SIZES.find((size) => size.id === trimSizeId)

  if (!trimSize) {
    return 0
  }

  return trimSize.maxPages[paperInkCombo] ?? 0
}