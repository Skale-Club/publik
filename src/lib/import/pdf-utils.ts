"use server"

import * as pdfjs from "pdfjs-dist"

// Configure worker - use CDN for server-side processing
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

/**
 * Extracts text content from a PDF file and returns HTML.
 * @param input - File object or ArrayBuffer
 * @returns Promise<string> - HTML string with page breaks indicated
 */
export async function extractTextFromPdf(
  input: File | ArrayBuffer
): Promise<string> {
  let arrayBuffer: ArrayBuffer

  if (input instanceof File) {
    arrayBuffer = await input.arrayBuffer()
  } else {
    arrayBuffer = input
  }

  // Load the PDF document
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const pageContents: string[] = []

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Build text from items - filter for items with string property
    const pageText = textContent.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ")

    if (pageText.trim()) {
      // Wrap each page's text in a paragraph
      pageContents.push(`<p>${pageText}</p>`)
    }

    // Add page break indicator between pages (except for the last page)
    if (pageNum < pdf.numPages) {
      pageContents.push('<hr class="page-break" style="border: none; border-top: 1px dashed #ccc; margin: 20px 0;" />')
    }
  }

  return pageContents.join("\n")
}

/**
 * Gets PDF metadata (title, author, page count).
 * @param input - File object or ArrayBuffer
 * @returns Promise<object> - Metadata object
 */
export async function getPdfMetadata(
  input: File | ArrayBuffer
): Promise<{ title?: string; author?: string; pageCount: number }> {
  let arrayBuffer: ArrayBuffer

  if (input instanceof File) {
    arrayBuffer = await input.arrayBuffer()
  } else {
    arrayBuffer = input
  }

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const metadata = await pdf.getMetadata()
  const info = metadata.info as Record<string, string> | undefined

  return {
    title: info?.Title,
    author: info?.Author,
    pageCount: pdf.numPages,
  }
}
