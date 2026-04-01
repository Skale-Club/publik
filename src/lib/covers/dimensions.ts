import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"

export interface CoverDimensions {
  width: number
  height: number
  trimWidth: number
  trimHeight: number
  bleed: number
  spineWidth: number
}

export const TRIM_SIZES: Record<string, { width: number; height: number }> = Object.fromEntries(
  KDP_TRIM_SIZES.map((ts) => [ts.id, { width: ts.widthIn, height: ts.heightIn }])
)

export const SPINE_FORMULAS: Record<string, number> = {
  white: 0.002252,
  cream: 0.0025,
  "standard-color": 0.002347,
  "premium-color": 0.002347,
}

const DEFAULT_TRIM_SIZE = "6x9"

export function calculateMinCoverDimensions(
  trimSizeId: string,
  pageCount: number,
  paperType: "white" | "cream" | "standard-color" | "premium-color" = "white"
): CoverDimensions {
  const trim = TRIM_SIZES[trimSizeId] || TRIM_SIZES[DEFAULT_TRIM_SIZE]
  const bleed = 0.125
  const spineCoefficient = SPINE_FORMULAS[paperType] || SPINE_FORMULAS.white
  const spineWidth = Math.max(0, pageCount * spineCoefficient)

  const coverWidthInches = bleed + trim.width + spineWidth + trim.width + bleed
  const coverHeightInches = bleed + trim.height + bleed

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

export function getBackCoverMinDimensions(
  trimSizeId: string
): { width: number; height: number } {
  const trim = TRIM_SIZES[trimSizeId] || TRIM_SIZES[DEFAULT_TRIM_SIZE]
  const bleed = 0.125
  const DPI = 300

  const backCoverWidthInches = bleed + trim.width + 0.125
  const coverHeightInches = bleed + trim.height + bleed

  return {
    width: Math.round(backCoverWidthInches * DPI),
    height: Math.round(coverHeightInches * DPI),
  }
}

export function formatDimensions(dimensions: CoverDimensions): string {
  return `${dimensions.width}×${dimensions.height}px`
}

export function getDPIRecommendation(): string {
  return "300 DPI minimum (600 DPI recommended)"
}
