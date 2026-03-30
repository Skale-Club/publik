export type CoverFinish = "glossy" | "matte"

export interface CoverFinishOption {
  value: CoverFinish
  label: string
  description: string
}

export const COVER_FINISHES: CoverFinishOption[] = [
  { value: "glossy", label: "Glossy", description: "Shiny, vibrant colors" },
  { value: "matte", label: "Matte", description: "Smooth, non-reflective" },
]
