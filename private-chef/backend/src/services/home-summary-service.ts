import { and, desc, eq, inArray } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  orderComments,
  orderItems,
  orders,
  recipes,
  users,
} from '../db/schema.js'
import { resolveImageUrls } from '../lib/image-urls.js'

type RecipeCardSummary = {
  recipeId: number
  title: string
  orderCount: number
  image: {
    url: string
    thumbUrl: string | null
  } | null
}

type RecentOrderSummary = {
  id: number
  mealType: string
  mealDate: string
  status: string
  createdAt: string
  requester: {
    userId: number
    displayName: string
  }
  recipeTitles: string[]
}

type RecentCommentSummary = {
  id: number
  orderId: number
  userId: number
  displayName: string
  roleType: string
  contentPreview: string
  createdAt: string
}

type ActiveOrderItemSummary = {
  recipeId: number
  recipeTitle: string
  quantity: number
  image: {
    url: string
    thumbUrl: string | null
  } | null
}

export type ActiveOrderSummary = {
  id: number
  mealType: string
  mealDate: string
  status: string
  note: string | null
  createdAt: string
  requester: {
    userId: number
    displayName: string
  }
  cook: {
    userId: number
    displayName: string
  } | null
  items: ActiveOrderItemSummary[]
  isMine: boolean
  canAccept: boolean
}

export type HomeSummary = {
  recommendedRecipes: RecipeCardSummary[]
  frequentRecipes: RecipeCardSummary[]
  recentOrders: RecentOrderSummary[]
  recentComments: RecentCommentSummary[]
  activeOrders: ActiveOrderSummary[]
  achievementSummary: {
    totalOrders: number
    totalCooks: number
  }
}

type RecipeStatsRow = {
  recipeId: number
  title: string
  imageUrl: string | null
  thumbUrl: string | null
  orderCount: number
}

function normalizeOrderStatus(status: string) {
  return status === 'pending' ? 'submitted' : status
}

function createContentPreview(content: string, maxLength = 80) {
  if (content.length <= maxLength) {
    return content
  }

  return `${content.slice(0, maxLength - 1)}…`
}

async function mapRecipeStatsRow(row: RecipeStatsRow): Promise<RecipeCardSummary> {
  const image = await resolveImageUrls(row.imageUrl, row.thumbUrl)

  return {
    recipeId: row.recipeId,
    title: row.title,
    orderCount: Number(row.orderCount),
    image: image
      ? {
          url: image.url,
          thumbUrl: image.thumbUrl,
        }
      : null,
  }
}

function getRecipeStats(familyId: number): RecipeStatsRow[] {
  return sqlite
    .prepare(
      `
        SELECT
          r.id AS recipeId,
          r.title AS title,
          ri.url AS imageUrl,
          ri.thumb_url AS thumbUrl,
          COALESCE(recipe_stats.order_count, 0) AS orderCount
        FROM recipes r
        LEFT JOIN recipe_images ri
          ON ri.recipe_id = r.id
         AND ri.sort_order = 0
        LEFT JOIN (
          SELECT
            oi.recipe_id AS recipe_id,
            COUNT(*) AS order_count,
            MAX(o.created_at) AS last_ordered_at
          FROM order_items oi
          INNER JOIN orders o
            ON o.id = oi.order_id
          WHERE o.family_id = ?
          GROUP BY oi.recipe_id
        ) AS recipe_stats
          ON recipe_stats.recipe_id = r.id
        WHERE r.family_id = ?
        ORDER BY recipe_stats.order_count DESC, recipe_stats.last_ordered_at DESC, r.id DESC
      `,
    )
    .all(familyId, familyId) as RecipeStatsRow[]
}

function getRecentlyOrderedRecipeIds(familyId: number, userId: number) {
  const rows = sqlite
    .prepare(
      `
        SELECT oi.recipe_id AS recipeId
        FROM order_items oi
        INNER JOIN orders o
          ON o.id = oi.order_id
        WHERE o.family_id = ?
          AND o.user_id = ?
        ORDER BY o.created_at DESC, o.id DESC, oi.id DESC
        LIMIT 30
      `,
    )
    .all(familyId, userId) as Array<{ recipeId: number }>

  const recentRecipeIds = new Set<number>()
  for (const row of rows) {
    recentRecipeIds.add(row.recipeId)
    if (recentRecipeIds.size >= 10) {
      break
    }
  }

  return recentRecipeIds
}

function getAchievementSummary(familyId: number) {
  const totalOrdersRow = sqlite
    .prepare('SELECT COUNT(*) AS count FROM orders WHERE family_id = ?')
    .get(familyId) as { count: number }

  const totalCooksRow = sqlite
    .prepare('SELECT COUNT(*) AS count FROM orders WHERE family_id = ? AND cook_user_id IS NOT NULL')
    .get(familyId) as { count: number }

  return {
    totalOrders: Number(totalOrdersRow.count),
    totalCooks: Number(totalCooksRow.count),
  }
}

type ActiveOrderRow = {
  id: number
  userId: number
  cookUserId: number | null
  requesterDisplayName: string
  cookDisplayName: string | null
  mealType: string
  mealDate: string
  note: string | null
  status: string
  createdAt: string
}

type ActiveOrderItemRow = {
  orderId: number
  recipeId: number
  quantity: number
  recipeTitle: string
  imageUrl: string | null
  thumbUrl: string | null
}

async function getActiveOrders(familyId: number, userId: number): Promise<ActiveOrderSummary[]> {
  const orderRows = sqlite
    .prepare(
      `
        SELECT
          o.id AS id,
          o.user_id AS userId,
          o.cook_user_id AS cookUserId,
          requester.display_name AS requesterDisplayName,
          cook.display_name AS cookDisplayName,
          o.meal_type AS mealType,
          o.meal_date AS mealDate,
          o.note AS note,
          o.status AS status,
          o.created_at AS createdAt
        FROM orders o
        INNER JOIN users requester ON requester.id = o.user_id
        LEFT JOIN users cook ON cook.id = o.cook_user_id
        WHERE o.family_id = ?
          AND o.status IN ('pending', 'submitted', 'confirmed', 'preparing')
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 8
      `,
    )
    .all(familyId) as ActiveOrderRow[]

  if (orderRows.length === 0) {
    return []
  }

  const orderIds = orderRows.map((order) => order.id)
  const placeholders = orderIds.map(() => '?').join(',')
  const itemRows = sqlite
    .prepare(
      `
        SELECT
          oi.order_id AS orderId,
          oi.recipe_id AS recipeId,
          oi.quantity AS quantity,
          r.title AS recipeTitle,
          ri.url AS imageUrl,
          ri.thumb_url AS thumbUrl
        FROM order_items oi
        INNER JOIN recipes r ON r.id = oi.recipe_id
        LEFT JOIN recipe_images ri
          ON ri.recipe_id = r.id
         AND ri.sort_order = 0
        WHERE oi.order_id IN (${placeholders})
      `,
    )
    .all(...orderIds) as ActiveOrderItemRow[]

  const itemsByOrderId = new Map<number, ActiveOrderItemRow[]>()
  for (const item of itemRows) {
    const list = itemsByOrderId.get(item.orderId) ?? []
    list.push(item)
    itemsByOrderId.set(item.orderId, list)
  }

  return Promise.all(
    orderRows.map(async (order) => {
      const itemSummaries = await Promise.all(
        (itemsByOrderId.get(order.id) ?? []).map(async (item) => {
          const image = await resolveImageUrls(item.imageUrl, item.thumbUrl)
          return {
            recipeId: item.recipeId,
            recipeTitle: item.recipeTitle,
            quantity: item.quantity,
            image: image ? { url: image.url, thumbUrl: image.thumbUrl } : null,
          }
        }),
      )

      const normalizedStatus = normalizeOrderStatus(order.status)
      const isMine = order.userId === userId
      // Only submitted orders can be "accepted" (becoming confirmed). Once an
      // order is confirmed, the next step is "start cooking" (preparing), not
      // another accept — clicking accept again would cause a confirmed→confirmed
      // status transition error on the server.
      const canAccept =
        !isMine && order.cookUserId === null && normalizedStatus === 'submitted'

      return {
        id: order.id,
        mealType: order.mealType,
        mealDate: order.mealDate,
        status: normalizedStatus,
        note: order.note,
        createdAt: order.createdAt,
        requester: {
          userId: order.userId,
          displayName: order.requesterDisplayName,
        },
        cook:
          order.cookUserId !== null && order.cookDisplayName
            ? { userId: order.cookUserId, displayName: order.cookDisplayName }
            : null,
        items: itemSummaries,
        isMine,
        canAccept,
      }
    }),
  )
}

export async function getHomeSummary(familyId: number, userId: number): Promise<HomeSummary> {
  const recipeStats = getRecipeStats(familyId)
  const recentlyOrderedRecipeIds = getRecentlyOrderedRecipeIds(familyId, userId)

  const frequentRecipes = await Promise.all(
    recipeStats
      .filter((recipe) => Number(recipe.orderCount) > 0)
      .slice(0, 5)
      .map(mapRecipeStatsRow),
  )

  const recommendationPool = recipeStats.filter(
    (recipe) => !recentlyOrderedRecipeIds.has(recipe.recipeId),
  )
  const recommendedRecipes = await Promise.all(
    (recommendationPool.length > 0 ? recommendationPool : recipeStats)
      .slice(0, 5)
      .map(mapRecipeStatsRow),
  )

  const recentOrderRows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      requesterDisplayName: users.displayName,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.familyId, familyId))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(5)

  const recentOrderIds = recentOrderRows.map((order) => order.id)
  const recentOrderItems = recentOrderIds.length > 0
    ? await db
        .select({
          orderId: orderItems.orderId,
          recipeTitle: recipes.title,
        })
        .from(orderItems)
        .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
        .where(inArray(orderItems.orderId, recentOrderIds))
    : []

  const recipeTitlesByOrderId = new Map<number, string[]>()
  for (const item of recentOrderItems) {
    const recipeTitles = recipeTitlesByOrderId.get(item.orderId) ?? []
    recipeTitles.push(item.recipeTitle)
    recipeTitlesByOrderId.set(item.orderId, recipeTitles)
  }

  const recentOrders = recentOrderRows.map((order) => ({
    id: order.id,
    mealType: order.mealType,
    mealDate: order.mealDate,
    status: normalizeOrderStatus(order.status),
    createdAt: order.createdAt,
    requester: {
      userId: order.userId,
      displayName: order.requesterDisplayName,
    },
    recipeTitles: recipeTitlesByOrderId.get(order.id) ?? [],
  }))

  const recentCommentRows = await db
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
    .innerJoin(
      orders,
      and(eq(orderComments.orderId, orders.id), eq(orders.familyId, familyId)),
    )
    .orderBy(desc(orderComments.createdAt), desc(orderComments.id))
    .limit(3)

  const recentComments = recentCommentRows.map((comment) => ({
    id: comment.id,
    orderId: comment.orderId,
    userId: comment.userId,
    displayName: comment.displayName,
    roleType: comment.roleType,
    contentPreview: createContentPreview(comment.content),
    createdAt: comment.createdAt,
  }))

  const activeOrders = await getActiveOrders(familyId, userId)

  return {
    recommendedRecipes,
    frequentRecipes,
    recentOrders,
    recentComments,
    activeOrders,
    achievementSummary: getAchievementSummary(familyId),
  }
}
