// KDP Cover dimension calculation module
// Calculates full cover dimensions including bleed, spine, front and back covers

import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"
import { calculateSpineWidth, type PaperType } from "./spine-calculator"

export interface CoverDimensions {
  totalWidth: number // in points
  totalHeight: number // in points
  bleedSize: number // in points (9pt = 0.125")
  spineWidth: number // in points
  backCoverWidth: number // in points
  frontCoverWidth: number // in points
  trimWidth: number // in points
  trimHeight: number // in points
}

// KDP bleed size: 0.125 inches = 9 points
export const BLEED_SIZE_POINTS = 9

/**
 * Calculate full cover dimensions for KDP
 * @param trimSizeId - KDP trim size ID (e.g., "5x8", "6x9")
 * @param pageCount - Number of pages in the book
 * @param paperType - Paper type for spine calculation
 * @returns CoverDimensions with all measurements in points
 */
export function calculateCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: PaperType
): CoverDimensions {
  // Find trim size
  const trimSize = KDP_TRIM_SIZES.find((t) => t.id === trimSizeId)
  if (!trimSize) {
    throw new Error(`Unknown trim size: ${trimSizeId}`)
  }

  // Convert trim dimensions to points (1 inch = 72 points)
  const trimWidth = trimSize.widthIn * 72
  const trimHeight = trimSize.heightIn * 72

  // Calculate spine width in points
  const spineResult = calculateSpineWidth(pageCount, paperType)
  const spineWidthPoints = spineResult.widthPoints

  // Cover layout: [bleed][back cover][spine][front cover][bleed]
  // Each cover is the trim width
  const backCoverWidth = trimWidth
  const frontCoverWidth = trimWidth

  // Total dimensions
  const totalWidth = BLEED_SIZE_POINTS + backCoverWidth + spineWidthPoints + frontCoverWidth + BLEED_SIZE_POINTS
  const totalHeight = BLEED_SIZE_POINTS + trimHeight + BLEED_SIZE_POINTS

  return {
    totalWidth,
    totalHeight,
    bleedSize: BLEED_SIZE_POINTS,
    spineWidth: spineWidthPoints,
    backCoverWidth,
    frontCoverWidth,
    trimWidth,
    trimHeight,
  }
}