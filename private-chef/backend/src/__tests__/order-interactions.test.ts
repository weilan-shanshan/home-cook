import { Hono } from 'hono'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createTestContext, readJson, type TestContext } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) {
      await cleanup()
    }
  }

  vi.resetModules()
  vi.doUnmock('../services/notification-service.js')
})

async function createInteractionsRequest() {
  vi.doMock('../services/notification-service.js', () => ({
    createNotificationEvent: vi.fn(async () => ({ id: 1 })),
    shutdownNotificationService: vi.fn(async () => undefined),
  }))

  const { orderInteractionsRouter } = await import('../routes/order-interactions.js')
  const app = new Hono().route('/api/orders', orderInteractionsRouter)

  return (path: string, init: Omit<RequestInit, 'body'> & { json?: unknown; cookie?: string } = {}) => {
    const { json, cookie, headers, ...rest } = init
    const requestHeaders = new Headers(headers)

    let body: BodyInit | undefined
    if (json !== undefined) {
      requestHeaders.set('Content-Type', 'application/json')
      body = JSON.stringify(json)
    }

    if (cookie) {
      requestHeaders.set('Cookie', cookie)
    }

    return Promise.resolve(
      app.request(path, {
        ...rest,
        headers: requestHeaders,
        body,
      }),
    )
  }
}

function seedOrder(ctx: TestContext, input: { familyId: number; userId: number }) {
  const recipe = ctx.seedRecipe({
    familyId: input.familyId,
    createdBy: input.userId,
    title: '测试订单菜品',
  })

  const orderResult = ctx.sqlite
    .prepare(
      'INSERT INTO orders (family_id, user_id, meal_type, meal_date, status) VALUES (?, ?, ?, ?, ?)',
    )
    .run(input.familyId, input.userId, 'dinner', '2026-04-16', 'submitted')
  const orderId = Number(orderResult.lastInsertRowid)

  ctx.sqlite
    .prepare(
      'INSERT INTO order_status_events (order_id, from_status, to_status, operator_id, note) VALUES (?, ?, ?, ?, ?)',
    )
    .run(orderId, null, 'submitted', input.userId, 'Order created')

  ctx.sqlite
    .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
    .run(orderId, recipe.recipeId, 1)

  return { id: orderId }
}

describe.sequential('order interactions api', () => {
  test('likes an order idempotently without duplicating rows or notifications', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'like-admin',
      displayName: '点赞管理员',
    })
    const createdOrder = seedOrder(ctx, family)
    const request = await createInteractionsRequest()
    const cookie = ctx.createSessionCookie(family.userId)

    const firstResponse = await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'POST',
      cookie,
    })
    expect(firstResponse.status).toBe(201)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        liked: boolean
        created_at: string
      }>(firstResponse),
    ).toEqual(
      expect.objectContaining({
        order_id: createdOrder.id,
        user_id: family.userId,
        liked: true,
      }),
    )

    const secondResponse = await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'POST',
      cookie,
    })
    expect(secondResponse.status).toBe(200)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        liked: boolean
        created_at: string
      }>(secondResponse),
    ).toEqual(
      expect.objectContaining({
        order_id: createdOrder.id,
        user_id: family.userId,
        liked: true,
      }),
    )

    const likeCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM order_likes WHERE order_id = ? AND user_id = ?')
      .get(createdOrder.id, family.userId) as { count: number }
    expect(likeCount.count).toBe(1)
  })

  test('unlikes an order by deleting the like row', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'unlike-admin',
      displayName: '取消点赞管理员',
    })
    const createdOrder = seedOrder(ctx, family)
    const request = await createInteractionsRequest()
    const cookie = ctx.createSessionCookie(family.userId)

    await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'POST',
      cookie,
    })
    const unlikeResponse = await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'DELETE',
      cookie,
    })

    expect(unlikeResponse.status).toBe(200)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        liked: boolean
      }>(unlikeResponse),
    ).toEqual({
      order_id: createdOrder.id,
      user_id: family.userId,
      liked: false,
    })

    const likeCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM order_likes WHERE order_id = ? AND user_id = ?')
      .get(createdOrder.id, family.userId) as { count: number }

    expect(likeCount.count).toBe(0)
  })

  test('persists a share event and creates a notification event', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'share-admin',
      displayName: '分享管理员',
    })
    const createdOrder = seedOrder(ctx, family)
    const request = await createInteractionsRequest()
    const cookie = ctx.createSessionCookie(family.userId)

    const shareResponse = await request(`/api/orders/${createdOrder.id}/share`, {
      method: 'POST',
      cookie,
      json: {
        shareType: 'card',
        channel: 'wechat',
      },
    })

    expect(shareResponse.status).toBe(201)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        share_type: string
        channel: string
        id: number
        created_at: string
      }>(shareResponse),
    ).toEqual(
      expect.objectContaining({
        order_id: createdOrder.id,
        user_id: family.userId,
        share_type: 'card',
        channel: 'wechat',
      }),
    )

    const shareRow = ctx.sqlite
      .prepare('SELECT order_id as orderId, user_id as userId, share_type as shareType, channel FROM order_shares WHERE order_id = ? ORDER BY id DESC LIMIT 1')
      .get(createdOrder.id) as {
      orderId: number
      userId: number
      shareType: string
      channel: string
    }
    expect(shareRow).toEqual({
      orderId: createdOrder.id,
      userId: family.userId,
      shareType: 'card',
      channel: 'wechat',
    })
  })

  test('returns 404 for another family trying to like, unlike, or share', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const firstFamily = await ctx.seedFamily({
      username: 'interactions-family-one',
      displayName: '家庭一互动员',
    })
    const createdOrder = seedOrder(ctx, firstFamily)

    const secondFamily = await ctx.seedFamily({
      username: 'interactions-family-two',
      displayName: '家庭二互动员',
      inviteCode: 'INT002',
    })
    const request = await createInteractionsRequest()
    const otherCookie = ctx.createSessionCookie(secondFamily.userId)

    const otherLikeResponse = await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'POST',
      cookie: otherCookie,
    })
    expect(otherLikeResponse.status).toBe(404)
    expect(await readJson<{ error: string }>(otherLikeResponse)).toEqual({
      error: 'Order not found',
    })

    const otherUnlikeResponse = await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'DELETE',
      cookie: otherCookie,
    })
    expect(otherUnlikeResponse.status).toBe(404)
    expect(await readJson<{ error: string }>(otherUnlikeResponse)).toEqual({
      error: 'Order not found',
    })

    const otherShareResponse = await request(`/api/orders/${createdOrder.id}/share`, {
      method: 'POST',
      cookie: otherCookie,
      json: {
        shareType: 'card',
        channel: 'wechat',
      },
    })
    expect(otherShareResponse.status).toBe(404)
    expect(await readJson<{ error: string }>(otherShareResponse)).toEqual({
      error: 'Order not found',
    })
  })

  test('returns share-card payload for same-family order and 404 for another family', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'share-card-admin',
      displayName: '分享卡管理员',
    })
    const createdOrder = seedOrder(ctx, family)
    const request = await createInteractionsRequest()
    const cookie = ctx.createSessionCookie(family.userId)

    await request(`/api/orders/${createdOrder.id}/like`, {
      method: 'POST',
      cookie,
    })

    const shareCardResponse = await request(`/api/orders/${createdOrder.id}/share-card`, {
      cookie,
    })

    expect(shareCardResponse.status).toBe(200)
    expect(
      await readJson<{
        target_type: string
        title: string
        order: {
          id: number
          meal_type: string
          meal_date: string
          note: string | null
          status: string
          created_at: string
        }
        items: Array<{
          id: number
          recipe_id: number
          quantity: number
          recipe_title: string
          image: { url: string; thumbUrl: string | null } | null
        }>
        like_count: number
      }>(shareCardResponse),
    ).toEqual(
      expect.objectContaining({
        target_type: 'order',
        title: expect.stringContaining('点的'),
        order: expect.objectContaining({
          id: createdOrder.id,
          meal_type: 'dinner',
          status: 'submitted',
        }),
        items: [
          expect.objectContaining({
            quantity: 1,
            recipe_title: '测试订单菜品',
          }),
        ],
        like_count: 1,
      }),
    )

    const otherFamily = await ctx.seedFamily({
      username: 'share-card-other-family',
      displayName: '分享卡其他家庭',
      inviteCode: 'SCF002',
    })
    const otherCookie = ctx.createSessionCookie(otherFamily.userId)
    const forbiddenResponse = await request(`/api/orders/${createdOrder.id}/share-card`, {
      cookie: otherCookie,
    })
    expect(forbiddenResponse.status).toBe(404)
    expect(await readJson<{ error: string }>(forbiddenResponse)).toEqual({
      error: 'Order not found',
    })
  })
})
