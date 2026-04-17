import { Hono } from 'hono'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import {
  getAchievementLeaderboard,
  getAchievementSummary,
} from '../services/achievement-service.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const achievementsRouter = new Hono<AuthEnv>()

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

export { achievementsRouter }
