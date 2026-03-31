"use server"

import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

const UPLOAD_DIR = "public/uploads/books"

export async function saveImage(file: File, bookId: string): Promise<{ url: string; path: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const ext = file.name.split(".").pop() || "png"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(process.cwd(), UPLOAD_DIR, bookId)
  
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  
  const filepath = join(dir, filename)
  await writeFile(filepath, buffer)
  
  const url = `/uploads/books/${bookId}/${filename}`
  return { url, path: filepath }
}

export async function deleteImage(filepath: string): Promise<void> {
  try {
    await unlink(filepath)
  } catch {
    // File may not exist
  }
}
