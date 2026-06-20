// SQLite 数据库初始化
// TODO: P6 完善

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '../../data.db')

let db: Database.Database | null = null

/**
 * 获取数据库实例（懒初始化）
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initTables(db)
  }
  return db
}

/**
 * 初始化表结构
 */
function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ---- Config 存取 ----

export function getConfigValue(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setConfigValue(key: string, value: string) {
  getDb().prepare(`
    INSERT INTO config (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value)
}

export function deleteConfigValue(key: string) {
  getDb().prepare('DELETE FROM config WHERE key = ?').run(key)
}
