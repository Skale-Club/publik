import { NextRequest, NextResponse } from "next/server"
import { saveImage } from "@/lib/storage"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/tiff", "image/webp"]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB - KDP requirement

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bookId = formData.get("bookId") as string | null
    const coverType = formData.get("coverType") as string | null // 'front' or 'back'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!bookId) {
      return NextResponse.json({ error: "No bookId provided" }, { status: 400 })
    }

    if (!coverType || !["front", "back"].includes(coverType)) {
      return NextResponse.json({ error: "Invalid coverType. Must be 'front' or 'back'" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, TIFF, WebP" },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB" },
        { status: 400 }
      )
    }

    // Save with cover-specific subfolder
    const subfolder = `covers/${coverType}`
    const { url } = await saveImage(file, `${bookId}/${subfolder}`)
    
    // Return the URL - dimensions will be validated client-side before upload
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Cover upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
