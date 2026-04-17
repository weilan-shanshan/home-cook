import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { orderComments, orders, users } from '../db/schema.js'
import { createNotificationEvent } from '../services/notification-service.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createOrderCommentSchema = z.object({
  content: z.string().trim().min(1).max(500),
  roleType: z.string().trim().min(1).max(50),
})

const orderCommentsRouter = new Hono<AuthEnv>()

orderCommentsRouter.use('*', authMiddleware)

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

orderCommentsRouter.get('/:id/comments', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const commentRows = await db
    .select({
      id: orderComments.id,
      orderId: orderComments.orderId,
      userId: orderComments.userId,
      displayName: users.displayName,
      roleType: orderComments.roleType,
      content: orderComments.content,
      createdAt: orderComments.createdAt,
    })
    .from(orderComments)
    .innerJoin(users, eq(orderComments.userId, users.id))
    .where(eq(orderComments.orderId, order.id))
    .orderBy(desc(orderComments.createdAt), desc(orderComments.id))

  return c.json(
    commentRows.map((row) => ({
      id: row.id,
      order_id: row.orderId,
      user_id: row.userId,
      display_name: row.displayName,
      role_type: row.roleType,
      content: row.content,
      created_at: row.createdAt,
    })),
  )
})

orderCommentsRouter.post('/:id/comments', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const body = await c.req.json()
  const parsed = createOrderCommentSchema.safeParse(body)
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

  const [created] = await db
    .insert(orderComments)
    .values({
      orderId: order.id,
      userId: user.id,
      roleType: parsed.data.roleType,
      content: parsed.data.content,
    })
    .returning({
      id: orderComments.id,
      orderId: orderComments.orderId,
      userId: orderComments.userId,
      roleType: orderComments.roleType,
      content: orderComments.content,
      createdAt: orderComments.createdAt,
    })

  await createNotificationEvent({
    familyId,
    eventType: 'order_comment_created',
    entityType: 'order',
    entityId: order.id,
    payload: {
      orderId: order.id,
      commentId: created.id,
      userId: user.id,
      userName: user.displayName,
      roleType: created.roleType,
      content: created.content,
      message: `💬 ${user.displayName}评论了订单 #${order.id}`,
    },
  })

  return c.json(
    {
      id: created.id,
      order_id: created.orderId,
      user_id: created.userId,
      display_name: user.displayName,
      role_type: created.roleType,
      content: created.content,
      created_at: created.createdAt,
    },
    201,
  )
})

export { orderCommentsRouter }
