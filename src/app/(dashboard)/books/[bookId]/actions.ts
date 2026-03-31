"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { bookCreateSchema, bookUpdateSchema } from "@/domain/book/book-validator"
import { chapterCreateSchema, chapterUpdateSchema } from "@/domain/book/chapter-validator"
import { getDb, initDb, saveDb } from "@/infrastructure/db/client"
import { Chapter } from "@/domain/book/chapter"

async function getReadyDb() {
  await initDb()
  return getDb()
}

export async function createBook(formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    trimSizeId: (formData.get("trimSizeId") as string) || undefined,
    paperType: (formData.get("paperType") as string) || undefined,
    inkType: (formData.get("inkType") as string) || undefined,
    coverFinish: (formData.get("coverFinish") as string) || undefined,
  }

  const validated = bookCreateSchema.parse(raw)

  const db = await getReadyDb()
  const id = nanoid()
  const now = new Date().toISOString()
  
  db.run(
    `INSERT INTO books (id, title, description, trim_size_id, paper_type, ink_type, cover_finish, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, validated.title, validated.description || null, validated.trimSizeId, validated.paperType, validated.inkType, validated.coverFinish, now, now]
  )
  saveDb()

  revalidatePath("/dashboard")
  return { id }
}

export async function updateBook(bookId: string, formData: FormData) {
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    trimSizeId: (formData.get("trimSizeId") as string) || undefined,
    paperType: (formData.get("paperType") as string) || undefined,
    inkType: (formData.get("inkType") as string) || undefined,
    coverFinish: (formData.get("coverFinish") as string) || undefined,
  }

  const validated = bookUpdateSchema.parse(raw)
  
  const db = await getReadyDb()
  const now = new Date().toISOString()
  
  const updates: string[] = []
  const values: any[] = []
  
  if (validated.title !== undefined) { updates.push("title = ?"); values.push(validated.title) }
  if (validated.description !== undefined) { updates.push("description = ?"); values.push(validated.description) }
  if (validated.trimSizeId !== undefined) { updates.push("trim_size_id = ?"); values.push(validated.trimSizeId) }
  if (validated.paperType !== undefined) { updates.push("paper_type = ?"); values.push(validated.paperType) }
  if (validated.inkType !== undefined) { updates.push("ink_type = ?"); values.push(validated.inkType) }
  if (validated.coverFinish !== undefined) { updates.push("cover_finish = ?"); values.push(validated.coverFinish) }
  updates.push("updated_at = ?")
  values.push(now)
  values.push(bookId)
  
  db.run(`UPDATE books SET ${updates.join(", ")} WHERE id = ?`, values)
  saveDb()

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/books/${bookId}`)
}

export async function deleteBook(bookId: string) {
  const db = await getReadyDb()
  const now = new Date().toISOString()
  
  db.run(`UPDATE books SET deleted_at = ? WHERE id = ?`, [now, bookId])
  saveDb()

  revalidatePath("/dashboard")
}

export async function createChapter(bookId: string, title: string): Promise<{ id: string }> {
  const validated = chapterCreateSchema.parse({ title })
  
  const db = await getReadyDb()
  const id = nanoid()
  const now = new Date().toISOString()
  
  const result = db.exec(`SELECT MAX("order") as maxOrder FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL`)
  const maxOrder = result[0]?.values[0]?.[0] as number | null
  const order = (maxOrder ?? -1) + 1
  
  db.run(
    `INSERT INTO chapters (id, book_id, title, "order", content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, bookId, validated.title, order, null, now, now]
  )
  saveDb()

  revalidatePath(`/dashboard/books/${bookId}`)
  return { id }
}

export async function updateChapter(chapterId: string, bookId: string, data: { title?: string; content?: string }) {
  const validated = chapterUpdateSchema.parse(data)
  
  const db = await getReadyDb()
  const now = new Date().toISOString()
  
  const updates: string[] = []
  const values: any[] = []
  
  if (validated.title !== undefined) { updates.push("title = ?"); values.push(validated.title) }
  if (validated.content !== undefined) { updates.push("content = ?"); values.push(validated.content) }
  updates.push("updated_at = ?")
  values.push(now)
  values.push(chapterId)
  
  if (updates.length > 1) {
    db.run(`UPDATE chapters SET ${updates.join(", ")} WHERE id = ?`, values)
    saveDb()
  }

  revalidatePath(`/dashboard/books/${bookId}`)
}

export async function deleteChapter(chapterId: string, bookId: string) {
  const db = await getReadyDb()
  const now = new Date().toISOString()
  
  db.run(`UPDATE chapters SET deleted_at = ? WHERE id = ?`, [now, chapterId])
  saveDb()

  revalidatePath(`/dashboard/books/${bookId}`)
}

export async function updateChapterContent(chapterId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getReadyDb()
    const now = new Date().toISOString()
    
    db.run(`UPDATE chapters SET content = ?, updated_at = ? WHERE id = ?`, [content, now, chapterId])
    saveDb()

    return { success: true }
  } catch (error) {
    console.error("Failed to update chapter content:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getChapters(bookId: string): Promise<Chapter[]> {
  await initDb()
  const db = getDb()
  
  const result = db.exec(`SELECT * FROM chapters WHERE book_id = '${bookId}' AND deleted_at IS NULL ORDER BY "order" ASC`)
  
  if (result.length === 0 || result[0].values.length === 0) {
    return []
  }
  
  const columns = result[0].columns
  return result[0].values.map((row) => {
    const chapter: any = {}
    columns.forEach((col, i) => {
      chapter[col === "book_id" ? "bookId" : col === "created_at" ? "createdAt" : col === "updated_at" ? "updatedAt" : col === "deleted_at" ? "deletedAt" : col] = row[i]
    })
    return chapter as Chapter
  })
}

export async function reorderChapters(bookId: string, chapterIds: string[]): Promise<void> {
  const db = await getReadyDb()
  const now = new Date().toISOString()
  
  chapterIds.forEach((chapterId, index) => {
    db.run(`UPDATE chapters SET "order" = ?, updated_at = ? WHERE id = ?`, [index, now, chapterId])
  })
  
  saveDb()
  revalidatePath(`/dashboard/books/${bookId}`)
}
