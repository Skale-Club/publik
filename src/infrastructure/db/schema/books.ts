import { pgTable, text, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default("Author"),
  description: text("description"),
  trimSizeId: text("trim_size_id").notNull().default("6x9"),
  paperType: varchar("paper_type", { length: 20, enum: ["white", "cream"] }).notNull().default("white"),
  inkType: varchar("ink_type", { length: 30, enum: ["bw", "standard-color", "premium-color"] }).notNull().default("bw"),
  coverFinish: varchar("cover_finish", { length: 20, enum: ["glossy", "matte"] }).notNull().default("matte"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
  deletedAt: text("deleted_at"),
})
