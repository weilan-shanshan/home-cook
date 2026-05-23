import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { sqlite } from '../db/index.js'
import { resolveImageUrls } from '../lib/image-urls.js'
import {
  getAchievementLeaderboard,
  getAchievementSummary,
} from '../services/achievement-service.js'
import {
  createShareResponse,
  getShareCardPreview,
  normalizeShareChannel,
  normalizeShareType,
} from '../services/sharing-service.js'
import { z } from 'zod'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const achievementsRouter = new Hono<AuthEnv>()

const achievementsShareSchema = z.object({
  shareType: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50),
})

achievementsRouter.use('*', authMiddleware)

achievementsRouter.get('/summary', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')

  return c.json(await getAchievementSummary(familyId, user.id))
})

// Top recipes feeding the two achievement progress rows on home:
//   - orders: most-ordered recipes in this family (drives "想吃达人")
//   - cooks:  most-cooked recipes in this family (drives "家庭掌勺")
achievementsRouter.get('/dishes', async (c) => {
  const familyId = c.get('familyId')

  type Row = {
    id: number
    title: string
    first_image_url: string | null
    first_thumb_url: string | null
    score: number
  }

  const orderRows = sqlite
    .prepare(
      `SELECT r.id, r.title,
              ri.url AS first_image_url, ri.thumb_url AS first_thumb_url,
              COUNT(oi.id) AS score
       FROM recipes r
       LEFT JOIN order_items oi ON oi.recipe_id = r.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.family_id = ?
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = (
         SELECT MIN(sort_order) FROM recipe_images WHERE recipe_id = r.id
       )
       WHERE r.family_id = ?
       GROUP BY r.id
       HAVING score > 0
       ORDER BY score DESC, r.id DESC
       LIMIT 4`,
    )
    .all(familyId, familyId) as Row[]

  const cookRows = sqlite
    .prepare(
      `SELECT r.id, r.title,
              ri.url AS first_image_url, ri.thumb_url AS first_thumb_url,
              COUNT(cl.id) AS score
       FROM recipes r
       LEFT JOIN cook_logs cl ON cl.recipe_id = r.id
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = (
         SELECT MIN(sort_order) FROM recipe_images WHERE recipe_id = r.id
       )
       WHERE r.family_id = ?
       GROUP BY r.id
       HAVING score > 0
       ORDER BY score DESC, r.id DESC
       LIMIT 4`,
    )
    .all(familyId) as Row[]

  const enrich = (rows: Row[]) =>
    Promise.all(
      rows.map(async (r) => {
        const image = await resolveImageUrls(r.first_image_url, r.first_thumb_url)
        return {
          recipe_id: r.id,
          title: r.title,
          score: r.score,
          first_image: image,
        }
      }),
    )

  const [orders, cooks] = await Promise.all([enrich(orderRows), enrich(cookRows)])
  return c.json({ orders, cooks })
})

achievementsRouter.get('/leaderboard', async (c) => {
  const familyId = c.get('familyId')

  return c.json(await getAchievementLeaderboard(familyId))
})

achievementsRouter.post('/share', async (c) => {
  const parsed = achievementsShareSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const shareType = normalizeShareType(parsed.data.shareType)
  const channel = normalizeShareChannel(parsed.data.channel)
  if (!shareType || !channel) {
    return c.json({ error: 'Unsupported share type or channel' }, 400)
  }

  const familyId = c.get('familyId')
  const userId = c.get('user').id
  const response = await createShareResponse({
    familyId,
    userId,
    targetType: 'achievements',
    targetId: 'family',
    shareType,
    channel,
  })

  if (!response) {
    return c.json({ error: 'Failed to share achievements' }, 500)
  }

  return c.json(response, 201)
})

achievementsRouter.get('/share-card', async (c) => {
  const familyId = c.get('familyId')
  const userId = c.get('user').id

  const payload = await getShareCardPreview({
    familyId,
    userId,
    targetType: 'achievements',
    targetId: 'family',
  })

  if (!payload) {
    return c.json({ error: 'Achievements not found' }, 404)
  }

  return c.json(payload)
})

export { achievementsRouter }
