/**
 * TOC Page Component for PDF
 * Visual table of contents page using @react-pdf/renderer
 */

import { Text, View, Link, StyleSheet, Font } from "@react-pdf/renderer"
import type { PDFTOCEntry } from "@/lib/toc/transform"
import { getLevelIndentation, generateDotLeaders } from "@/lib/toc/transform"

// Register fonts if needed
// Font.register({ family: 'Helvetica', fonts: [...] })

const tocStyles = StyleSheet.create({
  page: {
    padding: 72, // 1 inch margins
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  entryContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  entryPageNumber: {
    fontSize: 12,
    marginLeft: 10,
  },
  link: {
    textDecoration: "none",
    color: "inherit",
  },
})

interface TOCPageProps {
  entries: PDFTOCEntry[]
}

/**
 * TOC Page component for PDF
 * Displays "Table of Contents" title and list of entries with dot leaders
 */
export function TOCPage({ entries }: TOCPageProps) {
  return (
    <View style={tocStyles.page}>
      <Text style={tocStyles.title}>Table of Contents</Text>

      {entries.map((entry) => {
        const indentation = getLevelIndentation(entry.level)
        const dotLeaders = generateDotLeaders(entry.title, 40)

        return (
          <View
            key={entry.id}
            style={{
              ...tocStyles.entryContainer,
              marginLeft: indentation,
            }}
          >
            <Link
              href={entry.anchorId ? `#${entry.anchorId}` : "#"}
              style={tocStyles.link}
            >
              <Text style={tocStyles.entryTitle}>
                {entry.title}
                {entry.pageNumber ? ` ${dotLeaders} ` : ` ${dotLeaders} ...`}
              </Text>
            </Link>

            {entry.pageNumber ? (
              <Text style={tocStyles.entryPageNumber}>{entry.pageNumber}</Text>
            ) : (
              <Text style={tocStyles.entryPageNumber}>...</Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

/**
 * Render prop for TOC page that shows real page numbers on second pass
 * Use this when the total pages are known
 */
export function TOCPageWithNumbers({
  entries,
  renderProps,
}: {
  entries: PDFTOCEntry[]
  renderProps: { pageNumber: number; totalPages: number }
}) {
  const { pageNumber } = renderProps

  // On first render pass, show "..."
  // On second pass, show real page numbers
  const isFirstPass = pageNumber === undefined || pageNumber === 1

  const entriesWithPageNumbers = entries.map((entry, index) => ({
    ...entry,
    // Distribute entries across pages (simple distribution)
    // In practice, you'd calculate this based on actual content pages
    pageNumber: isFirstPass ? undefined : index + 2, // +2 because TOC is page 1
  }))

  return <TOCPage entries={entriesWithPageNumbers} />
}

export default TOCPage
