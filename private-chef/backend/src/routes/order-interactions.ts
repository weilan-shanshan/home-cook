import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { orderItems, orderLikes, orders, orderShares, recipeImages, recipes } from '../db/schema.js'
import { createNotificationEvent } from '../services/notification-service.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createOrderShareSchema = z.object({
  shareType: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50),
})

const orderInteractionsRouter = new Hono<AuthEnv>()

orderInteractionsRouter.use('*', authMiddleware)

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

orderInteractionsRouter.post('/:id/like', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const [existingLike] = await db
    .select({
      orderId: orderLikes.orderId,
      userId: orderLikes.userId,
      createdAt: orderLikes.createdAt,
    })
    .from(orderLikes)
    .where(
      and(eq(orderLikes.orderId, order.id), eq(orderLikes.userId, user.id)),
    )
    .limit(1)

  if (existingLike) {
    return c.json({
      order_id: existingLike.orderId,
      user_id: existingLike.userId,
      liked: true,
      created_at: existingLike.createdAt,
    })
  }

  try {
    const [created] = await db
      .insert(orderLikes)
      .values({ orderId: order.id, userId: user.id })
      .returning({
        orderId: orderLikes.orderId,
        userId: orderLikes.userId,
        createdAt: orderLikes.createdAt,
      })

    await createNotificationEvent({
      familyId,
      eventType: 'order_liked',
      entityType: 'order',
      entityId: order.id,
      payload: {
        orderId: order.id,
        userId: user.id,
        userName: user.displayName,
        message: `❤️ ${user.displayName}点赞了订单 #${order.id}`,
      },
    })

    return c.json(
      {
        order_id: created.orderId,
        user_id: created.userId,
        liked: true,
        created_at: created.createdAt,
      },
      201,
    )
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      const [likedOrder] = await db
        .select({
          orderId: orderLikes.orderId,
          userId: orderLikes.userId,
          createdAt: orderLikes.createdAt,
        })
        .from(orderLikes)
        .where(
          and(eq(orderLikes.orderId, order.id), eq(orderLikes.userId, user.id)),
        )
        .limit(1)

      if (likedOrder) {
        return c.json({
          order_id: likedOrder.orderId,
          user_id: likedOrder.userId,
          liked: true,
          created_at: likedOrder.createdAt,
        })
      }
    }

    throw error
  }
})

orderInteractionsRouter.delete('/:id/like', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  await db
    .delete(orderLikes)
    .where(and(eq(orderLikes.orderId, order.id), eq(orderLikes.userId, user.id)))

  return c.json({
    order_id: order.id,
    user_id: user.id,
    liked: false,
  })
})

orderInteractionsRouter.post('/:id/share', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const body = await c.req.json()
  const parsed = createOrderShareSchema.safeParse(body)
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
    .insert(orderShares)
    .values({
      orderId: order.id,
      userId: user.id,
      shareType: parsed.data.shareType,
      channel: parsed.data.channel,
    })
    .returning({
      id: orderShares.id,
      orderId: orderShares.orderId,
      userId: orderShares.userId,
      shareType: orderShares.shareType,
      channel: orderShares.channel,
      createdAt: orderShares.createdAt,
    })

  await createNotificationEvent({
    familyId,
    eventType: 'order_shared',
    entityType: 'order',
    entityId: order.id,
    payload: {
      orderId: order.id,
      userId: user.id,
      userName: user.displayName,
      shareType: created.shareType,
      channel: created.channel,
      message: `🔗 ${user.displayName}分享了订单 #${order.id}`,
    },
  })

  return c.json(
    {
      id: created.id,
      order_id: created.orderId,
      user_id: created.userId,
      share_type: created.shareType,
      channel: created.channel,
      created_at: created.createdAt,
    },
    201,
  )
})

orderInteractionsRouter.get('/:id/share-card', async (c) => {
  const orderId = parsePositiveInt(c.req.param('id'))
  if (orderId === null) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const familyId = c.get('familyId')
  const order = await findFamilyOrder(orderId, familyId)
  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const [orderRow] = await db
    .select({
      id: orders.id,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.id, order.id), eq(orders.familyId, familyId)))
    .limit(1)

  if (!orderRow) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const itemRows = await db
    .select({
      id: orderItems.id,
      recipeId: orderItems.recipeId,
      quantity: orderItems.quantity,
      recipeTitle: recipes.title,
      imageUrl: recipeImages.url,
      thumbUrl: recipeImages.thumbUrl,
    })
    .from(orderItems)
    .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
    .leftJoin(
      recipeImages,
      and(eq(recipeImages.recipeId, recipes.id), eq(recipeImages.sortOrder, 0)),
    )
    .where(eq(orderItems.orderId, order.id))

  const likeCountRows = await db
    .select({ userId: orderLikes.userId })
    .from(orderLikes)
    .where(eq(orderLikes.orderId, order.id))

  return c.json({
    order: {
      id: orderRow.id,
      mealType: orderRow.mealType,
      mealDate: orderRow.mealDate,
      note: orderRow.note,
      status: orderRow.status,
      createdAt: orderRow.createdAt,
    },
    items: itemRows.map((item) => ({
      id: item.id,
      recipeId: item.recipeId,
      quantity: item.quantity,
      recipeTitle: item.recipeTitle,
      image: item.imageUrl
        ? {
            url: item.imageUrl,
            thumbUrl: item.thumbUrl,
          }
        : null,
    })),
    likeCount: likeCountRows.length,
  })
})

export { orderInteractionsRouter }
