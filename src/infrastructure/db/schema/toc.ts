import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const tocEntries = sqliteTable("toc_entries", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull(),
  title: text("title").notNull(),
  level: integer("level").notNull().default(1),
  anchorId: text("anchor_id"),
  position: integer("position").notNull().default(0),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),
}, (table) => ({
  bookIdIdx: index("toc_entries_book_id_idx").on(table.bookId),
}))
