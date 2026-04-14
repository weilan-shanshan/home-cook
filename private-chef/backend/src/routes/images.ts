import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { recipes, recipeImages } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { getPresignedUploadUrl } from '../lib/cos.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const saveImageSchema = z.object({
  url: z.string().url().min(1),
  thumb_url: z.string().url().optional(),
  sort_order: z.number().int().min(0).optional(),
})

const imagesRouter = new Hono<AuthEnv>()

imagesRouter.use('*', authMiddleware)

imagesRouter.get('/upload/presign', async (c) => {
  const filename = c.req.query('filename')
  const contentType = c.req.query('contentType')

  if (!filename) {
    return c.json({ error: 'filename query parameter is required' }, 400)
  }

  try {
    const result = await getPresignedUploadUrl(filename, contentType)
    return c.json(result)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to generate presigned URL'
    return c.json({ error: message }, 500)
  }
})

imagesRouter.post('/recipes/:id/images', async (c) => {
  const recipeId = Number(c.req.param('id'))
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return c.json({ error: 'Invalid recipe id' }, 400)
  }

  const familyId = c.get('familyId')

  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.familyId, familyId)))
    .limit(1)

  if (!recipe) {
    return c.json({ error: 'Recipe not found' }, 404)
  }

  const body = await c.req.json()
  const parsed = saveImageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      400,
    )
  }

  const [inserted] = await db
    .insert(recipeImages)
    .values({
      recipeId,
      url: parsed.data.url,
      thumbUrl: parsed.data.thumb_url ?? null,
      sortOrder: parsed.data.sort_order ?? 0,
    })
    .returning({
      id: recipeImages.id,
      recipeId: recipeImages.recipeId,
      url: recipeImages.url,
      thumbUrl: recipeImages.thumbUrl,
      sortOrder: recipeImages.sortOrder,
      createdAt: recipeImages.createdAt,
    })

  return c.json(inserted, 201)
})

imagesRouter.delete('/images/:id', async (c) => {
  const imageId = Number(c.req.param('id'))
  if (!Number.isFinite(imageId) || imageId <= 0) {
    return c.json({ error: 'Invalid image id' }, 400)
  }

  const familyId = c.get('familyId')

  const [image] = await db
    .select({ id: recipeImages.id })
    .from(recipeImages)
    .innerJoin(recipes, eq(recipeImages.recipeId, recipes.id))
    .where(and(eq(recipeImages.id, imageId), eq(recipes.familyId, familyId)))
    .limit(1)

  if (!image) {
    return c.json({ error: 'Image not found' }, 404)
  }

  await db.delete(recipeImages).where(eq(recipeImages.id, imageId))

  return c.json({ success: true })
})

export { imagesRouter }
