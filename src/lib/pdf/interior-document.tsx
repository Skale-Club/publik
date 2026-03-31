/**
 * Interior PDF Document Component
 * Main PDF document with KDP trim size support, TOC page, and chapter content
 */

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { getPageDimensions, getTrimSizeLabel, isValidTrimSize } from "./page-layout"
import { transformTOCForPDF } from "@/lib/toc/transform"
import type { TOCEntry } from "@/types/toc"

// Register fonts for PDF generation
// Using built-in Helvetica for now - can be extended with custom fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

// Document styles
const documentStyles = StyleSheet.create({
  page: {
    padding: 72, // 1 inch margins
    fontFamily: "Helvetica",
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
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

  // Transform TOC entries for PDF
  const pdfTocEntries = transformTOCForPDF(tocEntries)

  return (
    <Document>
      {/* Page 1: Table of Contents */}
      <Page
        size={[pageDimensions.width, pageDimensions.height]}
        style={documentStyles.page}
        bookmark="Table of Contents"
      >
        <TOCPageContent entries={pdfTocEntries} />

        {/* Footer with page number - TOC page */}
        <Text
          style={documentStyles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Content Pages */}
      {chapters.map((chapter, index) => {
        // Calculate page number for TOC (starts at page 2 since TOC is page 1)
        const contentPageNumber = index + 2

        return (
          <Page
            key={chapter.id}
            size={[pageDimensions.width, pageDimensions.height]}
            style={documentStyles.page}
          >
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

            {/* Chapter content */}
            <Text style={documentStyles.content}>{chapter.content}</Text>

            {/* Footer with page number */}
            <Text
              style={documentStyles.footer}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
              fixed
            />
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

  // Transform TOC entries for PDF
  const pdfTocEntries = transformTOCForPDF(tocEntries)

  return (
    <Document>
      {/* Page 1: TOC with "..." on first pass */}
      <Page
        size={[pageDimensions.width, pageDimensions.height]}
        style={documentStyles.page}
      >
        <TOCPageContent
          entries={pdfTocEntries.map((entry) => ({
            ...entry,
            // Show "..." on first pass (unknown page numbers)
            pageNumber: undefined,
          }))}
        />
      </Page>

      {/* Content with chapter bookmarks */}
      {chapters.map((chapter) => (
        <Page
          key={chapter.id}
          size={[pageDimensions.width, pageDimensions.height]}
          style={documentStyles.page}
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

          <Text style={documentStyles.content}>{chapter.content}</Text>

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