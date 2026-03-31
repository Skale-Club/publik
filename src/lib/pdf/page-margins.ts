/**
 * Page Margins for KDP PDF Generation
 * Converts KDP margin specifications to @react-pdf/renderer format
 * 1 inch = 72 points
 */

import { getMargins, type MarginSet, type BleedSetting } from "@/domain/kdp/margins"

/**
 * PDF margin format for @react-pdf/renderer
 */
export interface PDFMargins {
  top: number
  bottom: number
  left: number
  right: number
}

/**
 * Convert KDP margin settings to PDF margins
 * @param pageCount - Total page count for calculating inside margin
 * @param bleedSetting - Bleed setting (bleed or no-bleed)
 * @returns PDF margins in points
 */
export function getPDFMargins(pageCount: number, bleedSetting: BleedSetting): PDFMargins {
  // Get KDP margin set
  const marginSet: MarginSet = getMargins(pageCount, bleedSetting)

  // Convert inches to points (1 inch = 72 points)
  // Using the outsideIn for both left/right (simplified for v1)
  // @react-pdf/renderer doesn't automatically handle odd/even page mirroring
  return {
    top: marginSet.topIn * 72,
    bottom: marginSet.bottomIn * 72,
    left: marginSet.insideIn * 72, // Use inside margin for left
    right: marginSet.outsideIn * 72, // Use outside margin for right
  }
}

/**
 * Apply margins to a page style object
 * @param pageCount - Total page count for calculating inside margin
 * @param bleedSetting - Bleed setting
 * @returns Style object for @react-pdf/renderer Page component
 */
export function applyMarginsToPage(
  pageCount: number,
  bleedSetting: BleedSetting
): { style: { paddingTop: number; paddingBottom: number; paddingLeft: number; paddingRight: number } } {
  const margins = getPDFMargins(pageCount, bleedSetting)
  return {
    style: {
      paddingTop: margins.top,
      paddingBottom: margins.bottom,
      paddingLeft: margins.left,
      paddingRight: margins.right,
    },
  }
}

/**
 * Get margin summary for display
 * @param pageCount - Total page count
 * @param bleedSetting - Bleed setting
 * @returns Human-readable margin summary
 */
export function getMarginSummary(
  pageCount: number,
  bleedSetting: BleedSetting
): { inside: string; outside: string; top: string; bottom: string } {
  const marginSet: MarginSet = getMargins(pageCount, bleedSetting)
  return {
    inside: `${marginSet.insideIn}"`,
    outside: `${marginSet.outsideIn}"`,
    top: `${marginSet.topIn}"`,
    bottom: `${marginSet.bottomIn}"`,
  }
}
