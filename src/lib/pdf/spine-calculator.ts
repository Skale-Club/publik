// KDP Spine width calculation module
// Provides accurate spine width calculations with unit conversions and validation

import { MIN_PAGES_FOR_SPINE_TEXT } from "@/domain/kdp/spine-width"

export type PaperType = "white" | "cream" | "premium-color" | "standard-color"

export interface SpineWidthResult {
  widthInches: number
  widthMm: number
  widthPoints: number
  canHaveSpineText: boolean
  warnings: string[]
}

// KDP spine width formula: inches per page by paper type
const SPINE_WIDTH_PER_PAGE: Record<PaperType, number> = {
  white: 0.002252,
  cream: 0.0025,
  "premium-color": 0.002347,
  "standard-color": 0.002252,
}

// Minimum pages for KDP publishing
export const MIN_PAGES_FOR_PUBLISHING = 24

/**
 * Calculate spine width with all unit conversions and validation
 * @param pageCount - Number of pages in the book
 * @param paperType - Paper type (white, cream, premium-color, standard-color)
 * @returns SpineWidthResult with width in inches, mm, points, plus validation
 */
export function calculateSpineWidth(
  pageCount: number,
  paperType: PaperType
): SpineWidthResult {
  const warnings: string[] = []

  // Check for minimum page count warning
  if (pageCount < MIN_PAGES_FOR_PUBLISHING) {
    warnings.push(
      `Page count (${pageCount}) is below KDP minimum of ${MIN_PAGES_FOR_PUBLISHING} pages`
    )
  }

  // Calculate spine width in inches
  const perPage = SPINE_WIDTH_PER_PAGE[paperType] ?? SPINE_WIDTH_PER_PAGE.white
  const widthInches = pageCount * perPage

  // Convert to other units (1 inch = 25.4 mm = 72 points)
  const widthMm = widthInches * 25.4
  const widthPoints = widthInches * 72

  // Check if spine text is allowed (80+ pages)
  const canHaveSpineText = pageCount >= MIN_PAGES_FOR_SPINE_TEXT + 1

  return {
    widthInches: Math.round(widthInches * 10000) / 10000,
    widthMm: Math.round(widthMm * 100) / 100,
    widthPoints: Math.round(widthPoints * 100) / 100,
    canHaveSpineText,
    warnings,
  }
}