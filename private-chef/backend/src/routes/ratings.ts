import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { cookLogs, ratings, recipes, users } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

const ratingsRouter = new Hono<AuthEnv>()

ratingsRouter.use('*', authMiddleware)

type RatingRow = {
  id: number
  cookLogId: number
  userId: number
  displayName: string
  score: number
  comment: string | null
  createdAt: string
}

function parsePositiveInt(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
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
    .select({ id: recipes.id, title: recipes.title })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.familyId, familyId)))
    .limit(1)

  return recipe
}

async function findFamilyCookLog(cookLogId: number, familyId: number) {
  const [cookLog] = await db
    .select({
      id: cookLogs.id,
      recipeId: cookLogs.recipeId,
      recipeTitle: recipes.title,
      cookedBy: cookLogs.cookedBy,
      cookedAt: cookLogs.cookedAt,
      note: cookLogs.note,
    })
    .from(cookLogs)
    .innerJoin(recipes, eq(cookLogs.recipeId, recipes.id))
    .where(and(eq(cookLogs.id, cookLogId), eq(recipes.familyId, familyId)))
    .limit(1)

  return cookLog
}

async function getRatingsForCookLogs(cookLogIds: number[]) {
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

ratingsRouter.get('/recipes/:id/logs', async (c) => {
  const recipeId = parsePositiveInt(c.req.param('id'))
  if (recipeId === null) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')
  const recipe = await findFamilyRecipe(recipeId, familyId)
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const logRows = await db
    .select({
      id: cookLogs.id,
      recipeId: cookLogs.recipeId,
      cookedBy: cookLogs.cookedBy,
      cookedByName: users.displayName,
      cookedAt: cookLogs.cookedAt,
      note: cookLogs.note,
    })
    .from(cookLogs)
    .innerJoin(users, eq(cookLogs.cookedBy, users.id))
    .where(eq(cookLogs.recipeId, recipe.id))
    .orderBy(desc(cookLogs.cookedAt), desc(cookLogs.id))

  const cookLogIds = logRows.map((row) => row.id)
  const { ratingsByCookLog, summariesByCookLog } = await getRatingsForCookLogs(
    cookLogIds,
  )

  return c.json(
    logRows.map((row) => {
      const summary = summariesByCookLog.get(row.id)

      return {
        id: row.id,
        recipe_id: row.recipeId,
        cooked_by: row.cookedBy,
        cooked_by_name: row.cookedByName,
        cooked_at: row.cookedAt,
        note: row.note,
        ratings: ratingsByCookLog.get(row.id) ?? [],
        avg_rating: summary?.avg_rating ?? null,
        rating_count: summary?.rating_count ?? 0,
      }
    }),
  )
})

ratingsRouter.get('/cook-logs/:id/ratings', async (c) => {
  const cookLogId = parsePositiveInt(c.req.param('id'))
  if (cookLogId === null) {
    return c.json({ error: 'Invalid cook log id' }, 400)
  }

  const familyId = c.get('familyId')
  const cookLog = await findFamilyCookLog(cookLogId, familyId)
  if (!cookLog) {
    return c.json({ error: 'Cook log not found' }, 404)
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
    .where(eq(ratings.cookLogId, cookLog.id))
    .orderBy(desc(ratings.createdAt), desc(ratings.id))

  return c.json(ratingRows.map(formatRating))
})

ratingsRouter.post('/cook-logs/:id/ratings', async (c) => {
  const cookLogId = parsePositiveInt(c.req.param('id'))
  if (cookLogId === null) {
    return c.json({ error: 'Invalid cook log id' }, 400)
  }

  const body = await c.req.json()
  const parsed = createRatingSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const user = c.get('user')
  const familyId = c.get('familyId')
  const cookLog = await findFamilyCookLog(cookLogId, familyId)
  if (!cookLog) {
    return c.json({ error: 'Cook log not found' }, 404)
  }

  const [existingRating] = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(and(eq(ratings.cookLogId, cookLog.id), eq(ratings.userId, user.id)))
    .limit(1)

  if (existingRating) {
    return c.json({ error: 'You have already rated this cook log' }, 409)
  }

  const insertValues: typeof ratings.$inferInsert = {
    cookLogId: cookLog.id,
    userId: user.id,
    score: parsed.data.score,
    comment: parsed.data.comment ?? null,
  }

  try {
    const [created] = await db.insert(ratings).values(insertValues).returning({
      id: ratings.id,
      cookLogId: ratings.cookLogId,
      userId: ratings.userId,
      score: ratings.score,
      comment: ratings.comment,
      createdAt: ratings.createdAt,
    })

    return c.json(
      {
        id: created.id,
        cook_log_id: created.cookLogId,
        user_id: created.userId,
        display_name: user.displayName,
        score: created.score,
        comment: created.comment,
        created_at: created.createdAt,
      },
      201,
    )
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return c.json({ error: 'You have already rated this cook log' }, 409)
    }

    throw error
  }
})

export { ratingsRouter }
