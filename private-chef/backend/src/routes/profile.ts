import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { getProfileSummary } from '../services/profile-summary-service.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const profileRouter = new Hono<AuthEnv>()

profileRouter.use('*', authMiddleware)

profileRouter.get('/summary', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')

  return c.json(await getProfileSummary(familyId, user.id))
})

export { profileRouter }
