import initSqlJs, { Database } from "sql.js"
import fs from "fs"
import path from "path"

let db: Database | null = null
let dbPath: string = ""

function getDbPath(): string {
  if (!dbPath) {
    dbPath = path.join(process.cwd(), "publik.db")
  }
  return dbPath
}

export async function initDb(): Promise<Database> {
  if (db) return db
  
  const SQL = await initSqlJs()
  const filePath = getDbPath()
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }
  
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
