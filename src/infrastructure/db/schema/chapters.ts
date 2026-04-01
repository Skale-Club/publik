import { pgTable, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { books } from "./books"

export const chapters = pgTable("chapters", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  content: text("content"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
  deletedAt: text("deleted_at"),
})
