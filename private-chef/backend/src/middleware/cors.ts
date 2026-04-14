import { cors } from 'hono/cors'
import { env } from '../lib/env.js'

const LOCAL_ORIGINS = new Set(['http://localhost:5173'])

function isAllowedOrigin(origin: string): boolean {
  if (LOCAL_ORIGINS.has(origin)) {
    return true
  }

  try {
    const configuredOrigin = new URL(env.FRONTEND_ORIGIN)
    const requestOrigin = new URL(origin)

    if (configuredOrigin.protocol !== requestOrigin.protocol) {
      return false
    }

    const configuredHost = configuredOrigin.hostname
    const requestHost = requestOrigin.hostname

    return requestHost === configuredHost || requestHost.endsWith(`.${configuredHost}`)
  } catch {
    return false
  }
}

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin) {
      return undefined
    }

    return isAllowedOrigin(origin) ? origin : undefined
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})

export { isAllowedOrigin }
