"use server"

import mammoth from "mammoth"

/**
 * Converts a DOCX file to HTML using mammoth.
 * @param input - File object or ArrayBuffer
 * @returns Promise<string> - HTML string
 */
export async function convertDocxToHtml(
  input: File | ArrayBuffer
): Promise<string> {
  let arrayBuffer: ArrayBuffer

  if (input instanceof File) {
    arrayBuffer = await input.arrayBuffer()
  } else {
    arrayBuffer = input
  }

  // Style map to preserve Word formatting as HTML
  const styleMap = [
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Normal'] => p:fresh",
    "b => strong",
    "i => em",
    "u => u",
  ]

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap,
    }
  )

  // Log warnings for debugging
  if (result.messages && result.messages.length > 0) {
    console.warn("DOCX conversion warnings:", result.messages)
  }

  return result.value
}

/**
 * Extracts raw text from a DOCX file (for debugging or plain text import).
 * @param input - File object or ArrayBuffer
 * @returns Promise<string> - Raw text
 */
export async function extractDocxText(
  input: File | ArrayBuffer
): Promise<string> {
  let arrayBuffer: ArrayBuffer

  if (input instanceof File) {
    arrayBuffer = await input.arrayBuffer()
  } else {
    arrayBuffer = input
  }

  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
