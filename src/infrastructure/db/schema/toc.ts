import { pgTable, text, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { books } from "./books"

export const tocEntries = pgTable("toc_entries", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  level: integer("level").notNull().default(1),
  anchorId: text("anchor_id"),
  position: integer("position").notNull().default(0),
  isCustom: integer("is_custom").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
  deletedAt: text("deleted_at"),
}, (table) => ({
  bookIdIdx: index("toc_entries_book_id_idx").on(table.bookId),
}))
