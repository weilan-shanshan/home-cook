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

export type HomeSummary = {
  recommendedRecipes: RecipeCardSummary[]
  frequentRecipes: RecipeCardSummary[]
  recentOrders: RecentOrderSummary[]
  recentComments: RecentCommentSummary[]
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

  return {
    recommendedRecipes,
    frequentRecipes,
    recentOrders,
    recentComments,
    achievementSummary: getAchievementSummary(familyId),
  }
}
