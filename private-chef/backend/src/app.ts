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

function isSqliteUniqueError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('UNIQUE constraint failed')
}

export function createApp() {
  const app = new Hono()
    .use('*', corsMiddleware)
    .get('/', (c) => c.json({ status: 'ok' }))
    .route('/api/auth', authRouter)
    .route('/api/tags', tagsRouter)
    .route('/api', imagesRouter)
    .route('/api/recipes', recipesRouter)
    .route('/api/orders', ordersRouter)
    .route('/api/wishes', wishesRouter)
    .route('/api/favorites', favoritesRouter)
    .route('/api/cook-logs', cookLogsRouter)
    .route('/api', ratingsRouter)
    .route('/api/families', familiesRouter)

  app.onError((error, c) => {
    if (error instanceof ZodError) {
      return c.json(
        { error: 'Validation failed', details: error.flatten() },
        400,
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
