import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, sqlite } from '../db/index.js'
import { families, familyMembers, users } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createFamilySchema = z.object({
  name: z.string().trim().min(1).max(100),
})

const joinFamilySchema = z.object({
  invite_code: z.string().trim().length(6),
})

const familiesRouter = new Hono<AuthEnv>()

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const INVITE_CODE_LENGTH = 6
const MAX_INVITE_CODE_ATTEMPTS = 10

function generateInviteCode(): string {
  return Array.from(
    { length: INVITE_CODE_LENGTH },
    () =>
      INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)],
  ).join('')
}

function parseFamilyId(value: string) {
  const familyId = Number(value)
  if (!Number.isFinite(familyId) || familyId <= 0) {
    return null
  }

  return familyId
}

async function isFamilyMember(userId: number, familyId: number) {
  const [membership] = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(
      and(eq(familyMembers.userId, userId), eq(familyMembers.familyId, familyId)),
    )
    .limit(1)

  return Boolean(membership)
}

familiesRouter.use('*', authMiddleware)

familiesRouter.post('/', async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json()
  const parsed = createFamilySchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  try {
    const created = sqlite.transaction(() => {
      for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
        const inviteCode = generateInviteCode()
        const collision = sqlite
          .prepare('SELECT id FROM families WHERE invite_code = ?')
          .get(inviteCode)

        if (collision) {
          continue
        }

        try {
          const insertFamily = sqlite
            .prepare(
              'INSERT INTO families (name, invite_code, created_by) VALUES (?, ?, ?)',
            )
            .run(parsed.data.name, inviteCode, user.id)
          const familyId = Number(insertFamily.lastInsertRowid)

          sqlite
            .prepare('INSERT INTO family_members (family_id, user_id) VALUES (?, ?)')
            .run(familyId, user.id)

          const family = sqlite
            .prepare(
              `SELECT id, name, invite_code, created_by, created_at
               FROM families
               WHERE id = ?`,
            )
            .get(familyId) as
            | {
                id: number
                name: string
                invite_code: string
                created_by: number
                created_at: string
              }
            | undefined

          if (!family) {
            throw new Error('Family creation failed')
          }

          return family
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message.includes('UNIQUE constraint failed: families.invite_code')
          ) {
            continue
          }

          throw error
        }
      }

      throw new Error('Failed to generate unique invite code')
    })()

    return c.json(created, 201)
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'Failed to generate unique invite code'
    ) {
      return c.json({ error: 'Failed to generate invite code' }, 500)
    }

    throw error
  }
})

familiesRouter.get('/:id', async (c) => {
  const familyId = parseFamilyId(c.req.param('id'))
  if (familyId === null) {
    return c.json({ error: 'Invalid family id' }, 400)
  }

  const user = c.get('user')
  const member = await isFamilyMember(user.id, familyId)
  if (!member) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const [family] = await db
    .select({
      id: families.id,
      name: families.name,
      inviteCode: families.inviteCode,
      createdBy: families.createdBy,
      createdAt: families.createdAt,
    })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  if (!family) {
    return c.json({ error: 'Family not found' }, 404)
  }

  return c.json({
    id: family.id,
    name: family.name,
    invite_code: family.inviteCode,
    created_by: family.createdBy,
    created_at: family.createdAt,
  })
})

familiesRouter.get('/:id/members', async (c) => {
  const familyId = parseFamilyId(c.req.param('id'))
  if (familyId === null) {
    return c.json({ error: 'Invalid family id' }, 400)
  }

  const user = c.get('user')
  const member = await isFamilyMember(user.id, familyId)
  if (!member) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const members = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      role: users.role,
      joinedAt: familyMembers.joinedAt,
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId))

  return c.json(
    members.map((memberRow) => ({
      id: memberRow.id,
      display_name: memberRow.displayName,
      role: memberRow.role,
      joined_at: memberRow.joinedAt,
    })),
  )
})

familiesRouter.post('/join', async (c) => {
  const body = await c.req.json()
  const parsed = joinFamilySchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const inviteCode = parsed.data.invite_code.toUpperCase()

  const [family] = await db
    .select({
      id: families.id,
      name: families.name,
      inviteCode: families.inviteCode,
    })
    .from(families)
    .where(eq(families.inviteCode, inviteCode))
    .limit(1)

  if (!family) {
    return c.json({ error: 'Invalid invite code' }, 400)
  }

  const existingMembership = await isFamilyMember(user.id, family.id)
  if (existingMembership) {
    return c.json({ error: 'Already a member of this family' }, 409)
  }

  try {
    const [membership] = await db
      .insert(familyMembers)
      .values({
        familyId: family.id,
        userId: user.id,
      })
      .returning({
        familyId: familyMembers.familyId,
        userId: familyMembers.userId,
        joinedAt: familyMembers.joinedAt,
      })

    return c.json(
      {
        family_id: membership.familyId,
        user_id: membership.userId,
        joined_at: membership.joinedAt,
        family: {
          id: family.id,
          name: family.name,
          invite_code: family.inviteCode,
        },
      },
      201,
    )
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return c.json({ error: 'Already a member of this family' }, 409)
    }

    throw error
  }
})

export { familiesRouter }
