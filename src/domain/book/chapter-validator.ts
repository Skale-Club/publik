import { z } from "zod"

export const chapterCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  content: z.string().optional(),
})

export const chapterUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  content: z.string().optional(),
  order: z.number().int().optional(),
})

export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>
