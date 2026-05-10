import { env } from './lib/env.js'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import {
  ensureDeliveryLoopStarted,
  shutdownNotificationService,
} from './services/notification-service.js'

export type { AppType } from './app.js'

ensureDeliveryLoopStarted()

const server = serve({ fetch: app.fetch, port: env.PORT }, () => {
  process.stdout.write(`Server running on http://localhost:${env.PORT}\n`)
  if (!env.WECHAT_WEBHOOK_URL) {
    process.stdout.write(
      '[notification] WECHAT_WEBHOOK_URL is not set — group notifications are disabled until configured.\n',
    )
  }
})

async function gracefulShutdown(signal: string) {
  process.stdout.write(`\nReceived ${signal}, shutting down...\n`)
  await shutdownNotificationService()
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => void gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'))
