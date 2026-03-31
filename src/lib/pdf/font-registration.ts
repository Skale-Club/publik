/**
 * Font Registration for KDP PDF Generation
 * Registers TTF fonts for embedding in PDF output
 */

import { Font } from "@react-pdf/renderer"

// Font sources - using CDN for bundled fonts
// For production, download and place TTF files in /public/fonts/
const FONT_SOURCES = {
  // Times Roman family
  "Times-Roman": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Times-Roman.ttf",
  "Times-Italic": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Times-Italic.ttf",
  "Times-Bold": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Times-Bold.ttf",
  "Times-BoldItalic": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Times-BoldItalic.ttf",

  // Helvetica family
  Helvetica: "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Helvetica.ttf",
  "Helvetica-Oblique": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Helvetica-Oblique.ttf",
  "Helvetica-Bold": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Helvetica-Bold.ttf",
  "Helvetica-BoldOblique": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Helvetica-BoldOblique.ttf",

  // Courier family (for code blocks)
  Courier: "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Courier.ttf",
  "Courier-Oblique": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Courier-Oblique.ttf",
  "Courier-Bold": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Courier-Bold.ttf",
  "Courier-BoldOblique": "https://unpkg.com/@react-pdf/core@4.3.2/fonts/fonts/Courier-BoldOblique.ttf",
}

// Track registration status
let fontsRegistered = false

/**
 * KDP-compliant font family names
 */
export const KDP_FONTS = {
  TIMES_ROMAN: "Times-Roman",
  TIMES_ITALIC: "Times-Italic",
  TIMES_BOLD: "Times-Bold",
  TIMES_BOLD_ITALIC: "Times-BoldItalic",
  HELVETICA: "Helvetica",
  HELVETICA_OBLIQUE: "Helvetica-Oblique",
  HELVETICA_BOLD: "Helvetica-Bold",
  HELVETICA_BOLD_OBLIQUE: "Helvetica-BoldOblique",
  COURIER: "Courier",
  COURIER_OBLIQUE: "Courier-Oblique",
  COURIER_BOLD: "Courier-Bold",
  COURIER_BOLD_OBLIQUE: "Courier-BoldOblique",
} as const

/**
 * Register all KDP fonts for PDF embedding
 * This ensures fonts are fully embedded (not subset) for KDP compliance
 */
export function registerKDPFonts(): void {
  // Only register once
  if (fontsRegistered) {
    return
  }

  // Register Times Roman family
  Font.register({
    family: "Times-Roman",
    fonts: [
      { src: FONT_SOURCES["Times-Roman"] },
      { src: FONT_SOURCES["Times-Italic"], fontStyle: "italic" },
      { src: FONT_SOURCES["Times-Bold"], fontWeight: "bold" },
      { src: FONT_SOURCES["Times-BoldItalic"], fontStyle: "italic", fontWeight: "bold" },
    ],
  })

  // Register Helvetica family
  Font.register({
    family: "Helvetica",
    fonts: [
      { src: FONT_SOURCES.Helvetica },
      { src: FONT_SOURCES["Helvetica-Oblique"], fontStyle: "italic" },
      { src: FONT_SOURCES["Helvetica-Bold"], fontWeight: "bold" },
      { src: FONT_SOURCES["Helvetica-BoldOblique"], fontStyle: "italic", fontWeight: "bold" },
    ],
  })

  // Register Courier family (for code blocks)
  Font.register({
    family: "Courier",
    fonts: [
      { src: FONT_SOURCES.Courier },
      { src: FONT_SOURCES["Courier-Oblique"], fontStyle: "italic" },
      { src: FONT_SOURCES["Courier-Bold"], fontWeight: "bold" },
      { src: FONT_SOURCES["Courier-BoldOblique"], fontStyle: "italic", fontWeight: "bold" },
    ],
  })

  fontsRegistered = true
  console.log("KDP fonts registered successfully")
}

/**
 * Get standardized font family name
 * @param fontName - Font name (e.g., "Times", "Helvetica", "Courier")
 * @returns Registered font family name
 */
export function getFontFamily(fontName: string): string {
  const normalized = fontName.toLowerCase()

  if (normalized.includes("times") || normalized.includes("serif")) {
    return "Times-Roman"
  }
  if (normalized.includes("courier") || normalized.includes("mono")) {
    return "Courier"
  }
  // Default to Helvetica
  return "Helvetica"
}

/**
 * Get font family for body text (KDP standard)
 * @returns Font family name for body text
 */
export function getBodyFontFamily(): string {
  return "Times-Roman"
}

/**
 * Get font family for headings (KDP standard)
 * @returns Font family name for headings
 */
export function getHeadingFontFamily(): string {
  return "Times-Bold"
}

/**
 * Get font family for code blocks
 * @returns Font family name for code
 */
export function getCodeFontFamily(): string {
  return "Courier"
}

// Auto-register fonts when module is loaded
registerKDPFonts()
