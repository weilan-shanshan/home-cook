import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  recipes,
  recipeLikes,
  recipeComments,
  recipeTags,
  tags,
} from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { resolveImageUrls } from '../lib/image-urls.js'
import { assertCanCreateRecipe } from '../lib/quota.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const squareRouter = new Hono<AuthEnv>()
squareRouter.use('*', authMiddleware)

interface SquareRecipeRow {
  id: number
  title: string
  description: string | null
  cook_minutes: number | null
  servings: number | null
  family_id: number
  family_name: string
  created_at: string
  first_image_url: string | null
  first_thumb_url: string | null
  like_count: number
  comment_count: number
  liked_by_me: number
}

// List public recipes from OTHER families.
squareRouter.get('/recipes', async (c) => {
  const user = c.get('user')
  const familyId = c.get('familyId')
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const offset = (page - 1) * limit

  const totalRow = sqlite
    .prepare(
      `SELECT COUNT(*) as total FROM recipes
       WHERE is_public = 1 AND family_id != ?`,
    )
    .get(familyId) as { total: number }

  const rows = sqlite
    .prepare(
      `SELECT
         r.id, r.title, r.description, r.cook_minutes, r.servings,
         r.family_id, f.name AS family_name, r.created_at,
         ri.url AS first_image_url, ri.thumb_url AS first_thumb_url,
         (SELECT COUNT(*) FROM recipe_likes WHERE recipe_id = r.id) AS like_count,
         (SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = r.id) AS comment_count,
         EXISTS(SELECT 1 FROM recipe_likes WHERE recipe_id = r.id AND user_id = ?) AS liked_by_me
       FROM recipes r
       JOIN families f ON f.id = r.family_id
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = (
         SELECT MIN(sort_order) FROM recipe_images WHERE recipe_id = r.id
       )
       WHERE r.is_public = 1 AND r.family_id != ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(user.id, familyId, limit, offset) as SquareRecipeRow[]

  // Pre-fetch tags per recipe in one query
  const recipeIds = rows.map((r) => r.id)
  const tagRows = recipeIds.length
    ? (sqlite
        .prepare(
          `SELECT rt.recipe_id, t.id, t.name FROM recipe_tags rt
           JOIN tags t ON t.id = rt.tag_id
           WHERE rt.recipe_id IN (${recipeIds.map(() => '?').join(',')})`,
        )
        .all(...recipeIds) as Array<{ recipe_id: number; id: number; name: string }>)
    : []
  const tagsByRecipe = new Map<number, Array<{ id: number; name: string }>>()
  for (const t of tagRows) {
    const list = tagsByRecipe.get(t.recipe_id) ?? []
    list.push({ id: t.id, name: t.name })
    tagsByRecipe.set(t.recipe_id, list)
  }

  const enriched = await Promise.all(
    rows.map(async (r) => {
      const image = await resolveImageUrls(r.first_image_url, r.first_thumb_url)
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        cook_minutes: r.cook_minutes,
        servings: r.servings,
        family: { id: r.family_id, name: r.family_name },
        created_at: r.created_at,
        first_image: image,
        like_count: r.like_count,
        comment_count: r.comment_count,
        liked_by_me: !!r.liked_by_me,
        tags: tagsByRecipe.get(r.id) ?? [],
      }
    }),
  )

  return c.json({
    data: enriched,
    total: totalRow.total,
    page,
    limit,
  })
})

// Detail of a single public recipe.
squareRouter.get('/recipes/:id', async (c) => {
  const user = c.get('user')
  const familyId = c.get('familyId')
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const row = sqlite
    .prepare(
      `SELECT r.*, f.name AS family_name FROM recipes r
       JOIN families f ON f.id = r.family_id
       WHERE r.id = ? AND r.is_public = 1`,
    )
    .get(recipeId) as
    | {
        id: number
        family_id: number
        title: string
        description: string | null
        steps: string | null
        cook_minutes: number | null
        servings: number | null
        created_at: string
        family_name: string
      }
    | undefined

  if (!row) {
    return c.json({ error: 'Recipe not found or not public' }, 404)
  }

  const images = sqlite
    .prepare(
      `SELECT id, url, thumb_url, sort_order FROM recipe_images
       WHERE recipe_id = ? ORDER BY sort_order`,
    )
    .all(recipeId) as Array<{
    id: number
    url: string
    thumb_url: string | null
    sort_order: number
  }>

  const tagRows = sqlite
    .prepare(
      `SELECT t.id, t.name FROM tags t
       JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`,
    )
    .all(recipeId) as Array<{ id: number; name: string }>

  const commentRows = sqlite
    .prepare(
      `SELECT rc.id, rc.content, rc.created_at, u.id AS user_id, u.display_name AS user_name
       FROM recipe_comments rc
       JOIN users u ON u.id = rc.user_id
       WHERE rc.recipe_id = ?
       ORDER BY rc.created_at DESC LIMIT 50`,
    )
    .all(recipeId) as Array<{
    id: number
    content: string
    created_at: string
    user_id: number
    user_name: string
  }>

  const likeRow = sqlite
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM recipe_likes WHERE recipe_id = ?) AS like_count,
         EXISTS(SELECT 1 FROM recipe_likes WHERE recipe_id = ? AND user_id = ?) AS liked_by_me`,
    )
    .get(recipeId, recipeId, user.id) as { like_count: number; liked_by_me: number }

  const resolvedImages = await Promise.all(
    images.map(async (img) => {
      const r = await resolveImageUrls(img.url, img.thumb_url)
      return {
        id: img.id,
        url: r?.url ?? img.url,
        thumb_url: r?.thumbUrl ?? img.thumb_url,
        sort_order: img.sort_order,
      }
    }),
  )

  return c.json({
    id: row.id,
    title: row.title,
    description: row.description,
    steps: row.steps ? JSON.parse(row.steps) : [],
    cook_minutes: row.cook_minutes,
    servings: row.servings,
    created_at: row.created_at,
    family: { id: row.family_id, name: row.family_name },
    is_own_family: row.family_id === familyId,
    images: resolvedImages,
    tags: tagRows,
    like_count: likeRow.like_count,
    liked_by_me: !!likeRow.liked_by_me,
    comments: commentRows.map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user: { id: c.user_id, name: c.user_name },
    })),
  })
})

// Toggle like on a public recipe.
squareRouter.post('/recipes/:id/like', async (c) => {
  const user = c.get('user')
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const [recipe] = await db
    .select({ id: recipes.id, isPublic: recipes.isPublic })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!recipe || !recipe.isPublic) {
    return c.json({ error: 'Recipe not found or not public' }, 404)
  }

  const [existing] = await db
    .select({ recipeId: recipeLikes.recipeId })
    .from(recipeLikes)
    .where(and(eq(recipeLikes.recipeId, recipeId), eq(recipeLikes.userId, user.id)))
    .limit(1)

  let liked: boolean
  if (existing) {
    await db
      .delete(recipeLikes)
      .where(and(eq(recipeLikes.recipeId, recipeId), eq(recipeLikes.userId, user.id)))
    liked = false
  } else {
    await db.insert(recipeLikes).values({ recipeId, userId: user.id })
    liked = true
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recipeLikes)
    .where(eq(recipeLikes.recipeId, recipeId))

  return c.json({ liked, like_count: count })
})

// Post a comment on a public recipe.
squareRouter.post('/recipes/:id/comments', async (c) => {
  const user = c.get('user')
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const body = await c.req.json().catch(() => null)
  const content = body?.content
  if (typeof content !== 'string' || !content.trim() || content.length > 500) {
    return c.json({ error: 'Comment content required (1-500 chars)' }, 400)
  }

  const [recipe] = await db
    .select({ id: recipes.id, isPublic: recipes.isPublic })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!recipe || !recipe.isPublic) {
    return c.json({ error: 'Recipe not found or not public' }, 404)
  }

  const [inserted] = await db
    .insert(recipeComments)
    .values({ recipeId, userId: user.id, content: content.trim() })
    .returning()

  return c.json(
    {
      id: inserted.id,
      content: inserted.content,
      created_at: inserted.createdAt,
      user: { id: user.id, name: user.displayName },
    },
    201,
  )
})

// Clone a public recipe into the caller's family.
squareRouter.post('/recipes/:id/clone', async (c) => {
  const user = c.get('user')
  const familyId = c.get('familyId')
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const [source] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1)

  if (!source || !source.isPublic) {
    return c.json({ error: 'Recipe not found or not public' }, 404)
  }
  if (source.familyId === familyId) {
    return c.json({ error: '不能复制自己家的菜' }, 400)
  }

  assertCanCreateRecipe(familyId)

  // Create new recipe row in caller's family with source attribution.
  const [created] = await db
    .insert(recipes)
    .values({
      familyId,
      title: source.title,
      description: source.description,
      steps: source.steps,
      cookMinutes: source.cookMinutes,
      servings: source.servings,
      sourceRecipeId: source.id,
      sourceFamilyId: source.familyId,
      createdBy: user.id,
    })
    .returning()

  // Copy images (point to the same URLs — no need to reupload).
  const sourceImages = sqlite
    .prepare(
      `SELECT url, thumb_url, sort_order FROM recipe_images WHERE recipe_id = ? ORDER BY sort_order`,
    )
    .all(recipeId) as Array<{ url: string; thumb_url: string | null; sort_order: number }>
  for (const img of sourceImages) {
    sqlite
      .prepare(
        `INSERT INTO recipe_images (recipe_id, url, thumb_url, sort_order) VALUES (?, ?, ?, ?)`,
      )
      .run(created.id, img.url, img.thumb_url, img.sort_order)
  }

  // Copy tag relationships, mapping by tag NAME within the new family. Create
  // family-local tag rows on demand.
  const sourceTagNames = sqlite
    .prepare(
      `SELECT t.name FROM tags t JOIN recipe_tags rt ON rt.tag_id = t.id WHERE rt.recipe_id = ?`,
    )
    .all(recipeId) as Array<{ name: string }>

  for (const { name } of sourceTagNames) {
    let [existingTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.familyId, familyId), eq(tags.name, name)))
      .limit(1)
    if (!existingTag) {
      const [inserted] = await db
        .insert(tags)
        .values({ familyId, name })
        .returning({ id: tags.id })
      existingTag = inserted
    }
    await db
      .insert(recipeTags)
      .values({ recipeId: created.id, tagId: existingTag.id })
      .onConflictDoNothing()
  }

  return c.json({ id: created.id, title: created.title }, 201)
})

export { squareRouter }
