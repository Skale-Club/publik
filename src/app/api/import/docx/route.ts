import { NextRequest, NextResponse } from "next/server"
import { convertDocxToHtml } from "@/lib/import/docx-utils"

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
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-word",
    ]
    const fileType = file.type || ""
    const fileName = file.name.toLowerCase()

    if (
      !validTypes.includes(fileType) &&
      !fileName.endsWith(".docx")
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .docx file." },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    // Convert DOCX to HTML
    const html = await convertDocxToHtml(file)

    return NextResponse.json({
      success: true,
      html,
    })
  } catch (error) {
    console.error("DOCX import error:", error)

    const message = error instanceof Error ? error.message : "Failed to process DOCX file"

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
