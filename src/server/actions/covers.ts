"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { nanoid } from "nanoid"
import { getDb, initDb, saveDb } from "@/infrastructure/db/client"
import { covers } from "@/infrastructure/db/schema/covers"

export interface CoverData {
  id: string
  bookId: string
  frontCoverUrl: string | null
  frontCoverWidth: number | null
  frontCoverHeight: number | null
  backCoverType: "image" | "text" | null
  backCoverImageUrl: string | null
  backCoverImageWidth: number | null
  backCoverImageHeight: number | null
  backCoverText: string | null
  createdAt: string
  updatedAt: string
}

export interface BookData {
  id: string
  title: string
  trimSizeId: string
  paperType: "white" | "cream"
  inkType: "bw" | "standard-color" | "premium-color"
  coverFinish: "glossy" | "matte"
  createdAt: string
  updatedAt: string
}

async function getReadyDb() {
  await initDb()
  return getDb()
}

/**
 * Get book data by ID (for cover editor)
 */
export async function getBook(bookId: string): Promise<BookData | null> {
  const db = await getReadyDb()
  
  const result = db.exec(`SELECT * FROM books WHERE id = '${bookId}'`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const book: any = {}
  
  columns.forEach((col, i) => {
    switch (col) {
      case "book_id":
        book.bookId = row[i]
        break
      case "trim_size_id":
        book.trimSizeId = row[i]
        break
      case "paper_type":
        book.paperType = row[i]
        break
      case "ink_type":
        book.inkType = row[i]
        break
      case "cover_finish":
        book.coverFinish = row[i]
        break
      case "created_at":
        book.createdAt = row[i]
        break
      case "updated_at":
        book.updatedAt = row[i]
        break
      default:
        book[col] = row[i]
    }
  })
  
  return book as BookData
}

// Validation schemas
const frontCoverSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  url: z.string().url("Valid URL is required"),
  width: z.number().int().positive("Width must be positive"),
  height: z.number().int().positive("Height must be positive"),
})

const backCoverImageSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  imageUrl: z.string().url("Valid image URL is required").optional(),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
})

const backCoverTextSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  text: z.string().max(5000, "Text must be 5000 characters or less").optional(),
})

/**
 * Get cover data for a book
 */
export async function getCover(bookId: string): Promise<CoverData | null> {
  const db = await getReadyDb()
  
  const result = db.exec(`SELECT * FROM covers WHERE book_id = '${bookId}'`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null
  }
  
  const columns = result[0].columns
  const row = result[0].values[0]
  const cover: any = {}
  
  columns.forEach((col, i) => {
    switch (col) {
      case "book_id":
        cover.bookId = row[i]
        break
      case "front_cover_url":
        cover.frontCoverUrl = row[i]
        break
      case "front_cover_width":
        cover.frontCoverWidth = row[i]
        break
      case "front_cover_height":
        cover.frontCoverHeight = row[i]
        break
      case "back_cover_type":
        cover.backCoverType = row[i]
        break
      case "back_cover_image_url":
        cover.backCoverImageUrl = row[i]
        break
      case "back_cover_image_width":
        cover.backCoverImageWidth = row[i]
        break
      case "back_cover_image_height":
        cover.backCoverImageHeight = row[i]
        break
      case "back_cover_text":
        cover.backCoverText = row[i]
        break
      case "created_at":
        cover.createdAt = row[i]
        break
      case "updated_at":
        cover.updatedAt = row[i]
        break
      default:
        cover[col] = row[i]
    }
  })
  
  return cover as CoverData
}

/**
 * Save front cover data
 */
export async function saveFrontCover(
  bookId: string,
  url: string,
  width: number,
  height: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = frontCoverSchema.parse({ bookId, url, width, height })
    const db = await getReadyDb()
    const now = new Date().toISOString()
    
    // Check if cover exists
    const existing = db.exec(`SELECT id FROM covers WHERE book_id = '${validated.bookId}'`)
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      // Update existing
      db.run(
        `UPDATE covers SET front_cover_url = ?, front_cover_width = ?, front_cover_height = ?, updated_at = ? WHERE book_id = ?`,
        [validated.url, validated.width, validated.height, now, validated.bookId]
      )
    } else {
      // Insert new
      const id = nanoid()
      db.run(
        `INSERT INTO covers (id, book_id, front_cover_url, front_cover_width, front_cover_height, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, validated.bookId, validated.url, validated.width, validated.height, now, now]
      )
    }
    
    saveDb()
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Save back cover data (image mode)
 */
export async function saveBackCoverImage(
  bookId: string,
  imageUrl: string,
  imageWidth?: number,
  imageHeight?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = backCoverImageSchema.parse({ bookId, imageUrl, imageWidth, imageHeight })
    const db = await getReadyDb()
    const now = new Date().toISOString()
    
    // Check if cover exists
    const existing = db.exec(`SELECT id FROM covers WHERE book_id = '${validated.bookId}'`)
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      // Update existing
      db.run(
        `UPDATE covers SET back_cover_type = 'image', back_cover_image_url = ?, back_cover_image_width = ?, back_cover_image_height = ?, updated_at = ? WHERE book_id = ?`,
        [validated.imageUrl, validated.imageWidth || null, validated.imageHeight || null, now, validated.bookId]
      )
    } else {
      // Insert new
      const id = nanoid()
      db.run(
        `INSERT INTO covers (id, book_id, back_cover_type, back_cover_image_url, back_cover_image_width, back_cover_image_height, created_at, updated_at)
         VALUES (?, ?, 'image', ?, ?, ?, ?, ?)`,
        [id, validated.bookId, validated.imageUrl, validated.imageWidth || null, validated.imageHeight || null, now, now]
      )
    }
    
    saveDb()
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Save back cover data (text mode)
 */
export async function saveBackCoverText(
  bookId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = backCoverTextSchema.parse({ bookId, text })
    const db = await getReadyDb()
    const now = new Date().toISOString()
    
    // Check if cover exists
    const existing = db.exec(`SELECT id FROM covers WHERE book_id = '${validated.bookId}'`)
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      // Update existing
      db.run(
        `UPDATE covers SET back_cover_type = 'text', back_cover_text = ?, updated_at = ? WHERE book_id = ?`,
        [validated.text, now, validated.bookId]
      )
    } else {
      // Insert new
      const id = nanoid()
      db.run(
        `INSERT INTO covers (id, book_id, back_cover_type, back_cover_text, created_at, updated_at)
         VALUES (?, ?, 'text', ?, ?, ?)`,
        [id, validated.bookId, validated.text, now, now]
      )
    }
    
    saveDb()
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Delete cover record for a book
 */
export async function deleteCover(
  bookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getReadyDb()
    
    db.run(`DELETE FROM covers WHERE book_id = ?`, [bookId])
    saveDb()
    
    revalidatePath(`/dashboard/books/[bookId]`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
