/**
 * PDF Footer Component
 * Renders configurable footer with page numbers on every page
 */

import { Text, StyleSheet } from "@react-pdf/renderer"
import { formatPageNumber, type LayoutOptions } from "../layout-options"

const footerStyles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
    fontSize: 10,
    textAlign: "center",
    color: "#666666",
  },
})

interface PDFFooterProps {
  layout: LayoutOptions
}

/**
 * PDF Footer component that displays page numbers and optional custom text
 * Uses `fixed` prop to render on every page
 * Uses `render` prop to get pageNumber and totalPages
 */
export function PDFFooter({ layout }: PDFFooterProps) {
  // Don't render if showFooter is false
  if (!layout.showFooter) {
    return null
  }

  // If custom footer text is provided, show it (optionally with page numbers)
  if (layout.footerText) {
    return (
      <Text style={footerStyles.footer} fixed>
        {layout.showPageNumbers
          ? `${layout.footerText} | `
          : layout.footerText}
      </Text>
    )
  }

  // If showPageNumbers is false and no footer text, don't render
  if (!layout.showPageNumbers) {
    return null
  }

  // Render page numbers using render prop for dynamic values
  return (
    <Text
      style={footerStyles.footer}
      render={({ pageNumber, totalPages }) =>
        formatPageNumber(pageNumber, totalPages, layout.pageNumberFormat)
      }
      fixed
    />
  )
}
