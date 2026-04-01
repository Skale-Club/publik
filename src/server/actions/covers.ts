"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { nanoid } from "nanoid"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { covers } from "@/infrastructure/db/schema/covers"
import { eq } from "drizzle-orm"

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
  author: string
  trimSizeId: string
  paperType: "white" | "cream"
  inkType: "bw" | "standard-color" | "premium-color"
  coverFinish: "glossy" | "matte"
  createdAt: string
  updatedAt: string
}

export async function getBook(bookId: string): Promise<BookData | null> {
  const rows = await db.select().from(books).where(eq(books.id, bookId))
  const row = rows[0]
  if (!row || row.deletedAt) return null

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    trimSizeId: row.trimSizeId,
    paperType: row.paperType as BookData["paperType"],
    inkType: row.inkType as BookData["inkType"],
    coverFinish: row.coverFinish as BookData["coverFinish"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

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

export async function getCover(bookId: string): Promise<CoverData | null> {
  const rows = await db.select().from(covers).where(eq(covers.bookId, bookId))
  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    bookId: row.bookId,
    frontCoverUrl: row.frontCoverUrl,
    frontCoverWidth: row.frontCoverWidth,
    frontCoverHeight: row.frontCoverHeight,
    backCoverType: row.backCoverType as CoverData["backCoverType"],
    backCoverImageUrl: row.backCoverImageUrl,
    backCoverImageWidth: row.backCoverImageWidth,
    backCoverImageHeight: row.backCoverImageHeight,
    backCoverText: row.backCoverText,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function saveFrontCover(
  bookId: string,
  url: string,
  width: number,
  height: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = frontCoverSchema.parse({ bookId, url, width, height })
    const now = new Date().toISOString()

    const existing = await db.select().from(covers).where(eq(covers.bookId, validated.bookId))

    if (existing.length > 0) {
      await db
        .update(covers)
        .set({ frontCoverUrl: validated.url, frontCoverWidth: validated.width, frontCoverHeight: validated.height, updatedAt: now })
        .where(eq(covers.bookId, validated.bookId))
    } else {
      const id = nanoid()
      await db.insert(covers).values({
        id,
        bookId: validated.bookId,
        frontCoverUrl: validated.url,
        frontCoverWidth: validated.width,
        frontCoverHeight: validated.height,
        createdAt: now,
        updatedAt: now,
      })
    }

    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function saveBackCoverImage(
  bookId: string,
  imageUrl: string,
  imageWidth?: number,
  imageHeight?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = backCoverImageSchema.parse({ bookId, imageUrl, imageWidth, imageHeight })
    const now = new Date().toISOString()

    const existing = await db.select().from(covers).where(eq(covers.bookId, validated.bookId))

    if (existing.length > 0) {
      await db
        .update(covers)
        .set({
          backCoverType: "image",
          backCoverImageUrl: validated.imageUrl,
          backCoverImageWidth: validated.imageWidth ?? null,
          backCoverImageHeight: validated.imageHeight ?? null,
          updatedAt: now,
        })
        .where(eq(covers.bookId, validated.bookId))
    } else {
      const id = nanoid()
      await db.insert(covers).values({
        id,
        bookId: validated.bookId,
        backCoverType: "image",
        backCoverImageUrl: validated.imageUrl,
        backCoverImageWidth: validated.imageWidth ?? null,
        backCoverImageHeight: validated.imageHeight ?? null,
        createdAt: now,
        updatedAt: now,
      })
    }

    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function saveBackCoverText(
  bookId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = backCoverTextSchema.parse({ bookId, text })
    const now = new Date().toISOString()

    const existing = await db.select().from(covers).where(eq(covers.bookId, validated.bookId))

    if (existing.length > 0) {
      await db
        .update(covers)
        .set({ backCoverType: "text", backCoverText: validated.text, updatedAt: now })
        .where(eq(covers.bookId, validated.bookId))
    } else {
      const id = nanoid()
      await db.insert(covers).values({
        id,
        bookId: validated.bookId,
        backCoverType: "text",
        backCoverText: validated.text,
        createdAt: now,
        updatedAt: now,
      })
    }

    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteCover(bookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(covers).where(eq(covers.bookId, bookId))
    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
