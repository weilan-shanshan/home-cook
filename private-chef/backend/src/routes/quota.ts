import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { getQuotaUsage } from '../lib/quota.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const quotaRouter = new Hono<AuthEnv>()

quotaRouter.use('*', authMiddleware)

quotaRouter.get('/', (c) => {
  const familyId = c.get('familyId')
  return c.json(getQuotaUsage(familyId))
})

export { quotaRouter }
