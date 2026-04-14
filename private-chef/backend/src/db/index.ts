import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database, { type Database as DatabaseType } from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'
import { env } from '../lib/env.js'

const dir = dirname(env.DATABASE_PATH)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

export const sqlite: DatabaseType = new Database(env.DATABASE_PATH)

sqlite.pragma('journal_mode = WAL')
sqlite.pragma('busy_timeout = 5000')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('foreign_keys = ON')
sqlite.pragma('cache_size = -8000')

export const db = drizzle(sqlite, { schema })
