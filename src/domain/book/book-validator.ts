import { z } from "zod"
import { KDP_TRIM_SIZES } from "@/domain/kdp/trim-sizes"

const trimSizeIds = KDP_TRIM_SIZES.map((s) => s.id)

export const bookCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
  trimSizeId: z.enum(trimSizeIds as [string, ...string[]]).default("6x9"),
  paperType: z.enum(["white", "cream"]).default("white"),
  inkType: z.enum(["bw", "standard-color", "premium-color"]).default("bw"),
  coverFinish: z.enum(["glossy", "matte"]).default("matte"),
})

export const bookUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
  trimSizeId: z.enum(trimSizeIds as [string, ...string[]]).optional(),
  paperType: z.enum(["white", "cream"]).optional(),
  inkType: z.enum(["bw", "standard-color", "premium-color"]).optional(),
  coverFinish: z.enum(["glossy", "matte"]).optional(),
})

export type BookCreateInput = z.infer<typeof bookCreateSchema>
export type BookUpdateInput = z.infer<typeof bookUpdateSchema>
