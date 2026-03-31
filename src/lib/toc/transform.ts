/**
 * TOC Transform Utilities
 * Convert TOC entries to PDF-ready format for @react-pdf/renderer
 */

import type { TOCEntry } from "@/types/toc"

/**
 * PDF TOC Entry - ready for PDF rendering
 */
export interface PDFTOCEntry {
  id: string
  title: string
  level: number
  anchorId: string | null
  pageNumber?: number
}

/**
 * Bookmark structure for @react-pdf/renderer
 */
export interface PDFBookmark {
  title: string
  fit: true
  expanded?: boolean
  destination?: string
}

/**
 * Transform TOC entries to PDF-ready format
 * Converts from database TOCEntry to PDFTOCEntry
 * @param entries - Array of TOCEntry from database
 * @returns Array of PDFTOCEntry ready for PDF rendering
 */
export function transformTOCForPDF(entries: TOCEntry[]): PDFTOCEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    level: entry.level,
    anchorId: entry.anchorId,
    // Page number will be resolved during PDF render
    pageNumber: undefined,
  }))
}

/**
 * Generate bookmark array for @react-pdf/renderer
 * @param entries - Array of PDFTOCEntry
 * @returns Array of bookmark objects for PDF navigation sidebar
 */
export function generateBookmark(entries: PDFTOCEntry[]): PDFBookmark[] {
  return entries.map((entry) => ({
    title: entry.title,
    fit: true,
    // Expand top-level entries (level 1) by default
    expanded: entry.level === 1,
  }))
}

/**
 * Group TOC entries by level for hierarchical display
 * @param entries - Array of PDFTOCEntry
 * @returns Map of level -> entries
 */
export function groupByLevel(entries: PDFTOCEntry[]): Map<number, PDFTOCEntry[]> {
  const grouped = new Map<number, PDFTOCEntry[]>()

  for (const entry of entries) {
    const existing = grouped.get(entry.level) || []
    existing.push(entry)
    grouped.set(entry.level, existing)
  }

  return grouped
}

/**
 * Calculate indentation for TOC entry based on level
 * @param level - Heading level (1-6)
 * @returns Indentation in points
 */
export function getLevelIndentation(level: number): number {
  // Base indentation: 15pt per level
  return (level - 1) * 15
}

/**
 * Generate dot leaders string for TOC entry
 * @param title - Entry title
 * @param maxLength - Maximum length of the leader line
 * @returns String of dots
 */
export function generateDotLeaders(title: string, maxLength: number = 50): string {
  const titleLength = title.length
  const availableDots = Math.max(3, maxLength - titleLength - 4) // 4 for spaces around page number
  return ".".repeat(availableDots)
}
