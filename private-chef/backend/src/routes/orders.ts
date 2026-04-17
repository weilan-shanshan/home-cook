import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, inArray, asc } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  orders,
  orderItems,
  orderLikes,
  orderShares,
  orderStatusEvents,
  recipes,
  recipeImages,
  users,
} from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { createNotificationEvent } from '../services/notification-service.js'
import { resolveImageUrls } from '../lib/image-urls.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createOrderSchema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        recipe_id: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
      }),
    )
    .min(1),
})

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'preparing', 'completed', 'cancelled']),
})

const VALID_TRANSITIONS: Record<string, string> = {
  pending: 'confirmed',
  submitted: 'confirmed',
  confirmed: 'preparing',
  preparing: 'completed',
}

const KNOWN_STATUSES = new Set(['pending', 'submitted', 'confirmed', 'preparing', 'completed', 'cancelled'])

const ordersRouter = new Hono<AuthEnv>()

ordersRouter.use('*', authMiddleware)

async function mapItemRow(item: {
  id: number
  recipeId: number
  quantity: number
  recipeTitle: string
  imageUrl: string | null
  thumbUrl: string | null
}) {
  const image = await resolveImageUrls(item.imageUrl, item.thumbUrl)

  return {
    id: item.id,
    recipeId: item.recipeId,
    quantity: item.quantity,
    recipeTitle: item.recipeTitle,
    image: image
      ? { url: image.url, thumbUrl: image.thumbUrl }
      : null,
  }
}

function normalizeOrderStatus(status: string) {
  return status === 'pending' ? 'submitted' : status
}

function getStatusUpdatePatch(targetStatus: 'confirmed' | 'preparing' | 'completed' | 'cancelled') {
  if (targetStatus === 'completed') {
    return { status: targetStatus, completedAt: new Date().toISOString(), cancelledAt: null }
  }

  if (targetStatus === 'cancelled') {
    return { status: targetStatus, cancelledAt: new Date().toISOString(), completedAt: null }
  }

  return { status: targetStatus, completedAt: null, cancelledAt: null }
}

ordersRouter.get('/', async (c) => {
  const familyId = c.get('familyId')
  const statusFilter = c.req.query('status')
  const mealDateFilter = c.req.query('meal_date')

  if (statusFilter && !KNOWN_STATUSES.has(statusFilter)) {
    return c.json({ error: 'Invalid status filter' }, 400)
  }

  const conditions = [eq(orders.familyId, familyId)]
  if (statusFilter) {
    conditions.push(eq(orders.status, statusFilter))
  }
  if (mealDateFilter) {
    conditions.push(eq(orders.mealDate, mealDateFilter))
  }

  const orderRows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      cookUserId: orders.cookUserId,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(orders.createdAt)

  if (orderRows.length === 0) {
    return c.json([])
  }

  const orderIds = orderRows.map((o) => o.id)

  const itemRows = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
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
      and(
        eq(recipeImages.recipeId, recipes.id),
        eq(recipeImages.sortOrder, 0),
      ),
    )
    .where(inArray(orderItems.orderId, orderIds))

  const itemsByOrder = new Map<number, typeof itemRows>()
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }

  const result = await Promise.all(
    orderRows.map(async (order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
      items: await Promise.all((itemsByOrder.get(order.id) ?? []).map(mapItemRow)),
    })),
  )

  return c.json(result)
})

ordersRouter.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const { meal_type, meal_date, note, items } = parsed.data

  const recipeIds = items.map((i) => i.recipe_id)
  const uniqueRecipeIds = [...new Set(recipeIds)]

  const familyRecipes = await db
    .select({ id: recipes.id, title: recipes.title })
    .from(recipes)
    .where(
      and(
        eq(recipes.familyId, familyId),
        inArray(recipes.id, uniqueRecipeIds),
      ),
    )

  if (familyRecipes.length !== uniqueRecipeIds.length) {
    return c.json({ error: 'One or more recipes not found in your family' }, 400)
  }

  const orderId = sqlite.transaction(() => {
    const insertOrder = sqlite
      .prepare(
        'INSERT INTO orders (family_id, user_id, meal_type, meal_date, note, status) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(familyId, user.id, meal_type, meal_date, note ?? null, 'submitted')
    const id = Number(insertOrder.lastInsertRowid)

    const insertItem = sqlite.prepare(
      'INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)',
    )
    for (const item of items) {
      insertItem.run(id, item.recipe_id, item.quantity)
    }

    sqlite
      .prepare(
        'INSERT INTO order_status_events (order_id, from_status, to_status, operator_id, note) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, null, 'submitted', user.id, 'Order created')

    return id
  })()

  const recipeTitleById = new Map(
    familyRecipes.map((r) => [r.id, r.title]),
  )
  const recipeTitles = uniqueRecipeIds.map((id) => recipeTitleById.get(id)!)
  await createNotificationEvent({
    familyId,
    eventType: 'order_created',
    entityType: 'order',
    entityId: orderId,
    payload: {
      orderId,
      userName: user.displayName,
      mealType: meal_type,
      items: recipeTitles,
      message: `🍽️ ${user.displayName}点了${meal_type}：${recipeTitles.join('、')}`,
    },
  })

  const [created] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      cookUserId: orders.cookUserId,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  const createdItems = await db
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
      and(
        eq(recipeImages.recipeId, recipes.id),
        eq(recipeImages.sortOrder, 0),
      ),
    )
    .where(eq(orderItems.orderId, orderId))

  const likeRows = await db
    .select({ userId: orderLikes.userId })
    .from(orderLikes)
    .where(eq(orderLikes.orderId, orderId))

  const shareRows = await db
    .select({ id: orderShares.id })
    .from(orderShares)
    .where(eq(orderShares.orderId, orderId))

  return c.json(
    {
      ...created,
      status: normalizeOrderStatus(created.status),
      items: await Promise.all(createdItems.map(mapItemRow)),
    },
    201,
  )
})

ordersRouter.get('/:id', async (c) => {
  const orderId = Number(c.req.param('id'))
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const familyId = c.get('familyId')

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      requesterDisplayName: users.displayName,
      cookUserId: orders.cookUserId,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
      completedAt: orders.completedAt,
      cancelledAt: orders.cancelledAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(and(eq(orders.id, orderId), eq(orders.familyId, familyId)))
    .limit(1)

  if (!order) {
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
      and(
        eq(recipeImages.recipeId, recipes.id),
        eq(recipeImages.sortOrder, 0),
      ),
    )
    .where(eq(orderItems.orderId, orderId))

  const likeRows = await db
    .select({ userId: orderLikes.userId })
    .from(orderLikes)
    .where(eq(orderLikes.orderId, orderId))

  const shareRows = await db
    .select({ id: orderShares.id })
    .from(orderShares)
    .where(eq(orderShares.orderId, orderId))

  const timelineRows = await db
    .select({
      id: orderStatusEvents.id,
      fromStatus: orderStatusEvents.fromStatus,
      toStatus: orderStatusEvents.toStatus,
      operatorId: orderStatusEvents.operatorId,
      operatorDisplayName: users.displayName,
      note: orderStatusEvents.note,
      createdAt: orderStatusEvents.createdAt,
    })
    .from(orderStatusEvents)
    .leftJoin(users, eq(orderStatusEvents.operatorId, users.id))
    .where(eq(orderStatusEvents.orderId, orderId))
    .orderBy(asc(orderStatusEvents.createdAt), asc(orderStatusEvents.id))

  const cook = order.cookUserId
    ? await db
        .select({ id: users.id, displayName: users.displayName })
        .from(users)
        .where(eq(users.id, order.cookUserId))
        .limit(1)
    : []

  const currentUserId = c.get('user').id
  const likeCount = likeRows.length
  const isLikedByMe = likeRows.some((row) => row.userId === currentUserId)
  const shareCount = shareRows.length

  return c.json({
    id: order.id,
    userId: order.userId,
    cookUserId: order.cookUserId,
    mealType: order.mealType,
    mealDate: order.mealDate,
    note: order.note,
    status: normalizeOrderStatus(order.status),
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    requester: {
      userId: order.userId,
      displayName: order.requesterDisplayName,
    },
    cook: order.cookUserId && cook[0]
      ? {
          userId: cook[0].id,
          displayName: cook[0].displayName,
        }
      : null,
    likeCount,
    isLikedByMe,
    shareCount,
    items: await Promise.all(itemRows.map(mapItemRow)),
    statusTimeline: timelineRows.map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus ? normalizeOrderStatus(event.fromStatus) : null,
      toStatus: normalizeOrderStatus(event.toStatus),
      operatorId: event.operatorId,
      operatorDisplayName: event.operatorDisplayName ?? null,
      note: event.note,
      createdAt: event.createdAt,
    })),
  })
})

ordersRouter.put('/:id/status', async (c) => {
  const orderId = Number(c.req.param('id'))
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return c.json({ error: 'Invalid order id' }, 400)
  }

  const body = await c.req.json()
  const parsed = updateStatusSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const familyId = c.get('familyId')
  const targetStatus = parsed.data.status

  const [order] = await db
    .select({ id: orders.id, status: orders.status, userId: orders.userId })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.familyId, familyId)))
    .limit(1)

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const currentStatus = normalizeOrderStatus(order.status)
  const allowedNext = targetStatus === 'cancelled' && currentStatus !== 'completed'
    ? 'cancelled'
    : VALID_TRANSITIONS[currentStatus]
  if (allowedNext !== targetStatus) {
    return c.json(
      {
        error: `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
      },
      400,
    )
  }

  const [updated] = await db
    .update(orders)
    .set(getStatusUpdatePatch(targetStatus))
    .where(and(eq(orders.id, orderId), eq(orders.familyId, familyId)))
    .returning({
      id: orders.id,
      status: orders.status,
      userId: orders.userId,
    })

  await db.insert(orderStatusEvents).values({
    orderId,
    fromStatus: currentStatus,
    toStatus: targetStatus,
    operatorId: c.get('user').id,
    note: `Order status updated to ${targetStatus}`,
  })

  await createNotificationEvent({
    familyId,
    eventType: 'order_status_updated',
    entityType: 'order',
    entityId: orderId,
    payload: {
      orderId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      userId: updated.userId,
      message: `📦 订单 #${orderId} 状态更新：${currentStatus} → ${targetStatus}`,
    },
  })

  return c.json({
    id: updated.id,
    status: normalizeOrderStatus(updated.status),
  })
})

export { ordersRouter }
