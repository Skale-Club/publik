import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { books } from "./books"

export const covers = pgTable("covers", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  frontCoverUrl: text("front_cover_url"),
  frontCoverWidth: integer("front_cover_width"),
  frontCoverHeight: integer("front_cover_height"),
  backCoverType: text("back_cover_type").default("text"),
  backCoverImageUrl: text("back_cover_image_url"),
  backCoverImageWidth: integer("back_cover_image_width"),
  backCoverImageHeight: integer("back_cover_image_height"),
  backCoverText: text("back_cover_text"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
  deletedAt: text("deleted_at"),
})
