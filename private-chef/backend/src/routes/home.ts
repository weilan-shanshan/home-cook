import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { getHomeSummary } from '../services/home-summary-service.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const homeRouter = new Hono<AuthEnv>()

homeRouter.use('*', authMiddleware)

homeRouter.get('/summary', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')

  return c.json(await getHomeSummary(familyId, user.id))
})

export { homeRouter }
