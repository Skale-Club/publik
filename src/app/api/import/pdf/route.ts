import { NextRequest, NextResponse } from "next/server"
import { extractTextFromPdf } from "@/lib/import/pdf-utils"

export const runtime = "nodejs"
export const maxDuration = 60 // seconds

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = file.type || ""
    const fileName = file.name.toLowerCase()

    if (
      fileType !== "application/pdf" &&
      !fileName.endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .pdf file." },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for PDFs)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      )
    }

    // Extract text from PDF
    const html = await extractTextFromPdf(file)

    return NextResponse.json({
      success: true,
      html,
    })
  } catch (error) {
    console.error("PDF import error:", error)

    const message = error instanceof Error ? error.message : "Failed to process PDF file"

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
