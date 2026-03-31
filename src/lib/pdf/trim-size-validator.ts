/**
 * Trim Size Validator
 * Validates that PDF dimensions match KDP trim size specifications
 */

import { KDP_TRIM_SIZES, type TrimSize } from "@/domain/kdp/trim-sizes"
import { getPageDimensions, getTrimSizeLabel } from "./page-layout"

/**
 * Expected dimensions result
 */
export interface TrimSizeDimensions {
  width: number // in points
  height: number // in points
  widthIn: number // in inches
  heightIn: number // in inches
}

/**
 * Validation result
 */
export interface TrimSizeValidation {
  valid: boolean
  expected: TrimSizeDimensions
  actual?: TrimSizeDimensions
  match: boolean
  message?: string
}

/**
 * Get expected dimensions for a trim size
 * @param trimSizeId - KDP trim size ID
 * @returns Expected dimensions in points and inches
 */
export function getExpectedDimensions(trimSizeId: string): TrimSizeDimensions | null {
  const trimSize = KDP_TRIM_SIZES.find((size) => size.id === trimSizeId)

  if (!trimSize) {
    return null
  }

  return {
    width: trimSize.widthIn * 72,
    height: trimSize.heightIn * 72,
    widthIn: trimSize.widthIn,
    heightIn: trimSize.heightIn,
  }
}

/**
 * Validate that PDF dimensions match KDP specification
 * @param trimSizeId - KDP trim size ID to validate
 * @returns Validation result
 */
export function validateTrimSize(trimSizeId: string): TrimSizeValidation {
  // Get expected dimensions from KDP spec
  const expected = getExpectedDimensions(trimSizeId)

  if (!expected) {
    return {
      valid: false,
      expected: { width: 0, height: 0, widthIn: 0, heightIn: 0 },
      match: false,
      message: `Unknown trim size: ${trimSizeId}`,
    }
  }

  // Get actual dimensions from page-layout
  let actual: TrimSizeDimensions
  try {
    const dimensions = getPageDimensions(trimSizeId)
    actual = {
      width: dimensions.width,
      height: dimensions.height,
      widthIn: dimensions.width / 72,
      heightIn: dimensions.height / 72,
    }
  } catch (error) {
    return {
      valid: false,
      expected,
      match: false,
      message: `Error getting page dimensions: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }

  // Check if dimensions match
  const match = actual.width === expected.width && actual.height === expected.height

  return {
    valid: true,
    expected,
    actual,
    match,
    message: match ? "Dimensions match KDP specification" : "Dimensions do not match KDP specification",
  }
}

/**
 * Get all valid trim size IDs
 * @returns Array of valid trim size IDs
 */
export function getValidTrimSizeIds(): string[] {
  return KDP_TRIM_SIZES.map((size) => size.id)
}

/**
 * Get all trim sizes with labels
 * @returns Array of trim size info
 */
export function getTrimSizeOptions(): Array<{ id: string; label: string }> {
  return KDP_TRIM_SIZES.map((size) => ({
    id: size.id,
    label: size.label,
  }))
}

/**
 * Validate all 16 KDP trim sizes
 * @returns Array of validation results for all trim sizes
 */
export function validateAllTrimSizes(): TrimSizeValidation[] {
  return KDP_TRIM_SIZES.map((size) => validateTrimSize(size.id))
}
