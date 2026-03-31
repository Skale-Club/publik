/**
 * PDF TOC Document Component
 * Main PDF document with integrated TOC page and bookmarks
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { TOCPage } from "@/components/pdf/toc-page"
import { transformTOCForPDF } from "@/lib/toc/transform"
import type { TOCEntry } from "@/types/toc"

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
})

/**
 * Book settings interface
 */
export interface BookSettings {
  title: string
  author: string
  trimSize?: "A4" | "LETTER"
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

interface TOCDocumentProps {
  book: BookSettings
  chapters: ChapterContent[]
  tocEntries: TOCEntry[]
}

/**
 * Get valid page size for @react-pdf/renderer
 */
function getPageSize(size?: string): "A4" | "LETTER" {
  if (size === "LETTER") return "LETTER"
  return "A4" // Default
}

/**
 * PDF Document with TOC integration
 * - First page: Visual Table of Contents
 * - Content pages: Chapters with bookmarks
 * - Headers/footers with page numbers
 */
export function TOCDocument({ book, chapters, tocEntries }: TOCDocumentProps) {
  // Transform TOC entries to PDF format
  const pdfTocEntries = transformTOCForPDF(tocEntries)
  const pageSize = getPageSize(book.trimSize)

  return (
    <Document>
      {/* Page 1: Table of Contents */}
      <Page
        size={pageSize}
        style={documentStyles.page}
        bookmark="Table of Contents"
      >
        <TOCPage entries={pdfTocEntries} />
      </Page>

      {/* Content Pages */}
      {chapters.map((chapter) => (
        <Page
          key={chapter.id}
          size={pageSize}
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
      ))}
    </Document>
  )
}

/**
 * Create TOC Document with page number resolution
 * This handles the two-pass render by showing "..." on first pass
 */
export function TOCDocumentWithPageNumbers(props: TOCDocumentProps) {
  const { book, chapters, tocEntries } = props
  const pdfTocEntries = transformTOCForPDF(tocEntries)
  const pageSize = getPageSize(book.trimSize)

  return (
    <Document>
      {/* Page 1: TOC with "..." on first pass */}
      <Page size={pageSize} style={documentStyles.page}>
        <TOCPage
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
          size={pageSize}
          style={documentStyles.page}
        >
          <Text
            id={chapter.anchorId}
            style={documentStyles.chapterTitle}
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

export default TOCDocument
