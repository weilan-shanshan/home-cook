import { Hono, type Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import { tags, familyMembers } from '../db/schema.js'
import { validateSession } from '../lib/auth.js'

const createTagSchema = z.object({
  name: z.string().trim().min(1),
})

async function resolveFamily(c: Context) {
  const sessionId = getCookie(c, 'session')
  if (!sessionId) {
    return { error: c.json({ error: 'Unauthorized' }, 401) }
  }

  const session = validateSession(sqlite, sessionId)
  if (!session) {
    return { error: c.json({ error: 'Unauthorized' }, 401) }
  }

  const membership = await db
    .select({ familyId: familyMembers.familyId })
    .from(familyMembers)
    .where(eq(familyMembers.userId, session.userId))
    .limit(1)

  if (membership.length === 0) {
    return { error: c.json({ error: 'No family membership' }, 403) }
  }

  return { userId: session.userId, familyId: membership[0].familyId }
}

const tagsRouter = new Hono()

tagsRouter.get('/', async (c) => {
  const result = await resolveFamily(c)
  if ('error' in result) return result.error

  const rows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.familyId, result.familyId))

  return c.json(rows)
})

tagsRouter.post('/', async (c) => {
  const result = await resolveFamily(c)
  if ('error' in result) return result.error

  const body = await c.req.json()
  const parsed = createTagSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  try {
    const [inserted] = await db
      .insert(tags)
      .values({ familyId: result.familyId, name: parsed.data.name })
      .returning({ id: tags.id, name: tags.name })

    return c.json(inserted, 201)
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('UNIQUE constraint failed')
    ) {
      return c.json({ error: 'Tag already exists in this family' }, 409)
    }
    throw err
  }
})

tagsRouter.delete('/:id', async (c) => {
  const result = await resolveFamily(c)
  if ('error' in result) return result.error

  const tagId = Number(c.req.param('id'))
  if (!Number.isFinite(tagId) || tagId <= 0) {
    return c.json({ error: 'Invalid tag id' }, 400)
  }

  const deleted = await db
    .delete(tags)
    .where(and(eq(tags.id, tagId), eq(tags.familyId, result.familyId)))
    .returning({ id: tags.id })

  if (deleted.length === 0) {
    return c.json({ error: 'Tag not found' }, 404)
  }

  return c.json({ success: true })
})

export { tagsRouter }
