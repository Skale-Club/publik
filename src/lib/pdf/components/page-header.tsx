/**
 * PDF Header Component
 * Renders configurable header on every page of the PDF
 */

import { Text, StyleSheet } from "@react-pdf/renderer"
import type { LayoutOptions } from "../layout-options"

const headerStyles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 20,
    left: 36,
    right: 36,
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
  },
})

interface PDFHeaderProps {
  bookTitle: string
  chapterTitle?: string
  layout: LayoutOptions
}

/**
 * PDF Header component that displays optional header content
 * Uses `fixed` prop to render on every page
 */
export function PDFHeader({ bookTitle, chapterTitle, layout }: PDFHeaderProps) {
  // Don't render if showHeader is false
  if (!layout.showHeader) {
    return null
  }

  // Determine what to display in header
  let headerContent: string | null = null

  if (layout.headerText) {
    // Custom header text takes priority
    headerContent = layout.headerText
  } else if (layout.headerBookTitle && layout.headerChapterName && chapterTitle) {
    // Both book title and chapter name
    headerContent = `${bookTitle} - ${chapterTitle}`
  } else if (layout.headerBookTitle) {
    // Book title only
    headerContent = bookTitle
  } else if (layout.headerChapterName && chapterTitle) {
    // Chapter name only
    headerContent = chapterTitle
  }

  // Don't render if no content to display
  if (!headerContent) {
    return null
  }

  return (
    <Text style={headerStyles.header} fixed>
      {headerContent}
    </Text>
  )
}
