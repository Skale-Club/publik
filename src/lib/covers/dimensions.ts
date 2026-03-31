/**
 * KDP Cover Dimension Calculations
 * Based on Amazon KDP specifications for cover dimensions
 * https://creativeparamita.com/book-cover/kdp-cover-size-guide-2025/
 */

export interface CoverDimensions {
  width: number    // Full cover width in pixels (at 300 DPI)
  height: number   // Full cover height in pixels (at 300 DPI)
  trimWidth: number   // Trim width in inches
  trimHeight: number  // Trim height in inches
  bleed: number    // Bleed in inches (0.125")
  spineWidth: number  // Spine width in inches
}

/**
 * KDP trim sizes supported
 */
export const TRIM_SIZES: Record<string, { width: number; height: number }> = {
  "5x8": { width: 5, height: 8 },
  "5.5x8.5": { width: 5.5, height: 8.5 },
  "6x9": { width: 6, height: 9 },
  "8.5x11": { width: 8.5, height: 11 },
}

/**
 * Spine width formulas based on paper type (KDP specifications)
 * Formula: Page Count × coefficient = Spine width in inches
 */
export const SPINE_FORMULAS: Record<string, number> = {
  white: 0.002252,   // B&W interior white paper
  cream: 0.0025,     // B&W interior cream paper
  "standard-color": 0.002347,  // Standard color interior
  "premium-color": 0.002347,  // Premium color interior
}

/**
 * Default trim size if not recognized
 */
const DEFAULT_TRIM_SIZE = "6x9"

/**
 * Calculate minimum cover dimensions for KDP
 * 
 * Cover Width = Bleed + Back Cover + Spine + Front Cover + Bleed
 * Cover Height = Bleed + Trim Height + Bleed
 * 
 * @param trimSizeId - The trim size ID (e.g., "6x9", "5x8")
 * @param pageCount - Number of pages in the book
 * @param paperType - Paper type ("white", "cream", "standard-color", "premium-color")
 * @returns Cover dimensions in pixels at 300 DPI
 */
export function calculateMinCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: "white" | "cream" | "standard-color" | "premium-color" = "white"
): CoverDimensions {
  // Get trim dimensions
  const trim = TRIM_SIZES[trimSizeId] || TRIM_SIZES[DEFAULT_TRIM_SIZE]
  
  // Get bleed (0.125" on all sides per KDP spec)
  const bleed = 0.125
  
  // Calculate spine width based on paper type
  const spineCoefficient = SPINE_FORMULAS[paperType] || SPINE_FORMULAS.white
  const spineWidth = Math.max(0, pageCount * spineCoefficient)
  
  // Calculate full cover dimensions in inches
  const coverWidthInches = bleed + trim.width + spineWidth + trim.width + bleed
  const coverHeightInches = bleed + trim.height + bleed
  
  // Convert to pixels at 300 DPI (KDP minimum)
  const DPI = 300
  
  return {
    width: Math.round(coverWidthInches * DPI),
    height: Math.round(coverHeightInches * DPI),
    trimWidth: trim.width,
    trimHeight: trim.height,
    bleed,
    spineWidth,
  }
}

/**
 * Get back cover minimum dimensions
 * Back cover is typically smaller - just needs to match the back portion
 * 
 * @param trimSizeId - The trim size ID
 * @returns Minimum dimensions in pixels at 300 DPI
 */
export function getBackCoverMinDimensions(
  trimSizeId: string
): { width: number; height: number } {
  const trim = TRIM_SIZES[trimSizeId] || TRIM_SIZES[DEFAULT_TRIM_SIZE]
  const bleed = 0.125
  const DPI = 300
  
  // Back cover = bleed + trim + spine connection area (0.125")
  const backCoverWidthInches = bleed + trim.width + 0.125
  const coverHeightInches = bleed + trim.height + bleed
  
  return {
    width: Math.round(backCoverWidthInches * DPI),
    height: Math.round(coverHeightInches * DPI),
  }
}

/**
 * Format dimensions for display
 * 
 * @param dimensions - Cover dimensions
 * @returns Formatted string like "2550×3900px"
 */
export function formatDimensions(dimensions: CoverDimensions): string {
  return `${dimensions.width}×${dimensions.height}px`
}

/**
 * Get minimum DPI recommendation text
 */
export function getDPIRecommendation(): string {
  return "300 DPI minimum (600 DPI recommended)"
}
