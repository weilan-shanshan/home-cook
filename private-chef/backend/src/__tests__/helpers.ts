import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { webcrypto } from 'node:crypto'
import type Database from 'better-sqlite3'
import { vi } from 'vitest'

type JsonRequestInit = Omit<RequestInit, 'body'> & {
  json?: unknown
  cookie?: string
}

type WechatMock = {
  notify: ReturnType<typeof vi.fn>
  notifyNewOrder: ReturnType<typeof vi.fn>
  notifyNewRecipe: ReturnType<typeof vi.fn>
  notifyNewWish: ReturnType<typeof vi.fn>
}

export type TestContext = {
  sqlite: Database.Database
  db: typeof import('../db/index.js').db
  schema: typeof import('../db/schema.js')
  request: (path: string, init?: JsonRequestInit) => Promise<Response>
  createSessionCookie: (userId: number) => string
  seedFamily: (input: {
    username: string
    displayName: string
    role?: 'admin' | 'member'
    password?: string
    familyName?: string
    inviteCode?: string
  }) => Promise<{ familyId: number; userId: number }>
  seedFamilyMember: (input: {
    familyId: number
    username: string
    displayName: string
    role?: 'admin' | 'member'
    password?: string
  }) => Promise<{ userId: number; familyId: number }>
  seedRecipe: (input: {
    familyId: number
    createdBy: number
    title: string
    imageUrl?: string
    thumbUrl?: string
  }) => { recipeId: number }
  cleanup: () => Promise<void>
  wechatMock?: WechatMock
}

const migrationDir = new URL('../../drizzle/', import.meta.url)

function hasExecutableSql(statement: string) {
  const withoutBlockComments = statement.replace(/\/\*[\s\S]*?\*\//g, '')
  return withoutBlockComments.trim().length > 0
}

async function applyAllMigrations(sqlite: Database.Database) {
  const entries = await readdir(migrationDir)
  const migrationFiles = entries
    .filter((entry) => entry.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))

  for (const fileName of migrationFiles) {
    const migrationSql = await readFile(new URL(fileName, migrationDir), 'utf8')
    const statements = migrationSql.split('--> statement-breakpoint')

    for (const statement of statements) {
      if (!hasExecutableSql(statement)) {
        continue
      }

      sqlite.exec(statement)
    }
  }
}

export function getSessionCookie(response: Response): string | null {
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) {
    return null
  }

  const [cookiePart] = setCookie.split(';')
  return cookiePart.startsWith('session=') ? cookiePart : null
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export async function createTestContext(
  options?: { stubWechat?: boolean; frontendOrigin?: string },
): Promise<TestContext> {
  const tempDir = await mkdtemp(join(tmpdir(), 'private-chef-backend-test-'))
  const dbPath = join(tempDir, 'test.db')
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_PATH: process.env.DATABASE_PATH,
    PORT: process.env.PORT,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    SESSION_SECRET: process.env.SESSION_SECRET,
  }
  const originalCrypto = globalThis.crypto

  process.env.NODE_ENV = 'development'
  process.env.DATABASE_PATH = dbPath
  process.env.PORT = '3000'
  process.env.FRONTEND_ORIGIN = options?.frontendOrigin ?? 'http://localhost:5173'
  process.env.SESSION_SECRET = 'test-session-secret-123456'

  globalThis.crypto = webcrypto as Crypto

  vi.resetModules()

  let wechatMock: WechatMock | undefined
  if (options?.stubWechat) {
    wechatMock = {
      notify: vi.fn(),
      notifyNewOrder: vi.fn(),
      notifyNewRecipe: vi.fn(),
      notifyNewWish: vi.fn(),
    }
    vi.doMock('../lib/wechat.js', () => wechatMock!)
  } else {
    vi.doUnmock('../lib/wechat.js')
  }

  const dbModule = await import('../db/index.js')
  await applyAllMigrations(dbModule.sqlite)

  const schema = await import('../db/schema.js')
  const authLib = await import('../lib/auth.js')
  let appModule: typeof import('../app.js') | null = null

  const request = (path: string, init: JsonRequestInit = {}) => {
    const { json, cookie, headers, ...rest } = init
    const requestHeaders = new Headers(headers)

    let body: BodyInit | undefined
    if (json !== undefined) {
      requestHeaders.set('Content-Type', 'application/json')
      body = JSON.stringify(json)
    }

    if (cookie) {
      requestHeaders.set('Cookie', cookie)
    }

    return Promise.resolve()
      .then(async () => {
        if (!appModule) {
          appModule = await import('../app.js')
        }

        return appModule.app.request(path, {
          ...rest,
          headers: requestHeaders,
          body,
        })
      })
  }

  const createSessionCookie = (userId: number) => {
    const session = authLib.createSession(dbModule.sqlite, userId)
    return `session=${session.id}`
  }

  const seedFamily = async (input: {
    username: string
    displayName: string
    role?: 'admin' | 'member'
    password?: string
    familyName?: string
    inviteCode?: string
  }) => {
    const passwordHash = await authLib.hashPassword(input.password ?? 'password123')
    const role = input.role ?? 'admin'

    return dbModule.sqlite.transaction(() => {
      const userResult = dbModule.sqlite
        .prepare(
          'INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)',
        )
        .run(input.username, input.displayName, passwordHash, role)
      const userId = Number(userResult.lastInsertRowid)

      const familyResult = dbModule.sqlite
        .prepare(
          'INSERT INTO families (name, invite_code, created_by) VALUES (?, ?, ?)',
        )
        .run(
          input.familyName ?? `${input.displayName}的家庭`,
          input.inviteCode ?? `${input.username.toUpperCase().slice(0, 3)}001`,
          userId,
        )
      const familyId = Number(familyResult.lastInsertRowid)

      dbModule.sqlite
        .prepare('INSERT INTO family_members (family_id, user_id) VALUES (?, ?)')
        .run(familyId, userId)

      return { familyId, userId }
    })()
  }

  const seedFamilyMember = async (input: {
    familyId: number
    username: string
    displayName: string
    role?: 'admin' | 'member'
    password?: string
  }) => {
    const passwordHash = await authLib.hashPassword(input.password ?? 'password123')
    const role = input.role ?? 'member'

    const userResult = dbModule.sqlite
      .prepare(
        'INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)',
      )
      .run(input.username, input.displayName, passwordHash, role)
    const userId = Number(userResult.lastInsertRowid)

    dbModule.sqlite
      .prepare('INSERT INTO family_members (family_id, user_id) VALUES (?, ?)')
      .run(input.familyId, userId)

    return { userId, familyId: input.familyId }
  }

  const seedRecipe = (input: {
    familyId: number
    createdBy: number
    title: string
    imageUrl?: string
    thumbUrl?: string
  }) => {
    const recipeResult = dbModule.sqlite
      .prepare(
        `INSERT INTO recipes (family_id, title, description, steps, cook_minutes, servings, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.familyId,
        input.title,
        null,
        JSON.stringify(['prep', 'cook']),
        30,
        2,
        input.createdBy,
      )

    const recipeId = Number(recipeResult.lastInsertRowid)

    if (input.imageUrl) {
      dbModule.sqlite
        .prepare(
          'INSERT INTO recipe_images (recipe_id, url, thumb_url, sort_order) VALUES (?, ?, ?, ?)',
        )
        .run(recipeId, input.imageUrl, input.thumbUrl ?? null, 0)
    }

    return { recipeId }
  }

  const cleanup = async () => {
    const notificationService = await import('../services/notification-service.js')
    if ('shutdownNotificationService' in notificationService) {
      await notificationService.shutdownNotificationService()
    }
    dbModule.sqlite.close()
    vi.doUnmock('../lib/wechat.js')
    vi.resetModules()
    if (originalCrypto) {
      globalThis.crypto = originalCrypto
    } else {
      Reflect.deleteProperty(globalThis, 'crypto')
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    await rm(`${dbPath}-wal`, { force: true })
    await rm(`${dbPath}-shm`, { force: true })
    await rm(dbPath, { force: true })
    await rm(tempDir, { force: true, recursive: true })
  }

  return {
    sqlite: dbModule.sqlite,
    db: dbModule.db,
    schema,
    request,
    createSessionCookie,
    seedFamily,
    seedFamilyMember,
    seedRecipe,
    cleanup,
    wechatMock,
  }
}
