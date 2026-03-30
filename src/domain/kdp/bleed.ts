export const BLEED_AMOUNT_IN = 0.125
export const BLEED_AMOUNT_MM = 3.2

export interface PageDimensions {
  widthIn: number
  heightIn: number
}

export function getInteriorPageDimensions(
  trimWidthIn: number,
  trimHeightIn: number,
  hasBleed: boolean
): PageDimensions {
  if (!hasBleed) {
    return { widthIn: trimWidthIn, heightIn: trimHeightIn }
  }
  return {
    widthIn: trimWidthIn + BLEED_AMOUNT_IN,
    heightIn: trimHeightIn + BLEED_AMOUNT_IN * 2,
  }
}
