#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Run pending drizzle migrations with self-healing for out-of-sync journals.
 *
 * Why not `npx drizzle-kit migrate`?
 *   drizzle-kit migrate strictly requires that __drizzle_migrations agrees
 *   with reality. If anyone ever ran `drizzle-kit push` or applied a .sql
 *   file by hand, the journal misses entries and the next `migrate` blows
 *   up with "table already exists" before it ever reaches the new SQL.
 *
 * This script:
 *   1. Reads drizzle/meta/_journal.json to discover migration files.
 *   2. Hashes each file the same way drizzle does (join statements with \n
 *      after splitting on `--> statement-breakpoint`).
 *   3. Skips migrations whose hash is already registered.
 *   4. For unregistered migrations, runs each statement. If a statement
 *      fails with "already exists" or "duplicate column", we treat it as
 *      idempotent and continue. Other errors fail loudly.
 *   5. Registers the hash on success so future runs are a no-op.
 *
 * Safe to run repeatedly. Safe to run after a partial manual apply.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Database = require('better-sqlite3')

const DB_PATH = process.env.DATABASE_PATH ?? './data/private-chef.db'
const MIGRATIONS_DIR = path.join(__dirname, '..', 'drizzle')

if (!fs.existsSync(DB_PATH)) {
  console.error(`[migrate] DB not found at ${DB_PATH}`)
  process.exit(1)
}

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    created_at INTEGER
  )
`)

const journalPath = path.join(MIGRATIONS_DIR, 'meta', '_journal.json')
if (!fs.existsSync(journalPath)) {
  console.log('[migrate] no _journal.json — nothing to do')
  process.exit(0)
}
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'))
const entries = journal.entries ?? []

const appliedHashes = new Set(
  db.prepare('SELECT hash FROM __drizzle_migrations').all().map((r) => r.hash),
)

const insertJournal = db.prepare(
  'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
)

let applied = 0
let registeredOnly = 0
let skipped = 0

for (const entry of entries) {
  const file = `${entry.tag}.sql`
  const fullPath = path.join(MIGRATIONS_DIR, file)
  if (!fs.existsSync(fullPath)) {
    console.warn(`[migrate] WARN ${file} missing on disk — skipping`)
    continue
  }
  const raw = fs.readFileSync(fullPath, 'utf8')
  const statements = raw
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)
  const joined = statements.join('\n')
  const hash = crypto.createHash('sha256').update(joined).digest('hex')

  if (appliedHashes.has(hash)) {
    skipped++
    continue
  }

  let touchedSchema = false
  let fatal = null
  for (const stmt of statements) {
    try {
      db.exec(stmt)
      touchedSchema = true
    } catch (err) {
      const msg = String(err && err.message ? err.message : '')
      if (msg.includes('already exists') || msg.includes('duplicate column')) {
        // Idempotent: assume someone applied this statement before us.
        continue
      }
      fatal = err
      break
    }
  }

  if (fatal) {
    console.error(`[migrate] FAILED on ${file}:`, fatal.message)
    process.exit(1)
  }

  insertJournal.run(hash, Date.now())
  appliedHashes.add(hash)
  if (touchedSchema) {
    console.log(`[migrate] ${file} applied`)
    applied++
  } else {
    console.log(`[migrate] ${file} already in schema, registered hash`)
    registeredOnly++
  }
}

db.close()
console.log(
  `[migrate] done. applied=${applied}, registered-only=${registeredOnly}, skipped=${skipped}`,
)
