import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import { users, families, familyMembers } from '../db/schema.js'
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from '../lib/auth.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

const registerSchema = z.object({
  username: z.string().trim().min(1).max(50),
  display_name: z.string().trim().min(1).max(100),
  password: z.string().min(6).max(128),
  mode: z.enum(['create', 'join']),
  invite_code: z.string().optional(),
})

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

function setSessionCookie(c: Parameters<typeof setCookie>[0], sessionId: string) {
  setCookie(c, 'session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const authRouter = new Hono<AuthEnv>()

authRouter.post('/register', async (c) => {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400
    )
  }

  const { username, display_name, password, mode, invite_code } = parsed.data
  const normalizedInviteCode = invite_code?.trim().toUpperCase()

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (existing) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  const passwordHash = await hashPassword(password)

  if (mode === 'create') {
    const result = sqlite.transaction(() => {
      const insertUser = sqlite
        .prepare(
          'INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
        )
        .run(username, display_name, passwordHash, 'admin')
      const userId = Number(insertUser.lastInsertRowid)

      let inviteCode = generateInviteCode()
      for (let i = 0; i < 5; i++) {
        const collision = sqlite
          .prepare('SELECT id FROM families WHERE invite_code = ?')
          .get(inviteCode)
        if (!collision) break
        inviteCode = generateInviteCode()
      }

      const insertFamily = sqlite
        .prepare(
          'INSERT INTO families (name, invite_code, created_by) VALUES (?, ?, ?)'
        )
        .run(`${display_name}的家庭`, inviteCode, userId)
      const familyId = Number(insertFamily.lastInsertRowid)

      sqlite
        .prepare(
          'INSERT INTO family_members (family_id, user_id) VALUES (?, ?)'
        )
        .run(familyId, userId)

      return { userId, familyId, inviteCode }
    })()

    const session = createSession(sqlite, result.userId)
    setSessionCookie(c, session.id)

    return c.json(
      {
        id: result.userId,
        username,
        display_name,
        role: 'admin',
        familyId: result.familyId,
        inviteCode: result.inviteCode,
      },
      201
    )
  }

  if (!normalizedInviteCode) {
    return c.json({ error: 'Invite code is required' }, 400)
  }

  const [family] = await db
    .select({ id: families.id })
    .from(families)
    .where(eq(families.inviteCode, normalizedInviteCode))
    .limit(1)

  if (!family) {
    return c.json({ error: 'Invalid invite code' }, 400)
  }

  const userResult = sqlite.transaction(() => {
    const insertUser = sqlite
      .prepare(
        'INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
      )
      .run(username, display_name, passwordHash, 'member')
    const userId = Number(insertUser.lastInsertRowid)

    sqlite
      .prepare('INSERT INTO family_members (family_id, user_id) VALUES (?, ?)')
      .run(family.id, userId)

    return { userId }
  })()

  const session = createSession(sqlite, userResult.userId)
  setSessionCookie(c, session.id)

  return c.json(
    {
      id: userResult.userId,
      username,
      display_name,
      role: 'member',
      familyId: family.id,
    },
    201
  )
})

authRouter.post('/login', async (c) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400
    )
  }

  const { username, password } = parsed.data

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      passwordHash: users.passwordHash,
      role: users.role,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    return c.json({ error: 'Invalid username or password' }, 401)
  }

  const valid = await verifyPassword(user.passwordHash, password)
  if (!valid) {
    return c.json({ error: 'Invalid username or password' }, 401)
  }

  const [membership] = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(eq(familyMembers.userId, user.id))
    .limit(1)

  const session = createSession(sqlite, user.id)
  setSessionCookie(c, session.id)

  return c.json({
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    role: user.role,
    familyId: membership?.familyId ?? null,
  })
})

authRouter.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    deleteSession(sqlite, sessionId)
  }
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ success: true })
})

authRouter.use('/me', authMiddleware)
authRouter.get('/me', (c) => {
  const user = c.get('user')
  const familyId = c.get('familyId')
  return c.json({
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    role: user.role,
    familyId,
  })
})

export { authRouter }
