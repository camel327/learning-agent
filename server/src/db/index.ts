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

    CREATE TABLE IF NOT EXISTS learning_plans (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      content TEXT NOT NULL,
      conversation_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
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

// ---- Conversation 存取 ----

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface StoredMessage {
  id: number
  conversation_id: string
  role: string
  content: string
  created_at: string
}

export function createConversation(id: string, title: string) {
  getDb().prepare(
    'INSERT INTO conversations (id, title) VALUES (?, ?)'
  ).run(id, title)
}

export function updateConversationTitle(id: string, title: string) {
  getDb().prepare(
    'UPDATE conversations SET title = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(title, id)
}

export function getConversations(): Conversation[] {
  return getDb().prepare(
    'SELECT * FROM conversations ORDER BY updated_at DESC'
  ).all() as Conversation[]
}

export function getConversation(id: string): Conversation | undefined {
  return getDb().prepare(
    'SELECT * FROM conversations WHERE id = ?'
  ).get(id) as Conversation | undefined
}

export function deleteConversation(id: string) {
  getDb().prepare('DELETE FROM messages WHERE conversation_id = ?').run(id)
  getDb().prepare('DELETE FROM conversations WHERE id = ?').run(id)
}

export function saveMessage(conversationId: string, role: string, content: string) {
  getDb().prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(conversationId, role, content)

  // 更新对话的 updated_at
  getDb().prepare(
    'UPDATE conversations SET updated_at = datetime(\'now\') WHERE id = ?'
  ).run(conversationId)
}

export function getMessages(conversationId: string): StoredMessage[] {
  return getDb().prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC'
  ).all(conversationId) as StoredMessage[]
}

// ---- Learning Plans 存取 ----

export interface LearningPlan {
  id: string
  topic: string
  content: string
  conversation_id: string | null
  created_at: string
}

export function savePlan(id: string, topic: string, content: string, conversationId?: string) {
  getDb().prepare(
    'INSERT INTO learning_plans (id, topic, content, conversation_id) VALUES (?, ?, ?, ?)'
  ).run(id, topic, content, conversationId || null)
}

export function getPlans(): LearningPlan[] {
  return getDb().prepare(
    'SELECT * FROM learning_plans ORDER BY created_at DESC'
  ).all() as LearningPlan[]
}

export function getPlan(id: string): LearningPlan | undefined {
  return getDb().prepare(
    'SELECT * FROM learning_plans WHERE id = ?'
  ).get(id) as LearningPlan | undefined
}

export function deletePlan(id: string) {
  getDb().prepare('DELETE FROM learning_plans WHERE id = ?').run(id)
}
