/**
 * Cover PDF Document Component
 * Generates a complete KDP cover with front cover, back cover, spine, and bleed
 */

import { Document, Page, View, Image, Text, StyleSheet } from "@react-pdf/renderer"
import { calculateCoverDimensions, type CoverDimensions } from "./cover-dimensions"
import { calculateSpineWidth } from "./spine-calculator"
import type { PaperType } from "./spine-calculator"

// Cover document styles
const coverStyles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  // Back cover section
  backCover: {
    flex: 1,
    padding: 9, // 0.125" bleed
  },
  backCoverText: {
    fontSize: 11,
    lineHeight: 1.5,
    textAlign: "justify",
    padding: 9,
  },
  // Spine section
  spine: {
    minWidth: 9, // At least bleed width
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    transform: "rotate(180deg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spineText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  // Front cover section
  frontCover: {
    flex: 1,
    padding: 9, // 0.125" bleed
  },
  // Cover image fill
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "fill",
  },
  // Title on front cover (fallback)
  frontTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: "50%",
  },
  frontAuthor: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
})

/**
 * Book data interface for cover generation
 */
export interface CoverBookData {
  id: string
  title: string
  author: string
  trimSizeId: string
  paperType: PaperType
  pageCount: number
}

/**
 * Cover document props interface
 */
export interface CoverDocumentProps {
  book: CoverBookData
  frontCoverUrl: string
  backCoverUrl?: string
  backCoverText?: string
}

/**
 * Cover Document Component
 * Generates a complete KDP cover PDF with:
 * - 0.125" bleed on all sides
 * - Back cover (image or text)
 * - Spine (with text if 80+ pages)
 * - Front cover (image)
 */
export function CoverDocument({ book, frontCoverUrl, backCoverUrl, backCoverText }: CoverDocumentProps) {
  // Calculate cover dimensions
  let dimensions: CoverDimensions
  try {
    dimensions = calculateCoverDimensions(book.trimSizeId, book.pageCount, book.paperType)
  } catch (error) {
    // Fallback to default if trim size invalid
    dimensions = {
      totalWidth: 468, // 6.5" + spine + 6.5" + bleed
      totalHeight: 594, // 8.25" + bleed
      bleedSize: 9,
      spineWidth: 20,
      backCoverWidth: 468,
      frontCoverWidth: 468,
      trimWidth: 468,
      trimHeight: 594,
    }
  }

  // Calculate spine width for text eligibility
  const spineResult = calculateSpineWidth(book.pageCount, book.paperType)
  const canHaveSpineText = spineResult.canHaveSpineText

  // Calculate width percentages using points-based layout to avoid float precision gaps.
  // The right bleed uses the remainder so all sections always sum to exactly 100%.
  const toPercent = (pts: number) =>
    parseFloat(((pts / dimensions.totalWidth) * 100).toFixed(6))
  const bleedPercent = toPercent(dimensions.bleedSize)
  const backCoverPercent = toPercent(dimensions.backCoverWidth)
  const spinePercent = toPercent(dimensions.spineWidth)
  const frontCoverPercent = toPercent(dimensions.frontCoverWidth)
  const rightBleedPercent =
    100 - bleedPercent - backCoverPercent - spinePercent - frontCoverPercent

  return (
    <Document>
    <Page size={[dimensions.totalWidth, dimensions.totalHeight]} style={coverStyles.page}>
      <View style={{ width: `${bleedPercent}%`, height: "100%" }} />

      {/* Back Cover Section */}
      <View style={{ width: `${backCoverPercent}%`, height: "100%" }}>
        {backCoverUrl ? (
          <Image src={backCoverUrl} style={coverStyles.coverImage} />
        ) : backCoverText ? (
          <Text style={coverStyles.backCoverText}>{backCoverText}</Text>
        ) : (
          <View />
        )}
      </View>

      {/* Spine Section */}
      <View style={{ width: `${Math.max(spinePercent, 0.5)}%`, height: "100%" }}>
        {canHaveSpineText && (
          <View style={coverStyles.spine}>
            <Text style={coverStyles.spineText}>{book.title}</Text>
          </View>
        )}
      </View>

      {/* Front Cover Section */}
      <View style={{ width: `${frontCoverPercent}%`, height: "100%" }}>
        {frontCoverUrl ? (
          <Image src={frontCoverUrl} style={coverStyles.coverImage} />
        ) : (
          <View>
            <Text style={coverStyles.frontTitle}>{book.title}</Text>
            <Text style={coverStyles.frontAuthor}>{book.author}</Text>
          </View>
        )}
      </View>

      <View style={{ width: `${rightBleedPercent}%`, height: "100%" }} />
    </Page>
    </Document>
  )
}

export default CoverDocument