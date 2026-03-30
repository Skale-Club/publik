import type { PaperInkCombo } from "./trim-sizes"

export interface PaperInkComboSpec {
  key: PaperInkCombo
  paper: "white" | "cream"
  ink: "bw" | "standard-color" | "premium-color"
  minPages: number
  label: string
  description: string
}

export const PAPER_INK_COMBOS: PaperInkComboSpec[] = [
  { key: "bw-white", paper: "white", ink: "bw", minPages: 24, label: "Black & White on White", description: "Standard black and white printing on white paper. Cheapest option." },
  { key: "bw-cream", paper: "cream", ink: "bw", minPages: 24, label: "Black & White on Cream", description: "Black and white printing on cream-colored paper. Premium feel." },
  { key: "standard-color-white", paper: "white", ink: "standard-color", minPages: 72, label: "Standard Color on White", description: "Standard quality color printing on white paper." },
  { key: "premium-color-white", paper: "white", ink: "premium-color", minPages: 24, label: "Premium Color on White", description: "High quality color printing on white paper. Most expensive." },
]
