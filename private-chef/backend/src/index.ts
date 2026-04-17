import { env } from './lib/env.js'
import { serve } from '@hono/node-server'
import { app } from './app.js'

export type { AppType } from './app.js'

serve({ fetch: app.fetch, port: env.PORT }, () => {
  process.stdout.write(`Server running on http://localhost:${env.PORT}\n`)
})
