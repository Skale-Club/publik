import initSqlJs, { Database } from "sql.js"
import fs from "fs"
import path from "path"

let db: Database | null = null
let dbPath: string = ""
let wasmPath: string | null = null

function getDbPath(): string {
  if (!dbPath) {
    dbPath = path.join(process.cwd(), "publik.db")
  }
  return dbPath
}

function getWasmPath(): string {
  if (!wasmPath) {
    wasmPath = path.join(process.cwd(), "public", "vendor", "sql.js", "sql-wasm.wasm")
  }

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`sql.js wasm not found at ${wasmPath}`)
  }

  return wasmPath
}

function ensureSchema(database: Database) {
  database.run("PRAGMA foreign_keys = ON")

  database.run(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      trim_size_id TEXT NOT NULL DEFAULT '6x9',
      paper_type TEXT NOT NULL DEFAULT 'white',
      ink_type TEXT NOT NULL DEFAULT 'bw',
      cover_finish TEXT NOT NULL DEFAULT 'matte',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS toc_entries (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      anchor_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)

  database.run(`
    CREATE TABLE IF NOT EXISTS covers (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      front_cover_url TEXT,
      front_cover_width INTEGER,
      front_cover_height INTEGER,
      back_cover_type TEXT,
      back_cover_image_url TEXT,
      back_cover_image_width INTEGER,
      back_cover_image_height INTEGER,
      back_cover_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `)

  database.run(`
    CREATE INDEX IF NOT EXISTS chapters_book_id_order_idx
    ON chapters (book_id, "order")
  `)

  database.run(`
    CREATE INDEX IF NOT EXISTS toc_entries_book_id_position_idx
    ON toc_entries (book_id, position)
  `)

  database.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS covers_book_id_unique_idx
    ON covers (book_id)
  `)
}

export async function initDb(): Promise<Database> {
  if (db) return db
  
  const SQL = await initSqlJs({
    locateFile: () => getWasmPath(),
  })
  const filePath = getDbPath()
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  ensureSchema(db)
  
  return db
}

export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.")
  }
  return db
}

export function saveDb() {
  if (!db) return
  
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(getDbPath(), buffer)
}

export function closeDb() {
  if (db) {
    saveDb()
    db.close()
    db = null
  }
}
