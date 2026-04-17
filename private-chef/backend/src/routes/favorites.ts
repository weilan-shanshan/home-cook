import { Hono } from 'hono'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  favorites,
  recipeImages,
  recipes,
  recipeTags,
  tags,
} from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { resolveImageUrls } from '../lib/image-urls.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const favoritesRouter = new Hono<AuthEnv>()

favoritesRouter.use('*', authMiddleware)

function parseRecipeId(value: string) {
  const recipeId = Number(value)
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return null
  }

  return recipeId
}

async function findFamilyRecipe(recipeId: number, familyId: number) {
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.familyId, familyId)))
    .limit(1)

  return recipe
}

favoritesRouter.get('/', async (c) => {
  const user = c.get('user')
  const familyId = c.get('familyId')

  const firstRecipeImage = db
    .select({
      recipeId: recipeImages.recipeId,
      minSortOrder: sql<number>`min(${recipeImages.sortOrder})`.as(
        'min_sort_order',
      ),
    })
    .from(recipeImages)
    .groupBy(recipeImages.recipeId)
    .as('first_recipe_image')

  const rows = await db
    .select({
      recipeId: favorites.recipeId,
      favoritedAt: favorites.createdAt,
      title: recipes.title,
      imageUrl: recipeImages.url,
      thumbUrl: recipeImages.thumbUrl,
    })
    .from(favorites)
    .innerJoin(
      recipes,
      and(eq(favorites.recipeId, recipes.id), eq(recipes.familyId, familyId)),
    )
    .leftJoin(firstRecipeImage, eq(firstRecipeImage.recipeId, recipes.id))
    .leftJoin(
      recipeImages,
      and(
        eq(recipeImages.recipeId, recipes.id),
        eq(recipeImages.sortOrder, firstRecipeImage.minSortOrder),
      ),
    )
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt))

  if (rows.length === 0) {
    return c.json([])
  }

  const recipeIds = rows.map((row) => row.recipeId)
  const tagRows = await db
    .select({
      recipeId: recipeTags.recipeId,
      id: tags.id,
      name: tags.name,
    })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(inArray(recipeTags.recipeId, recipeIds))

  const tagsByRecipe = new Map<number, Array<{ id: number; name: string }>>()
  for (const row of tagRows) {
    const recipeTagList = tagsByRecipe.get(row.recipeId) ?? []
    recipeTagList.push({ id: row.id, name: row.name })
    tagsByRecipe.set(row.recipeId, recipeTagList)
  }

  return c.json(
    await Promise.all(
      rows.map(async (row) => {
        const firstImage = await resolveImageUrls(row.imageUrl, row.thumbUrl)

        return {
          id: row.recipeId,
          title: row.title,
          first_image: firstImage
            ? { url: firstImage.url, thumb_url: firstImage.thumbUrl }
            : null,
          tags: tagsByRecipe.get(row.recipeId) ?? [],
          favorited_at: row.favoritedAt,
        }
      }),
    ),
  )
})

favoritesRouter.post('/:recipeId', async (c) => {
  const recipeId = parseRecipeId(c.req.param('recipeId'))
  if (recipeId === null) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const user = c.get('user')
  const familyId = c.get('familyId')

  const recipe = await findFamilyRecipe(recipeId, familyId)
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const [existingFavorite] = await db
    .select({ recipeId: favorites.recipeId })
    .from(favorites)
    .where(
      and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipeId)),
    )
    .limit(1)

  if (existingFavorite) {
    return c.json({ error: 'Recipe already favorited' }, 409)
  }

  try {
    const [created] = await db
      .insert(favorites)
      .values({ userId: user.id, recipeId })
      .returning({
        userId: favorites.userId,
        recipeId: favorites.recipeId,
        createdAt: favorites.createdAt,
      })

    return c.json(created, 201)
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    ) {
      return c.json({ error: 'Recipe already favorited' }, 409)
    }

    throw error
  }
})

favoritesRouter.delete('/:recipeId', async (c) => {
  const recipeId = parseRecipeId(c.req.param('recipeId'))
  if (recipeId === null) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const user = c.get('user')
  const familyId = c.get('familyId')

  const recipe = await findFamilyRecipe(recipeId, familyId)
  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const [deletedFavorite] = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, recipeId)))
    .returning({ recipeId: favorites.recipeId })

  if (!deletedFavorite) {
    return c.json({ error: 'Favorite not found' }, 404)
  }

  return c.json({ success: true })
})

export { favoritesRouter }
