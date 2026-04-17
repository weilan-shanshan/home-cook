import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  families,
  familyMembers,
  orderItems,
  orders,
  recipes,
  users,
} from '../db/schema.js'

type ProfileOrderSummary = {
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

type FamilyMemberSummary = {
  userId: number
  displayName: string
  role: string
  joinedAt: string
}

export type ProfileSummary = {
  family: {
    id: number
    name: string
    inviteCode: string
  }
  myOrderStats: {
    total: number
    pending: number
    completed: number
  }
  myFavoritesCount: number
  myCommentsCount: number
  orderedByMe: ProfileOrderSummary[]
  cookedByMe: ProfileOrderSummary[]
  familyMembers: FamilyMemberSummary[]
}

function normalizeOrderStatus(status: string) {
  return status === 'pending' ? 'submitted' : status
}

function getMyOrderStats(familyId: number, userId: number) {
  const row = sqlite
    .prepare(
      `
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN status IN ('pending', 'submitted', 'confirmed', 'preparing') THEN 1
              ELSE 0
            END
          ) AS pending,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
        FROM orders
        WHERE family_id = ?
          AND user_id = ?
      `,
    )
    .get(familyId, userId) as {
    total: number | null
    pending: number | null
    completed: number | null
  }

  return {
    total: Number(row.total ?? 0),
    pending: Number(row.pending ?? 0),
    completed: Number(row.completed ?? 0),
  }
}

function getMyFavoritesCount(familyId: number, userId: number) {
  const row = sqlite
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM favorites f
        INNER JOIN recipes r
          ON r.id = f.recipe_id
        WHERE f.user_id = ?
          AND r.family_id = ?
      `,
    )
    .get(userId, familyId) as { count: number | null }

  return Number(row.count ?? 0)
}

function getMyCommentsCount(familyId: number, userId: number) {
  const row = sqlite
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM order_comments oc
        INNER JOIN orders o
          ON o.id = oc.order_id
        WHERE oc.user_id = ?
          AND o.family_id = ?
      `,
    )
    .get(userId, familyId) as { count: number | null }

  return Number(row.count ?? 0)
}

async function getRecentOrderSummaries(
  familyId: number,
  userId: number,
  scope: 'ordered' | 'cooked',
): Promise<ProfileOrderSummary[]> {
  const scopeCondition = scope === 'ordered'
    ? eq(orders.userId, userId)
    : eq(orders.cookUserId, userId)

  const orderRows = await db
    .select({
      id: orders.id,
      requesterUserId: orders.userId,
      requesterDisplayName: users.displayName,
      mealType: orders.mealType,
      mealDate: orders.mealDate,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(and(eq(orders.familyId, familyId), scopeCondition))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(3)

  const orderIds = orderRows.map((order) => order.id)
  const itemRows = orderIds.length > 0
    ? await db
        .select({
          orderId: orderItems.orderId,
          recipeTitle: recipes.title,
        })
        .from(orderItems)
        .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
        .where(inArray(orderItems.orderId, orderIds))
    : []

  const recipeTitlesByOrderId = new Map<number, string[]>()
  for (const item of itemRows) {
    const recipeTitles = recipeTitlesByOrderId.get(item.orderId) ?? []
    recipeTitles.push(item.recipeTitle)
    recipeTitlesByOrderId.set(item.orderId, recipeTitles)
  }

  return orderRows.map((order) => ({
    id: order.id,
    mealType: order.mealType,
    mealDate: order.mealDate,
    status: normalizeOrderStatus(order.status),
    createdAt: order.createdAt,
    requester: {
      userId: order.requesterUserId,
      displayName: order.requesterDisplayName,
    },
    recipeTitles: recipeTitlesByOrderId.get(order.id) ?? [],
  }))
}

async function getFamilyMemberSummaries(familyId: number): Promise<FamilyMemberSummary[]> {
  const rows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      role: users.role,
      joinedAt: familyMembers.joinedAt,
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId))
    .orderBy(asc(familyMembers.joinedAt), asc(users.id))

  return rows.map((row) => ({
    userId: row.userId,
    displayName: row.displayName,
    role: row.role,
    joinedAt: row.joinedAt,
  }))
}

async function getFamilySummary(familyId: number) {
  const rows = await db
    .select({
      id: families.id,
      name: families.name,
      inviteCode: families.inviteCode,
    })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  return rows[0] ?? {
    id: familyId,
    name: '',
    inviteCode: '',
  }
}

export async function getProfileSummary(familyId: number, userId: number): Promise<ProfileSummary> {
  const myOrderStats = getMyOrderStats(familyId, userId)
  const myFavoritesCount = getMyFavoritesCount(familyId, userId)
  const myCommentsCount = getMyCommentsCount(familyId, userId)

  const [familySummary, orderedByMe, cookedByMe, familyMemberSummaries] = await Promise.all([
    getFamilySummary(familyId),
    getRecentOrderSummaries(familyId, userId, 'ordered'),
    getRecentOrderSummaries(familyId, userId, 'cooked'),
    getFamilyMemberSummaries(familyId),
  ])

  return {
    family: familySummary,
    myOrderStats,
    myFavoritesCount,
    myCommentsCount,
    orderedByMe,
    cookedByMe,
    familyMembers: familyMemberSummaries,
  }
}
