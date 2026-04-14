import { hash, verify } from '@node-rs/argon2'
import type Database from 'better-sqlite3'

export type Session = {
  id: string
  userId: number
  expiresAt: Date
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password)
}

export async function verifyPassword(
  hashedPassword: string,
  password: string
): Promise<boolean> {
  return verify(hashedPassword, password)
}

export function createSession(db: Database.Database, userId: number): Session {
  const id = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  const expiresAtMs = expiresAt.getTime()

  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(id, userId, expiresAtMs)

  return { id, userId, expiresAt }
}

export function validateSession(
  db: Database.Database,
  sessionId: string
): Session | null {
  const row = db
    .prepare('SELECT id, user_id, expires_at FROM sessions WHERE id = ?')
    .get(sessionId) as { id: string; user_id: number; expires_at: number } | undefined

  if (!row) return null

  const expiresAt = new Date(row.expires_at)
  if (expiresAt < new Date()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return null
  }

  return { id: row.id, userId: row.user_id, expiresAt }
}

export function deleteSession(db: Database.Database, sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
}
