import { Hono } from 'hono'
import { ZodError } from 'zod'
import { corsMiddleware } from './middleware/cors.js'
import { authRouter } from './routes/auth.js'
import { tagsRouter } from './routes/tags.js'
import { imagesRouter } from './routes/images.js'
import { recipesRouter } from './routes/recipes.js'
import { ordersRouter } from './routes/orders.js'
import { wishesRouter } from './routes/wishes.js'
import { favoritesRouter } from './routes/favorites.js'
import { cookLogsRouter } from './routes/cook-logs.js'
import { ratingsRouter } from './routes/ratings.js'
import { familiesRouter } from './routes/families.js'
import { orderCommentsRouter } from './routes/order-comments.js'
import { orderReviewsRouter } from './routes/order-reviews.js'
import { orderInteractionsRouter } from './routes/order-interactions.js'
import { homeRouter } from './routes/home.js'
import { profileRouter } from './routes/profile.js'
import { achievementsRouter } from './routes/achievements.js'
import { sharesRouter } from './routes/shares.js'
import { squareRouter } from './routes/square.js'
import { aiRouter } from './routes/ai.js'
import { quotaRouter } from './routes/quota.js'
import { QuotaExceededError } from './lib/quota.js'

function isSqliteUniqueError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed')
}

export function createApp() {
  const app = new Hono()
    .use('*', corsMiddleware)
    .get('/', (c) => c.json({ status: 'ok' }))
    .route('/api/auth', authRouter)
    .route('/api/shares', sharesRouter)
    .route('/api/tags', tagsRouter)
    .route('/api', imagesRouter)
    .route('/api/recipes', recipesRouter)
    .route('/api/orders', ordersRouter)
    .route('/api/orders', orderCommentsRouter)
    .route('/api/orders', orderReviewsRouter)
    .route('/api/orders', orderInteractionsRouter)
    .route('/api/home', homeRouter)
    .route('/api/profile', profileRouter)
    .route('/api/achievements', achievementsRouter)
    .route('/api/wishes', wishesRouter)
    .route('/api/favorites', favoritesRouter)
    .route('/api/cook-logs', cookLogsRouter)
    .route('/api', ratingsRouter)
    .route('/api/families', familiesRouter)
    .route('/api/square', squareRouter)
    .route('/api/ai', aiRouter)
    .route('/api/quota', quotaRouter)

  app.onError((error, c) => {
    if (error instanceof ZodError) {
      return c.json(
        { error: 'Validation failed', details: error.flatten() },
        400,
      )
    }

    if (error instanceof QuotaExceededError) {
      return c.json(
        {
          error: 'quota_exceeded',
          resource: error.resource,
          used: error.used,
          limit: error.limit,
          message:
            error.resource === 'recipes'
              ? '免费版最多创建 30 道菜，已达上限'
              : '免费版最多上传 60 张图，已达上限',
        },
        409,
      )
    }

    if (isSqliteUniqueError(error)) {
      return c.json({ error: 'Resource already exists' }, 409)
    }

    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  })

  return app
}

export const app = createApp()
export type AppType = typeof app
