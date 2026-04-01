import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import path from "path"
import * as schema from "./schema"

const isVercel = !!process.env.VERCEL

const DB_FILENAME = "publik.db"
const DB_PATH = isVercel
  ? path.join("/tmp", DB_FILENAME)
  : path.join(process.cwd(), DB_FILENAME)

const sqlite = new Database(DB_PATH)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")

const drizzleDb = drizzle(sqlite, { schema })

if (isVercel) {
  const migrationsPath = path.join(process.cwd(), "drizzle")
  try {
    migrate(drizzleDb, { migrationsFolder: migrationsPath })
  } catch {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT DEFAULT '',
        description TEXT,
        trim_size_id TEXT DEFAULT '6x9',
        paper_type TEXT DEFAULT 'white',
        ink_type TEXT DEFAULT 'bw',
        cover_finish TEXT DEFAULT 'matte',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        content TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS covers (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
        front_cover_url TEXT,
        front_cover_width INTEGER,
        front_cover_height INTEGER,
        back_cover_type TEXT DEFAULT 'text',
        back_cover_image_url TEXT,
        back_cover_image_width INTEGER,
        back_cover_image_height INTEGER,
        back_cover_text TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS toc_entries (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        anchor_id TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );
    `)
  }
}

export const db = drizzleDb
