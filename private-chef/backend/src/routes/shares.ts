import { Hono } from 'hono'
import { getPublicSharePayload } from '../services/sharing-service.js'

const sharesRouter = new Hono()

sharesRouter.get('/:token', async (c) => {
  const token = c.req.param('token').trim()
  if (!token) {
    return c.json({ error: 'Invalid share token' }, 400)
  }

  const payload = await getPublicSharePayload(token)
  if (!payload) {
    return c.json({ error: 'Share not found' }, 404)
  }

  return c.json(payload)
})

export { sharesRouter }
