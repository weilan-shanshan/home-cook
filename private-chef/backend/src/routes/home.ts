import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { getHomeSummary } from '../services/home-summary-service.js'
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

const homeRouter = new Hono<AuthEnv>()

const homeShareSchema = z.object({
  shareType: z.string().trim().min(1).max(50),
  channel: z.string().trim().min(1).max(50),
})

homeRouter.use('*', authMiddleware)

homeRouter.get('/summary', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')

  return c.json(await getHomeSummary(familyId, user.id))
})

homeRouter.post('/share', async (c) => {
  const parsed = homeShareSchema.safeParse(await c.req.json())
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
    targetType: 'daily_menu',
    targetId: 'today',
    shareType,
    channel,
  })

  if (!response) {
    return c.json({ error: 'Failed to share daily menu' }, 500)
  }

  return c.json(response, 201)
})

homeRouter.get('/share-card', async (c) => {
  const familyId = c.get('familyId')
  const userId = c.get('user').id

  const payload = await getShareCardPreview({
    familyId,
    userId,
    targetType: 'daily_menu',
    targetId: 'today',
  })

  if (!payload) {
    return c.json({ error: 'Daily menu not found' }, 404)
  }

  return c.json(payload)
})

export { homeRouter }
