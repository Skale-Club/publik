import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import { books } from "./books"

export const covers = sqliteTable("covers", {
  id: text("id").primaryKey(),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  
  // Front cover
  frontCoverUrl: text("front_cover_url"),
  frontCoverWidth: integer("front_cover_width"),
  frontCoverHeight: integer("front_cover_height"),
  
  // Back cover - dual mode
  backCoverType: text("back_cover_type", { enum: ["image", "text"] }),
  backCoverImageUrl: text("back_cover_image_url"),
  backCoverImageWidth: integer("back_cover_image_width"),
  backCoverImageHeight: integer("back_cover_image_height"),
  backCoverText: text("back_cover_text"),
  
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
})
