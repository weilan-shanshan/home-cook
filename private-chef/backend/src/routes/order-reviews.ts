import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { orderReviews, orders, users } from '../db/schema.js'
import { createNotificationEvent } from '../services/notification-service.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createOrderReviewSchema = z.object({
  score: z.number().int().min(1).max(5),
  tasteScore: z.number().int().min(1).max(5),
  portionScore: z.number().int().min(1).max(5),
  overallNote: z.string().trim().max(1000).optional(),
})

const orderReviewsRouter = new Hono<AuthEnv>()

orderReviewsRouter.use('*', authMiddleware)

function parsePositiveInt(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

async function findFamilyOrder(orderId: number, familyId: number) {
  const [order] = await db
    .select({ id: orders.id, familyId: orders.familyId, userId: orders.userId })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.familyId, familyId)))
    .limit(1)

  return order
}

orderReviewsRouter.get('/:id/reviews', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const reviewRows = await db
    .select({
      id: orderReviews.id,
      orderId: orderReviews.orderId,
      userId: orderReviews.userId,
      displayName: users.displayName,
      score: orderReviews.score,
      tasteScore: orderReviews.tasteScore,
      portionScore: orderReviews.portionScore,
      overallNote: orderReviews.overallNote,
      createdAt: orderReviews.createdAt,
    })
    .from(orderReviews)
    .innerJoin(users, eq(orderReviews.userId, users.id))
    .where(eq(orderReviews.orderId, order.id))
    .orderBy(desc(orderReviews.createdAt), desc(orderReviews.id))

  return c.json(
    reviewRows.map((row) => ({
      id: row.id,
      order_id: row.orderId,
      user_id: row.userId,
      display_name: row.displayName,
      score: row.score,
      taste_score: row.tasteScore,
      portion_score: row.portionScore,
      overall_note: row.overallNote,
      created_at: row.createdAt,
    })),
  )
})

orderReviewsRouter.post('/:id/reviews', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const body = await c.req.json()
  const parsed = createOrderReviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const [existingReview] = await db
    .select({ id: orderReviews.id })
    .from(orderReviews)
    .where(
      and(eq(orderReviews.orderId, order.id), eq(orderReviews.userId, user.id)),
    )
    .limit(1)

  if (existingReview) {
    return c.json({ error: 'You have already reviewed this order' }, 409)
  }

  const insertValues: typeof orderReviews.$inferInsert = {
    orderId: order.id,
    userId: user.id,
    score: parsed.data.score,
    tasteScore: parsed.data.tasteScore,
    portionScore: parsed.data.portionScore,
    overallNote: parsed.data.overallNote ?? null,
  }

  try {
    const [created] = await db.insert(orderReviews).values(insertValues).returning({
      id: orderReviews.id,
      orderId: orderReviews.orderId,
      userId: orderReviews.userId,
      score: orderReviews.score,
      tasteScore: orderReviews.tasteScore,
      portionScore: orderReviews.portionScore,
      overallNote: orderReviews.overallNote,
      createdAt: orderReviews.createdAt,
    })

    await createNotificationEvent({
      familyId,
      eventType: 'order_review_created',
      entityType: 'order',
      entityId: order.id,
      payload: {
        orderId: order.id,
        reviewId: created.id,
        userId: user.id,
        userName: user.displayName,
        score: created.score,
        tasteScore: created.tasteScore,
        portionScore: created.portionScore,
        overallNote: created.overallNote,
        message: `⭐ ${user.displayName}评价了订单 #${order.id}`,
      },
    })

    return c.json(
      {
        id: created.id,
        order_id: created.orderId,
        user_id: created.userId,
        display_name: user.displayName,
        score: created.score,
        taste_score: created.tasteScore,
        portion_score: created.portionScore,
        overall_note: created.overallNote,
        created_at: created.createdAt,
      },
      201,
    )
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return c.json({ error: 'You have already reviewed this order' }, 409)
    }

    throw error
  }
})

export { orderReviewsRouter }
