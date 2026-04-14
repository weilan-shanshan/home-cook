import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { cookLogs, ratings, recipes, users } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createCookLogSchema = z.object({
  recipe_id: z.number().int().positive(),
  cooked_at: z.string().optional(),
  note: z.string().optional(),
})

const cookLogsRouter = new Hono<AuthEnv>()

cookLogsRouter.use('*', authMiddleware)

type RatingRow = {
  id: number
  cookLogId: number
  userId: number
  displayName: string
  score: number
  comment: string | null
  createdAt: string
}

function formatRating(row: RatingRow) {
  return {
    id: row.id,
    cook_log_id: row.cookLogId,
    user_id: row.userId,
    display_name: row.displayName,
    score: row.score,
    comment: row.comment,
    created_at: row.createdAt,
  }
}

async function findFamilyRecipe(recipeId: number, familyId: number) {
  const [recipe] = await db
    .select({
      id: recipes.id,
      title: recipes.title,
    })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.familyId, familyId)))
    .limit(1)

  return recipe
}

async function getRatingsData(cookLogIds: number[]) {
  const ratingsByCookLog = new Map<
    number,
    Array<ReturnType<typeof formatRating>>
  >()
  const summariesByCookLog = new Map<
    number,
    { avg_rating: number | null; rating_count: number }
  >()

  if (cookLogIds.length === 0) {
    return { ratingsByCookLog, summariesByCookLog }
  }

  const ratingRows = await db
    .select({
      id: ratings.id,
      cookLogId: ratings.cookLogId,
      userId: ratings.userId,
      displayName: users.displayName,
      score: ratings.score,
      comment: ratings.comment,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(inArray(ratings.cookLogId, cookLogIds))
    .orderBy(desc(ratings.createdAt), desc(ratings.id))

  for (const row of ratingRows) {
    const formattedRating = formatRating(row)
    const ratingList = ratingsByCookLog.get(row.cookLogId) ?? []
    ratingList.push(formattedRating)
    ratingsByCookLog.set(row.cookLogId, ratingList)

    const currentSummary = summariesByCookLog.get(row.cookLogId) ?? {
      avg_rating: 0,
      rating_count: 0,
    }
    const nextCount = currentSummary.rating_count + 1
    const nextAverage =
      (((currentSummary.avg_rating ?? 0) * currentSummary.rating_count) +
        row.score) /
      nextCount

    summariesByCookLog.set(row.cookLogId, {
      avg_rating: Math.round(nextAverage * 10) / 10,
      rating_count: nextCount,
    })
  }

  return { ratingsByCookLog, summariesByCookLog }
}

cookLogsRouter.get('/', async (c) => {
  const familyId = c.get('familyId')
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit')) || 20))
  const offset = (page - 1) * limit

  const [countRow] = await db
    .select({ total: sql<number>`count(*)` })
    .from(cookLogs)
    .innerJoin(recipes, eq(cookLogs.recipeId, recipes.id))
    .where(eq(recipes.familyId, familyId))

  const total = Number(countRow?.total ?? 0)

  if (total === 0) {
    return c.json({ data: [], total: 0, page, limit })
  }

  const logRows = await db
    .select({
      id: cookLogs.id,
      recipeId: cookLogs.recipeId,
      recipeTitle: recipes.title,
      cookedBy: cookLogs.cookedBy,
      cookedByName: users.displayName,
      cookedAt: cookLogs.cookedAt,
      note: cookLogs.note,
    })
    .from(cookLogs)
    .innerJoin(recipes, eq(cookLogs.recipeId, recipes.id))
    .innerJoin(users, eq(cookLogs.cookedBy, users.id))
    .where(eq(recipes.familyId, familyId))
    .orderBy(desc(cookLogs.cookedAt), desc(cookLogs.id))
    .limit(limit)
    .offset(offset)

  const cookLogIds = logRows.map((row) => row.id)
  const { ratingsByCookLog, summariesByCookLog } = await getRatingsData(
    cookLogIds,
  )

  return c.json({
    data: logRows.map((row) => {
      const summary = summariesByCookLog.get(row.id)

      return {
        id: row.id,
        recipe_id: row.recipeId,
        recipe_title: row.recipeTitle,
        cooked_by: row.cookedBy,
        cooked_by_name: row.cookedByName,
        cooked_at: row.cookedAt,
        note: row.note,
        ratings: ratingsByCookLog.get(row.id) ?? [],
        avg_rating: summary?.avg_rating ?? null,
        rating_count: summary?.rating_count ?? 0,
      }
    }),
    total,
    page,
    limit,
  })
})

cookLogsRouter.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = createCookLogSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const { recipe_id, cooked_at, note } = parsed.data

  const recipe = await findFamilyRecipe(recipe_id, familyId)
  if (!recipe) {
    return c.json({ error: 'Recipe not found in your family' }, 400)
  }

  const insertValues: typeof cookLogs.$inferInsert = {
    recipeId: recipe_id,
    cookedBy: user.id,
    note: note ?? null,
  }
  if (cooked_at !== undefined) {
    insertValues.cookedAt = cooked_at
  }

  const [created] = await db.insert(cookLogs).values(insertValues).returning({
    id: cookLogs.id,
    recipeId: cookLogs.recipeId,
    cookedBy: cookLogs.cookedBy,
    cookedAt: cookLogs.cookedAt,
    note: cookLogs.note,
  })

  return c.json(
    {
      id: created.id,
      recipe_id: created.recipeId,
      recipe_title: recipe.title,
      cooked_by: created.cookedBy,
      cooked_by_name: user.displayName,
      cooked_at: created.cookedAt,
      note: created.note,
      ratings: [],
      avg_rating: null,
      rating_count: 0,
    },
    201,
  )
})

export { cookLogsRouter }
