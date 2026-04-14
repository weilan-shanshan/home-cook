import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  orders,
  orderItems,
  recipes,
  recipeImages,
} from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { notifyNewOrder } from '../lib/wechat.js'

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
  status: z.enum(['confirmed', 'completed']),
})

const VALID_TRANSITIONS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'completed',
}

const KNOWN_STATUSES = new Set(['pending', 'confirmed', 'completed'])

const ordersRouter = new Hono<AuthEnv>()

ordersRouter.use('*', authMiddleware)

function mapItemRow(item: {
  id: number
  recipeId: number
  quantity: number
  recipeTitle: string
  imageUrl: string | null
  thumbUrl: string | null
}) {
  return {
    id: item.id,
    recipeId: item.recipeId,
    quantity: item.quantity,
    recipeTitle: item.recipeTitle,
    image: item.imageUrl
      ? { url: item.imageUrl, thumbUrl: item.thumbUrl }
      : null,
  }
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
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
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

  const result = orderRows.map((order) => ({
    ...order,
    items: (itemsByOrder.get(order.id) ?? []).map(mapItemRow),
  }))

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
      .run(familyId, user.id, meal_type, meal_date, note ?? null, 'pending')
    const id = Number(insertOrder.lastInsertRowid)

    const insertItem = sqlite.prepare(
      'INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)',
    )
    for (const item of items) {
      insertItem.run(id, item.recipe_id, item.quantity)
    }

    return id
  })()

  const recipeTitleById = new Map(
    familyRecipes.map((r) => [r.id, r.title]),
  )
  const recipeTitles = uniqueRecipeIds.map((id) => recipeTitleById.get(id)!)
  notifyNewOrder(user.displayName, meal_type, recipeTitles)

  const [created] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
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

  return c.json(
    {
      ...created,
      items: createdItems.map(mapItemRow),
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
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      note: orders.note,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
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

  return c.json({
    ...order,
    items: itemRows.map(mapItemRow),
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
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.familyId, familyId)))
    .limit(1)

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  const allowedNext = VALID_TRANSITIONS[order.status]
  if (allowedNext !== targetStatus) {
    return c.json(
      {
        error: `Cannot transition from '${order.status}' to '${targetStatus}'`,
      },
      400,
    )
  }

  const [updated] = await db
    .update(orders)
    .set({ status: targetStatus })
    .where(eq(orders.id, orderId))
    .returning({
      id: orders.id,
      status: orders.status,
    })

  return c.json(updated)
})

export { ordersRouter }
