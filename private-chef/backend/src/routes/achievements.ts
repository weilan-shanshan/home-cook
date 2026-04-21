import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
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
