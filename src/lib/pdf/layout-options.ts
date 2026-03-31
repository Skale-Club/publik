/**
 * Layout Options for PDF Headers and Footers
 * Configures display of headers, footers, and page numbers
 */

/**
 * Page number format options
 */
export type PageNumberFormat =
  | "Page X of Y"    // Full format: "Page 1 of 100"
  | "X of Y"         // Short format: "1 of 100"
  | "Page X"         // Page only: "Page 1"
  | "X"              // Number only: "1"

/**
 * Layout configuration options for PDF headers and footers
 */
export interface LayoutOptions {
  /** Show header on each page */
  showHeader: boolean
  /** Custom header text (overrides book title/chapter name) */
  headerText: string | null
  /** Show book title in header */
  headerBookTitle: boolean
  /** Show chapter name in header */
  headerChapterName: boolean
  /** Show footer on each page */
  showFooter: boolean
  /** Custom footer text (overrides page numbers) */
  footerText: string | null
  /** Show page numbers in footer */
  showPageNumbers: boolean
  /** Page number format */
  pageNumberFormat: PageNumberFormat
}

/**
 * Default layout options for KDP-compliant PDF
 */
export const defaultLayoutOptions: LayoutOptions = {
  showHeader: false,
  headerText: null,
  headerBookTitle: false,
  headerChapterName: false,
  showFooter: true,
  footerText: null,
  showPageNumbers: true,
  pageNumberFormat: "Page X of Y",
}

/**
 * Format a page number based on the configured format
 * @param pageNumber - Current page number
 * @param totalPages - Total number of pages
 * @param format - Page number format
 * @returns Formatted page number string
 */
export function formatPageNumber(
  pageNumber: number,
  totalPages: number | undefined,
  format: PageNumberFormat
): string {
  // Show "..." when totalPages is unknown (first render pass)
  if (totalPages === undefined) {
    return "..."
  }

  switch (format) {
    case "Page X of Y":
      return `Page ${pageNumber} of ${totalPages}`
    case "X of Y":
      return `${pageNumber} of ${totalPages}`
    case "Page X":
      return `Page ${pageNumber}`
    case "X":
      return String(pageNumber)
    default:
      return `Page ${pageNumber} of ${totalPages}`
  }
}

/**
 * Get all available page number format options
 * @returns Array of format options with labels
 */
export function getPageNumberFormatOptions(): Array<{ value: PageNumberFormat; label: string }> {
  return [
    { value: "Page X of Y", label: "Page X of Y" },
    { value: "X of Y", label: "X of Y" },
    { value: "Page X", label: "Page X" },
    { value: "X", label: "X" },
  ]
}
