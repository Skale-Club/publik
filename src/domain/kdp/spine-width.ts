export const MIN_PAGES_FOR_SPINE_TEXT = 79

const SPINE_WIDTH_PER_PAGE: Record<string, number> = {
  white: 0.002252,
  cream: 0.0025,
  "premium-color": 0.002347,
  "standard-color": 0.002252,
}

export function calculateSpineWidth(
  pageCount: number,
  paperType: "white" | "cream" | "premium-color" | "standard-color"
): number {
  const perPage = SPINE_WIDTH_PER_PAGE[paperType]
  return pageCount * perPage
}
