import { Hono } from 'hono'
import { z } from 'zod'
import { sqlite } from '../db/index.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { notifyNewRecipe } from '../lib/wechat.js'
import { resolveImageUrls } from '../lib/image-urls.js'
import {
  createShareResponse,
  getShareCardPreview,
  normalizeShareChannel,
  normalizeShareType,
} from '../services/sharing-service.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const createRecipeSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  steps: z.array(z.string()).min(1),
  cook_minutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.number()).optional(),
})

const updateRecipeSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  steps: z.array(z.string()).min(1).optional(),
  cook_minutes: z.number().int().positive().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.number()).optional(),
})

const recipeShareSchema = z.object({
  shareType: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50),
})

const recipesRouter = new Hono<AuthEnv>()

recipesRouter.use('*', authMiddleware)

recipesRouter.get('/', async (c) => {
  const familyId = c.get('familyId')
  const tagFilter = c.req.query('tag')
  const search = c.req.query('q')
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit')) || 20))
  const offset = (page - 1) * limit

  const hasTagFilter =
    tagFilter !== undefined &&
    Number.isFinite(Number(tagFilter)) &&
    Number(tagFilter) > 0
  const tagId = hasTagFilter ? Number(tagFilter) : null

  const filterWhere: string[] = ['r.family_id = ?']
  const filterParams: unknown[] = [familyId]

  if (search) {
    filterWhere.push('r.title LIKE ?')
    filterParams.push(`%${search}%`)
  }

  const filterTagJoin = hasTagFilter
    ? 'INNER JOIN recipe_tags rt ON rt.recipe_id = r.id'
    : ''
  if (hasTagFilter) {
    filterWhere.push('rt.tag_id = ?')
    filterParams.push(tagId)
  }

  const filterSQL = filterWhere.join(' AND ')

  const countResult = sqlite
    .prepare(
      `SELECT COUNT(DISTINCT r.id) as total FROM recipes r ${filterTagJoin} WHERE ${filterSQL}`
    )
    .get(...(filterParams as [unknown, ...unknown[]])) as
    | { total: number }
    | undefined

  const total = countResult?.total ?? 0

  if (total === 0) {
    return c.json({ data: [], total: 0, page, limit })
  }

  const subWhere = filterSQL.replace(/\br\./g, 'sub.')
  const subTagJoin = filterTagJoin.replace(
    'rt.recipe_id = r.id',
    'rt.recipe_id = sub.id'
  )

  const recipeRows = sqlite
    .prepare(
      `SELECT
         r.id, r.title, r.description, r.steps, r.cook_minutes, r.servings,
         r.created_by, r.created_at, r.updated_at,
         ri.url as first_image_url, ri.thumb_url as first_thumb_url,
         (SELECT AVG(CAST(rat.score AS REAL))
          FROM ratings rat
          INNER JOIN cook_logs cl ON cl.id = rat.cook_log_id
          WHERE cl.recipe_id = r.id) as avg_rating
       FROM (
         SELECT DISTINCT sub.id, sub.created_at
         FROM recipes sub ${subTagJoin}
         WHERE ${subWhere}
         ORDER BY sub.created_at DESC, sub.id DESC
         LIMIT ? OFFSET ?
       ) page
       INNER JOIN recipes r ON r.id = page.id
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = (
         SELECT MIN(ri2.sort_order) FROM recipe_images ri2 WHERE ri2.recipe_id = r.id
       )
       ORDER BY page.created_at DESC, page.id DESC`
    )
    .all(
      ...(filterParams.concat(limit, offset) as [unknown, ...unknown[]])
    ) as Array<{
    id: number
    title: string
    description: string | null
    steps: string | null
    cook_minutes: number | null
    servings: number | null
    created_by: number
    created_at: string
    updated_at: string
    first_image_url: string | null
    first_thumb_url: string | null
    avg_rating: number | null
  }>

  if (recipeRows.length === 0) {
    return c.json({ data: [], total, page, limit })
  }

  const recipeIds = recipeRows.map((r) => r.id)
  const placeholders = recipeIds.map(() => '?').join(',')

  const tagRows = sqlite
    .prepare(
      `SELECT rt.recipe_id, t.id as tag_id, t.name as tag_name
       FROM recipe_tags rt
       INNER JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id IN (${placeholders})`
    )
    .all(...(recipeIds as [number, ...number[]])) as Array<{
    recipe_id: number
    tag_id: number
    tag_name: string
  }>

  const tagsByRecipe = new Map<number, Array<{ id: number; name: string }>>()
  for (const row of tagRows) {
    let arr = tagsByRecipe.get(row.recipe_id)
    if (!arr) {
      arr = []
      tagsByRecipe.set(row.recipe_id, arr)
    }
    arr.push({ id: row.tag_id, name: row.tag_name })
  }

  const data = await Promise.all(
    recipeRows.map(async (r) => {
      const firstImage = await resolveImageUrls(r.first_image_url, r.first_thumb_url)

      return {
        id: r.id,
        title: r.title,
        description: r.description,
        steps: r.steps ? JSON.parse(r.steps) : [],
        cook_minutes: r.cook_minutes,
        servings: r.servings,
        created_by: r.created_by,
        created_at: r.created_at,
        updated_at: r.updated_at,
        first_image: firstImage
          ? { url: firstImage.url, thumb_url: firstImage.thumbUrl }
          : null,
        tags: tagsByRecipe.get(r.id) ?? [],
        avg_rating: r.avg_rating ? Math.round(r.avg_rating * 10) / 10 : null,
      }
    }),
  )

  return c.json({ data, total, page, limit })
})

recipesRouter.get('/:id', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')
  const userId = c.get('user').id

  const [recipe] = sqlite
    .prepare(
      `SELECT
         r.id, r.title, r.description, r.steps, r.cook_minutes, r.servings,
         r.created_by, r.created_at, r.updated_at,
         (SELECT AVG(CAST(rat.score AS REAL))
          FROM ratings rat
          INNER JOIN cook_logs cl ON cl.id = rat.cook_log_id
          WHERE cl.recipe_id = r.id) as avg_rating
       FROM recipes r
       WHERE r.id = ? AND r.family_id = ?`
    )
    .all(recipeId, familyId) as Array<{
    id: number
    title: string
    description: string | null
    steps: string | null
    cook_minutes: number | null
    servings: number | null
    created_by: number
    created_at: string
    updated_at: string
    avg_rating: number | null
  }>

  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const images = sqlite
    .prepare(
      `SELECT id, url, thumb_url, sort_order, created_at
       FROM recipe_images WHERE recipe_id = ? ORDER BY sort_order`
    )
    .all(recipeId) as Array<{
    id: number
    url: string
    thumb_url: string | null
    sort_order: number
    created_at: string
  }>

  const recipeTags_ = sqlite
    .prepare(
      `SELECT t.id, t.name FROM tags t
       INNER JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`
    )
    .all(recipeId) as Array<{ id: number; name: string }>

  const recentCookLogs = sqlite
    .prepare(
      `SELECT cl.id, cl.cooked_by, u.display_name as cooked_by_name,
              cl.cooked_at, cl.note
       FROM cook_logs cl
       INNER JOIN users u ON u.id = cl.cooked_by
       WHERE cl.recipe_id = ?
       ORDER BY cl.cooked_at DESC
       LIMIT 10`
    )
    .all(recipeId) as Array<{
    id: number
    cooked_by: number
    cooked_by_name: string
    cooked_at: string
    note: string | null
  }>

  const fav = sqlite
    .prepare(
      `SELECT 1 as is_fav FROM favorites WHERE user_id = ? AND recipe_id = ?`
    )
    .get(userId, recipeId) as { is_fav: number } | undefined

  const resolvedImages = await Promise.all(
    images.map(async (image) => {
      const resolvedImage = await resolveImageUrls(image.url, image.thumb_url)

      return {
        ...image,
        url: resolvedImage?.url ?? image.url,
        thumb_url: resolvedImage?.thumbUrl ?? image.thumb_url,
      }
    }),
  )

  return c.json({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    steps: recipe.steps ? JSON.parse(recipe.steps) : [],
    cook_minutes: recipe.cook_minutes,
    servings: recipe.servings,
    created_by: recipe.created_by,
    created_at: recipe.created_at,
    updated_at: recipe.updated_at,
    avg_rating: recipe.avg_rating
      ? Math.round(recipe.avg_rating * 10) / 10
      : null,
    images: resolvedImages,
    tags: recipeTags_,
    recent_cook_logs: recentCookLogs,
    is_favorited: !!fav,
  })
})

recipesRouter.post('/:id/share', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const parsed = recipeShareSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const shareType = normalizeShareType(parsed.data.shareType)
  const channel = normalizeShareChannel(parsed.data.channel)
  if (!shareType || !channel) {
    return c.json({ error: 'Unsupported share type or channel' }, 400)
  }

  const familyId = c.get('familyId')
  const existing = sqlite
    .prepare('SELECT id FROM recipes WHERE id = ? AND family_id = ?')
    .get(recipeId, familyId) as { id: number } | undefined

  if (!existing) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const response = await createShareResponse({
    familyId,
    userId: c.get('user').id,
    targetType: 'recipe',
    targetId: String(recipeId),
    shareType,
    channel,
  })

  if (!response) {
    return c.json({ error: 'Failed to share recipe' }, 500)
  }

  return c.json(response, 201)
})

recipesRouter.get('/:id/share-card', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')
  const existing = sqlite
    .prepare('SELECT id FROM recipes WHERE id = ? AND family_id = ?')
    .get(recipeId, familyId) as { id: number } | undefined

  if (!existing) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const payload = await getShareCardPreview({
    familyId,
    userId: c.get('user').id,
    targetType: 'recipe',
    targetId: String(recipeId),
  })

  if (!payload) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  return c.json(payload)
})

recipesRouter.post('/', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')
  const userId = user.id

  const body = await c.req.json()
  const parsed = createRecipeSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400
    )
  }

  const { title, description, steps, cook_minutes, servings, tags: tagIds } =
    parsed.data

  if (tagIds && tagIds.length > 0) {
    const placeholders = tagIds.map(() => '?').join(',')
    const validTags = sqlite
      .prepare(
        `SELECT id FROM tags WHERE id IN (${placeholders}) AND family_id = ?`
      )
      .all(...(tagIds as [number, ...number[]]), familyId) as Array<{
      id: number
    }>

    if (validTags.length !== tagIds.length) {
      return c.json({ error: 'Some tags do not belong to your family' }, 400)
    }
  }

  const result = sqlite.transaction(() => {
    const insertRecipe = sqlite
      .prepare(
        `INSERT INTO recipes (family_id, title, description, steps, cook_minutes, servings, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        familyId,
        title,
        description ?? null,
        JSON.stringify(steps),
        cook_minutes ?? null,
        servings ?? null,
        userId
      )

    const recipeId = Number(insertRecipe.lastInsertRowid)

    if (tagIds && tagIds.length > 0) {
      const insertTag = sqlite.prepare(
        'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)'
      )
      for (const tagId of tagIds) {
        insertTag.run(recipeId, tagId)
      }
    }

    return recipeId
  })()

  const [created] = sqlite
    .prepare(
      `SELECT id, title, description, steps, cook_minutes, servings, created_by, created_at, updated_at
       FROM recipes WHERE id = ?`
    )
    .all(result) as Array<{
    id: number
    title: string
    description: string | null
    steps: string | null
    cook_minutes: number | null
    servings: number | null
    created_by: number
    created_at: string
    updated_at: string
  }>

  const createdTags =
    tagIds && tagIds.length > 0
      ? (sqlite
          .prepare(
            `SELECT t.id, t.name FROM tags t
             INNER JOIN recipe_tags rt ON rt.tag_id = t.id
             WHERE rt.recipe_id = ?`
          )
           .all(result) as Array<{ id: number; name: string }>)
      : []

  notifyNewRecipe(user.displayName, created.title, created.cook_minutes ?? undefined)

  return c.json(
    {
      id: created.id,
      title: created.title,
      description: created.description,
      steps: created.steps ? JSON.parse(created.steps) : [],
      cook_minutes: created.cook_minutes,
      servings: created.servings,
      created_by: created.created_by,
      created_at: created.created_at,
      updated_at: created.updated_at,
      tags: createdTags,
    },
    201
  )
})

recipesRouter.put('/:id', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')

  const [existing] = sqlite
    .prepare('SELECT id FROM recipes WHERE id = ? AND family_id = ?')
    .all(recipeId, familyId) as Array<{ id: number }>

  if (!existing) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const body = await c.req.json()
  const parsed = updateRecipeSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400
    )
  }

  const { title, description, steps, cook_minutes, servings, tags: tagIds } =
    parsed.data

  if (tagIds && tagIds.length > 0) {
    const placeholders = tagIds.map(() => '?').join(',')
    const validTags = sqlite
      .prepare(
        `SELECT id FROM tags WHERE id IN (${placeholders}) AND family_id = ?`
      )
      .all(...(tagIds as [number, ...number[]]), familyId) as Array<{
      id: number
    }>

    if (validTags.length !== tagIds.length) {
      return c.json({ error: 'Some tags do not belong to your family' }, 400)
    }
  }

  sqlite.transaction(() => {
    const setClauses: string[] = []
    const setValues: unknown[] = []

    if (title !== undefined) {
      setClauses.push('title = ?')
      setValues.push(title)
    }
    if (description !== undefined) {
      setClauses.push('description = ?')
      setValues.push(description)
    }
    if (steps !== undefined) {
      setClauses.push('steps = ?')
      setValues.push(JSON.stringify(steps))
    }
    if (cook_minutes !== undefined) {
      setClauses.push('cook_minutes = ?')
      setValues.push(cook_minutes)
    }
    if (servings !== undefined) {
      setClauses.push('servings = ?')
      setValues.push(servings)
    }

    if (setClauses.length > 0) {
      setClauses.push("updated_at = datetime('now')")
      sqlite
        .prepare(
          `UPDATE recipes SET ${setClauses.join(', ')} WHERE id = ?`
        )
        .run(...(setValues as [unknown, ...unknown[]]), recipeId)
    }

    if (tagIds !== undefined) {
      sqlite
        .prepare('DELETE FROM recipe_tags WHERE recipe_id = ?')
        .run(recipeId)

      if (tagIds.length > 0) {
        const insertTag = sqlite.prepare(
          'INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)'
        )
        for (const tagId of tagIds) {
          insertTag.run(recipeId, tagId)
        }
      }
    }
  })()

  const [updated] = sqlite
    .prepare(
      `SELECT id, title, description, steps, cook_minutes, servings, created_by, created_at, updated_at
       FROM recipes WHERE id = ?`
    )
    .all(recipeId) as Array<{
    id: number
    title: string
    description: string | null
    steps: string | null
    cook_minutes: number | null
    servings: number | null
    created_by: number
    created_at: string
    updated_at: string
  }>

  const updatedTags = sqlite
    .prepare(
      `SELECT t.id, t.name FROM tags t
       INNER JOIN recipe_tags rt ON rt.tag_id = t.id
       WHERE rt.recipe_id = ?`
    )
    .all(recipeId) as Array<{ id: number; name: string }>

  return c.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    steps: updated.steps ? JSON.parse(updated.steps) : [],
    cook_minutes: updated.cook_minutes,
    servings: updated.servings,
    created_by: updated.created_by,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    tags: updatedTags,
  })
})

recipesRouter.delete('/:id', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')

  const [existing] = sqlite
    .prepare('SELECT id FROM recipes WHERE id = ? AND family_id = ?')
    .all(recipeId, familyId) as Array<{ id: number }>

  if (!existing) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  try {
    sqlite.transaction(() => {
      sqlite
        .prepare('DELETE FROM recipe_tags WHERE recipe_id = ?')
        .run(recipeId)

      sqlite
        .prepare('DELETE FROM recipe_images WHERE recipe_id = ?')
        .run(recipeId)

      sqlite
        .prepare('DELETE FROM favorites WHERE recipe_id = ?')
        .run(recipeId)

      sqlite
        .prepare(
          'DELETE FROM ratings WHERE cook_log_id IN (SELECT id FROM cook_logs WHERE recipe_id = ?)'
        )
        .run(recipeId)

      sqlite
        .prepare('DELETE FROM cook_logs WHERE recipe_id = ?')
        .run(recipeId)

      sqlite
        .prepare('UPDATE wishes SET recipe_id = NULL WHERE recipe_id = ?')
        .run(recipeId)

      sqlite.prepare('DELETE FROM recipes WHERE id = ?').run(recipeId)
    })()
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('FOREIGN KEY constraint failed')
    ) {
      return c.json(
        {
          error:
            'Cannot delete this recipe because it is referenced by existing orders. Please remove it from all orders first.',
        },
        409
      )
    }
    throw err
  }

  return c.json({ success: true })
})

export { recipesRouter }
