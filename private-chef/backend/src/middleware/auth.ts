import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import { familyMembers, users } from '../db/schema.js'
import { validateSession } from '../lib/auth.js'

export type AuthUser = {
  id: number
  username: string
  displayName: string
  role: string
}

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const sessionId = getCookie(c, 'session')
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const session = validateSession(sqlite, sessionId)
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [membership] = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(eq(familyMembers.userId, user.id))
    .limit(1)

  if (!membership) {
    return c.json({ error: 'No family membership' }, 403)
  }

  c.set('user', user)
  c.set('familyId', membership.familyId)

  await next()
})
