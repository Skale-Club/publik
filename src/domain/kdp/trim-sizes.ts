export type PaperInkCombo =
  | "bw-white"
  | "bw-cream"
  | "standard-color-white"
  | "premium-color-white"

export interface TrimSize {
  id: string
  label: string
  widthIn: number
  heightIn: number
  widthCm: number
  heightCm: number
  isLarge: boolean
  maxPages: Record<PaperInkCombo, number>
}

export const KDP_TRIM_SIZES: TrimSize[] = [
  { id: "5x8", label: '5" × 8"', widthIn: 5, heightIn: 8, widthCm: 12.7, heightCm: 20.32, isLarge: false, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "5.06x7.81", label: '5.06" × 7.81"', widthIn: 5.0625, heightIn: 7.8125, widthCm: 12.85, heightCm: 19.84, isLarge: false, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "5.25x8", label: '5.25" × 8"', widthIn: 5.25, heightIn: 8, widthCm: 13.34, heightCm: 20.32, isLarge: false, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "5.5x8.5", label: '5.5" × 8.5"', widthIn: 5.5, heightIn: 8.5, widthCm: 13.97, heightCm: 21.59, isLarge: false, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "6x9", label: '6" × 9"', widthIn: 6, heightIn: 9, widthCm: 15.24, heightCm: 22.86, isLarge: false, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "6.14x9.21", label: '6.14" × 9.21"', widthIn: 6.125, heightIn: 9.25, widthCm: 15.6, heightCm: 23.39, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "6.69x9.61", label: '6.69" × 9.61"', widthIn: 6.6875, heightIn: 9.625, widthCm: 16.99, heightCm: 24.41, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "7x10", label: '7" × 10"', widthIn: 7, heightIn: 10, widthCm: 17.78, heightCm: 25.4, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "7.44x9.69", label: '7.44" × 9.69"', widthIn: 7.4375, heightIn: 9.6875, widthCm: 18.9, heightCm: 24.61, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "7.5x9.25", label: '7.5" × 9.25"', widthIn: 7.5, heightIn: 9.25, widthCm: 19.05, heightCm: 23.5, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "8x10", label: '8" × 10"', widthIn: 8, heightIn: 10, widthCm: 20.32, heightCm: 25.4, isLarge: true, maxPages: { "bw-white": 828, "bw-cream": 776, "standard-color-white": 600, "premium-color-white": 828 } },
  { id: "8.25x6", label: '8.25" × 6"', widthIn: 8.25, heightIn: 6, widthCm: 20.96, heightCm: 15.24, isLarge: true, maxPages: { "bw-white": 800, "bw-cream": 750, "standard-color-white": 600, "premium-color-white": 800 } },
  { id: "8.25x8.25", label: '8.25" × 8.25"', widthIn: 8.25, heightIn: 8.25, widthCm: 20.96, heightCm: 20.96, isLarge: true, maxPages: { "bw-white": 800, "bw-cream": 750, "standard-color-white": 600, "premium-color-white": 800 } },
  { id: "8.5x8.5", label: '8.5" × 8.5"', widthIn: 8.5, heightIn: 8.5, widthCm: 21.59, heightCm: 21.59, isLarge: true, maxPages: { "bw-white": 590, "bw-cream": 550, "standard-color-white": 600, "premium-color-white": 590 } },
  { id: "8.5x11", label: '8.5" × 11"', widthIn: 8.5, heightIn: 11, widthCm: 21.59, heightCm: 27.94, isLarge: true, maxPages: { "bw-white": 590, "bw-cream": 550, "standard-color-white": 600, "premium-color-white": 590 } },
  { id: "8.27x11.69", label: '8.27" × 11.69" (A4)', widthIn: 8.27, heightIn: 11.69, widthCm: 21, heightCm: 29.7, isLarge: true, maxPages: { "bw-white": 780, "bw-cream": 730, "standard-color-white": 0, "premium-color-white": 590 } },
]
