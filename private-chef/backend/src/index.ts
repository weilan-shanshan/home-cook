import { env } from './lib/env.js'
import { serve } from '@hono/node-server'
import { app } from './app.js'

export type { AppType } from './app.js'

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
})
