/**
 * Interior PDF Document Component
 * Main PDF document with KDP trim size support, TOC page, and chapter content
 */

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { getPageDimensions, getTrimSizeLabel, isValidTrimSize } from "./page-layout"
import { getPDFMargins } from "./page-margins"
import { transformTOCForPDF } from "@/lib/toc/transform"
import type { TOCEntry } from "@/types/toc"
import { defaultLayoutOptions, type LayoutOptions } from "./layout-options"
import { PDFHeader } from "./components/page-header"
import { PDFFooter } from "./components/page-footer"
import { registerKDPFonts, getBodyFontFamily, getHeadingFontFamily, getCodeFontFamily } from "./font-registration"
import { htmlToPDF } from "./html-to-pdf"

// Register KDP fonts for PDF generation
// Using registered fonts instead of system fonts for KDP compliance
registerKDPFonts()

// Document styles
const documentStyles = StyleSheet.create({
  page: {
    padding: 72, // 1 inch margins
    fontFamily: getBodyFontFamily(),
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: getHeadingFontFamily(),
    marginTop: 20,
    marginBottom: 10,
  },
  contentWrapper: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 72,
    right: 72,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
  tocTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  tocEntry: {
    fontSize: 12,
    marginBottom: 8,
    flexDirection: "row",
  },
  tocEntryTitle: {
    flex: 1,
  },
  tocEntryPage: {
    marginLeft: 10,
  },
})

/**
 * Book settings interface - extended for KDP trim sizes
 */
export interface BookSettings {
  title: string
  author: string
  /** KDP trim size ID (e.g., "6x9", "5x8", "8.5x11") */
  trimSizeId?: string
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  /** Layout options for headers and footers */
  layoutOptions?: LayoutOptions
  /** Page count for calculating margins */
  pageCount?: number
  /** Bleed setting for margin calculation */
  bleedSetting?: "bleed" | "no-bleed"
}

/**
 * Chapter content interface
 */
export interface ChapterContent {
  id: string
  title: string
  anchorId: string
  content: string
  level: number
}

interface InteriorDocumentProps {
  book: BookSettings
  chapters: ChapterContent[]
  tocEntries: TOCEntry[]
}

/**
 * Internal TOC Page component for PDF
 */
function TOCPageContent({ entries }: { entries: Array<{ title: string; level: number; pageNumber?: number }> }) {
  return (
    <View>
      <Text style={documentStyles.tocTitle}>Table of Contents</Text>
      {entries.map((entry, index) => (
        <View key={index} style={{ ...documentStyles.tocEntry, marginLeft: (entry.level - 1) * 20 }}>
          <Text style={documentStyles.tocEntryTitle}>{entry.title}</Text>
          <Text style={documentStyles.tocEntryPage}>
            {entry.pageNumber !== undefined ? entry.pageNumber : "..."}
          </Text>
        </View>
      ))}
    </View>
  )
}

/**
 * Interior Document Component
 * Generates PDF with:
 * - TOC page
 * - Chapter content pages with bookmarks
 * - Page numbers in footer
 * - KDP trim size dimensions
 */
export function InteriorDocument({ book, chapters, tocEntries }: InteriorDocumentProps) {
  // Get page dimensions from KDP trim size
  const pageDimensions = book.trimSizeId
    ? getPageDimensions(book.trimSizeId)
    : { width: 612, height: 792 } // Default to LETTER if not specified

  // Validate trim size
  const isValid = book.trimSizeId ? isValidTrimSize(book.trimSizeId) : true

  if (!isValid) {
    console.warn(`Invalid trim size: ${book.trimSizeId}. Using default.`)
  }

  // Get layout options (use defaults if not provided)
  const layout = book.layoutOptions ?? defaultLayoutOptions

  // Calculate KDP margins if page count and bleed setting are provided
  const pageMarginStyle = book.pageCount && book.bleedSetting
    ? getPDFMargins(book.pageCount, book.bleedSetting)
    : null

  // Apply margin styles to page style
  const pageStyle = pageMarginStyle
    ? {
        ...documentStyles.page,
        paddingTop: pageMarginStyle.top,
        paddingBottom: pageMarginStyle.bottom,
        paddingLeft: pageMarginStyle.left,
        paddingRight: pageMarginStyle.right,
      }
    : documentStyles.page

  // Transform TOC entries for PDF
  const pdfTocEntries = transformTOCForPDF(tocEntries)

  return (
    <Document>
      {/* Page 1: Table of Contents */}
      <Page
        size={[pageDimensions.width, pageDimensions.height]}
        style={pageStyle}
        bookmark="Table of Contents"
      >
        <TOCPageContent entries={pdfTocEntries} />

        {/* Header */}
        <PDFHeader bookTitle={book.title} layout={layout} />

        {/* Footer with page number - TOC page */}
        <PDFFooter layout={layout} />
      </Page>

      {/* Content Pages */}
      {chapters.map((chapter, index) => {
        // Calculate page number for TOC (starts at page 2 since TOC is page 1)
        const contentPageNumber = index + 2

        return (
          <Page
            key={chapter.id}
            size={[pageDimensions.width, pageDimensions.height]}
            style={pageStyle}
          >
            {/* Header with chapter info */}
            <PDFHeader bookTitle={book.title} chapterTitle={chapter.title} layout={layout} />

            {/* Chapter heading with bookmark */}
            <Text
              id={chapter.anchorId}
              style={{
                ...documentStyles.chapterTitle,
                marginLeft: (chapter.level - 1) * 15,
              }}
              // @ts-expect-error - bookmark prop exists at runtime
              bookmark={{
                title: chapter.title,
                fit: true,
                expanded: chapter.level === 1,
              }}
            >
              {chapter.title}
            </Text>

            {/* Chapter content - rendered from HTML */}
            <View style={documentStyles.contentWrapper}>
              {htmlToPDF(chapter.content)}
            </View>

            {/* Footer with page number */}
            <PDFFooter layout={layout} />
          </Page>
        )
      })}
    </Document>
  )
}

/**
 * Interior Document with page number resolution
 * Handles two-pass rendering by showing "..." on first pass
 */
export function InteriorDocumentWithPageNumbers(props: InteriorDocumentProps) {
  const { book, chapters, tocEntries } = props

  // Get page dimensions from KDP trim size
  const pageDimensions = book.trimSizeId
    ? getPageDimensions(book.trimSizeId)
    : { width: 612, height: 792 }

  // Get layout options (use defaults if not provided)
  const layout = book.layoutOptions ?? defaultLayoutOptions

  // Calculate KDP margins if page count and bleed setting are provided
  const pageMarginStyle = book.pageCount && book.bleedSetting
    ? getPDFMargins(book.pageCount, book.bleedSetting)
    : null

  // Apply margin styles to page style
  const pageStyle = pageMarginStyle
    ? {
        ...documentStyles.page,
        paddingTop: pageMarginStyle.top,
        paddingBottom: pageMarginStyle.bottom,
        paddingLeft: pageMarginStyle.left,
        paddingRight: pageMarginStyle.right,
      }
    : documentStyles.page

  // Transform TOC entries for PDF
  const pdfTocEntries = transformTOCForPDF(tocEntries)

  return (
    <Document>
      {/* Page 1: TOC with "..." on first pass */}
      <Page
        size={[pageDimensions.width, pageDimensions.height]}
        style={pageStyle}
      >
        <TOCPageContent
          entries={pdfTocEntries.map((entry) => ({
            ...entry,
            pageNumber: undefined,
          }))}
        />
      </Page>

      {/* Content with chapter bookmarks */}
      {chapters.map((chapter) => (
        <Page
          key={chapter.id}
          size={[pageDimensions.width, pageDimensions.height]}
          style={pageStyle}
        >
          <Text
            id={chapter.anchorId}
            style={{
              ...documentStyles.chapterTitle,
              marginLeft: (chapter.level - 1) * 15,
            }}
            // @ts-expect-error - bookmark prop exists at runtime
            bookmark={{
              title: chapter.title,
              fit: true,
              expanded: chapter.level === 1,
            }}
          >
            {chapter.title}
          </Text>

          {/* Chapter content - rendered from HTML */}
          <View style={documentStyles.contentWrapper}>
            {htmlToPDF(chapter.content)}
          </View>

          <Text
            style={documentStyles.footer}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
            fixed
          />
        </Page>
      ))}
    </Document>
  )
}

export default InteriorDocument