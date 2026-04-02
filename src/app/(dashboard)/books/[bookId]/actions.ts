"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { bookCreateSchema, bookUpdateSchema } from "@/domain/book/book-validator"
import { chapterCreateSchema, chapterUpdateSchema } from "@/domain/book/chapter-validator"
import { Chapter } from "@/domain/book/chapter"
import { db } from "@/infrastructure/db/client"
import { books } from "@/infrastructure/db/schema/books"
import { chapters } from "@/infrastructure/db/schema/chapters"
import { eq, isNull, desc, asc, and, sql } from "drizzle-orm"

export async function createBook(formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    author: (formData.get("author") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    trimSizeId: (formData.get("trimSizeId") as string) || undefined,
    paperType: (formData.get("paperType") as string) || undefined,
    inkType: (formData.get("inkType") as string) || undefined,
    coverFinish: (formData.get("coverFinish") as string) || undefined,
  }

  const validated = bookCreateSchema.parse(raw)
  const id = nanoid()

  await db.insert(books).values({
    id,
    title: validated.title,
    author: validated.author,
    description: validated.description ?? null,
    trimSizeId: validated.trimSizeId,
    paperType: validated.paperType,
    inkType: validated.inkType,
    coverFinish: validated.coverFinish,
  })

  revalidatePath("/")
  return { id }
}

export async function updateBook(bookId: string, formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    author: (formData.get("author") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    trimSizeId: (formData.get("trimSizeId") as string) || undefined,
    paperType: (formData.get("paperType") as string) || undefined,
    inkType: (formData.get("inkType") as string) || undefined,
    coverFinish: (formData.get("coverFinish") as string) || undefined,
  }

  const validated = bookUpdateSchema.parse(raw)

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (validated.title !== undefined) updates.title = validated.title
  if (validated.author !== undefined) updates.author = validated.author
  if (validated.description !== undefined) updates.description = validated.description
  if (validated.trimSizeId !== undefined) updates.trimSizeId = validated.trimSizeId
  if (validated.paperType !== undefined) updates.paperType = validated.paperType
  if (validated.inkType !== undefined) updates.inkType = validated.inkType
  if (validated.coverFinish !== undefined) updates.coverFinish = validated.coverFinish

  await db.update(books).set(updates).where(eq(books.id, bookId))

  revalidatePath("/")
  revalidatePath(`/books/${bookId}`)
}

export async function deleteBook(bookId: string) {
  const now = new Date().toISOString()
  await db.update(books).set({ deletedAt: now, updatedAt: now }).where(eq(books.id, bookId))
  revalidatePath("/")
}

export async function createChapter(bookId: string, title: string): Promise<{ id: string }> {
  const validated = chapterCreateSchema.parse({ title })
  const id = nanoid()
  const now = new Date().toISOString()

  const maxResult = await db
    .select({ value: sql<number>`coalesce(max(${chapters.order}), -1)` })
    .from(chapters)
    .where(and(eq(chapters.bookId, bookId), isNull(chapters.deletedAt)))

  const order = (maxResult[0]?.value ?? -1) + 1

  await db.insert(chapters).values({
    id,
    bookId,
    title: validated.title,
    order,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath(`/books/${bookId}`)
  return { id }
}

export async function updateChapter(chapterId: string, bookId: string, data: { title?: string; content?: string }) {
  const validated = chapterUpdateSchema.parse(data)

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (validated.title !== undefined) updates.title = validated.title
  if (validated.content !== undefined) updates.content = validated.content

  if (Object.keys(updates).length > 1) {
    await db.update(chapters).set(updates).where(eq(chapters.id, chapterId))
  }

  revalidatePath(`/books/${bookId}`)
}

export async function deleteChapter(chapterId: string, bookId: string) {
  const now = new Date().toISOString()
  await db.update(chapters).set({ deletedAt: now, updatedAt: now }).where(eq(chapters.id, chapterId))
  revalidatePath(`/books/${bookId}`)
}

export async function updateChapterContent(chapterId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    await db.update(chapters).set({ content, updatedAt: now }).where(eq(chapters.id, chapterId))
    return { success: true }
  } catch (error) {
    console.error("Failed to update chapter content:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const rows = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.bookId, bookId), isNull(chapters.deletedAt)))
    .orderBy(asc(chapters.order))

  return rows.map((row) => ({
    id: row.id,
    bookId: row.bookId,
    title: row.title,
    order: row.order,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }))
}

export async function reorderChapters(bookId: string, chapterIds: string[]): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction(async (tx) => {
    await Promise.all(
      chapterIds.map((id, i) =>
        tx.update(chapters).set({ order: i, updatedAt: now }).where(eq(chapters.id, id))
      )
    )
  })

  revalidatePath(`/books/${bookId}`)
}
