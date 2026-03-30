import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  trimSizeId: text("trim_size_id").notNull().default("6x9"),
  paperType: text("paper_type", { enum: ["white", "cream"] }).notNull().default("white"),
  inkType: text("ink_type", { enum: ["bw", "standard-color", "premium-color"] }).notNull().default("bw"),
  coverFinish: text("cover_finish", { enum: ["glossy", "matte"] }).notNull().default("matte"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),
})
