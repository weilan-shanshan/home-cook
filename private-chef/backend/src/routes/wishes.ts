import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { recipes, wishes } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { notifyNewWish } from '../lib/wechat.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createWishSchema = z.object({
  dish_name: z.string().trim().min(1),
  note: z.string().optional(),
})

const updateWishSchema = z.object({
  status: z.enum(['pending', 'fulfilled', 'cancelled']),
  recipe_id: z.number().int().positive().optional(),
})

const wishesRouter = new Hono<AuthEnv>()

wishesRouter.use('*', authMiddleware)

wishesRouter.get('/', async (c) => {
  const familyId = c.get('familyId')
  const statusFilter = c.req.query('status')

  if (
    statusFilter !== undefined &&
    !['pending', 'fulfilled', 'cancelled'].includes(statusFilter)
  ) {
    return c.json({ error: 'Invalid status filter' }, 400)
  }

  const conditions = [eq(wishes.familyId, familyId)]
  if (statusFilter) {
    conditions.push(eq(wishes.status, statusFilter))
  }

  const rows = await db
    .select({
      id: wishes.id,
      familyId: wishes.familyId,
      userId: wishes.userId,
      dishName: wishes.dishName,
      note: wishes.note,
      status: wishes.status,
      recipeId: wishes.recipeId,
      createdAt: wishes.createdAt,
    })
    .from(wishes)
    .where(and(...conditions))
    .orderBy(wishes.createdAt)

  return c.json(rows)
})

wishesRouter.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = createWishSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const { dish_name, note } = parsed.data

  const [created] = await db
    .insert(wishes)
    .values({
      familyId,
      userId: user.id,
      dishName: dish_name,
      note: note ?? null,
      status: 'pending',
      recipeId: null,
    })
    .returning({
      id: wishes.id,
      familyId: wishes.familyId,
      userId: wishes.userId,
      dishName: wishes.dishName,
      note: wishes.note,
      status: wishes.status,
      recipeId: wishes.recipeId,
      createdAt: wishes.createdAt,
    })

  notifyNewWish(user.displayName, created.dishName)

  return c.json(created, 201)
})

wishesRouter.put('/:id', async (c) => {
  const wishId = Number(c.req.param('id'))
  if (!Number.isFinite(wishId) || wishId <= 0) {
    return c.json({ error: 'Invalid wish id' }, 400)
  }

  const body = await c.req.json()
  const parsed = updateWishSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const familyId = c.get('familyId')
  const { status, recipe_id } = parsed.data

  const [wish] = await db
    .select({ id: wishes.id, status: wishes.status })
    .from(wishes)
    .where(and(eq(wishes.id, wishId), eq(wishes.familyId, familyId)))
    .limit(1)

  if (!wish) {
    return c.json({ error: 'Wish not found' }, 404)
  }

  let recipeId: number | null = null
  if (status === 'fulfilled') {
    if (recipe_id !== undefined) {
      const [recipe] = await db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.id, recipe_id), eq(recipes.familyId, familyId)))
        .limit(1)

      if (!recipe) {
        return c.json({ error: 'Recipe not found in your family' }, 400)
      }

      recipeId = recipe.id
    }
  }

  const [updated] = await db
    .update(wishes)
    .set({
      status,
      recipeId: status === 'fulfilled' ? recipeId : null,
    })
    .where(eq(wishes.id, wishId))
    .returning({
      id: wishes.id,
      familyId: wishes.familyId,
      userId: wishes.userId,
      dishName: wishes.dishName,
      note: wishes.note,
      status: wishes.status,
      recipeId: wishes.recipeId,
      createdAt: wishes.createdAt,
    })

  return c.json(updated)
})

export { wishesRouter }
