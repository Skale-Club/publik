/** Strip HTML tags and decode basic entities to get plain text word count. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Estimate page count from an array of HTML chapter content strings.
 * Uses 300 words-per-page as the KDP baseline for paperback interiors.
 * Minimum of 24 pages (KDP requirement for perfect-bound).
 */
export function estimatePageCount(htmlContents: string[]): number {
  let totalWords = 0
  for (const html of htmlContents) {
    if (!html) continue
    const text = htmlToPlainText(html)
    totalWords += text.split(/\s+/).filter(Boolean).length
  }
  return Math.max(24, Math.ceil(totalWords / 300))
}
