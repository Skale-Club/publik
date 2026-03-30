"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { bookCreateSchema, bookUpdateSchema } from "@/domain/book/book-validator"
import { getDb, saveDb } from "@/infrastructure/db/client"

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

  const db = getDb()
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
  
  const db = getDb()
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
  const db = getDb()
  const now = new Date().toISOString()
  
  db.run(`UPDATE books SET deleted_at = ? WHERE id = ?`, [now, bookId])
  saveDb()

  revalidatePath("/dashboard")
}
