import { Hono } from 'hono'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { type TestContext, createTestContext, readJson } from './helpers.js'

async function createReviewsRequest() {
  vi.doMock('../services/notification-service.js', () => ({
    createNotificationEvent: vi.fn(async () => ({ id: 1 })),
    shutdownNotificationService: vi.fn(async () => undefined),
  }))

  const { orderReviewsRouter } = await import('../routes/order-reviews.js')
  const app = new Hono().route('/api/orders', orderReviewsRouter)

  return (path: string, init: RequestInit = {}) => app.request(path, init)
}

function seedOrder(
  ctx: TestContext,
  input: {
    familyId: number
    userId: number
    recipeId: number
    mealType?: string
    mealDate?: string
  },
) {
  const orderResult = ctx.sqlite
    .prepare(
      'INSERT INTO orders (family_id, user_id, meal_type, meal_date, status) VALUES (?, ?, ?, ?, ?)',
    )
    .run(
      input.familyId,
      input.userId,
      input.mealType ?? 'dinner',
      input.mealDate ?? '2026-04-16',
      'submitted',
    )
  const orderId = Number(orderResult.lastInsertRowid)

  ctx.sqlite
    .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
    .run(orderId, input.recipeId, 1)

  return { orderId }
}

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

describe.sequential('order reviews api', () => {
  test('creates and lists reviews for an order', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)
    const reviewsRequest = await createReviewsRequest()

    const family = await ctx.seedFamily({
      username: 'reviews-admin',
      displayName: '评价管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '香煎三文鱼',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const createdOrder = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      recipeId: recipe.recipeId,
    })

    const postResponse = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 5,
        tasteScore: 5,
        portionScore: 4,
        overallNote: '非常好吃',
      }),
    })

    expect(postResponse.status).toBe(201)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        display_name: string
        score: number
        taste_score: number
        portion_score: number
        overall_note: string | null
      }>(postResponse),
    ).toEqual(
      expect.objectContaining({
        order_id: createdOrder.orderId,
        user_id: family.userId,
        display_name: '评价管理员',
        score: 5,
        taste_score: 5,
        portion_score: 4,
        overall_note: '非常好吃',
      }),
    )

    const getResponse = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      headers: { Cookie: cookie },
    })

    expect(getResponse.status).toBe(200)
    expect(
      await readJson<
        Array<{
          order_id: number
          user_id: number
          display_name: string
          score: number
          taste_score: number
          portion_score: number
          overall_note: string | null
        }>
      >(getResponse),
    ).toEqual([
      expect.objectContaining({
        order_id: createdOrder.orderId,
        user_id: family.userId,
        display_name: '评价管理员',
        score: 5,
        taste_score: 5,
        portion_score: 4,
        overall_note: '非常好吃',
      }),
    ])
  })

  test('returns 409 when the same user reviews the same order twice', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)
    const reviewsRequest = await createReviewsRequest()

    const family = await ctx.seedFamily({
      username: 'duplicate-review-admin',
      displayName: '重复评价管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '酸菜鱼',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const createdOrder = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      recipeId: recipe.recipeId,
      mealType: 'lunch',
    })

    const firstResponse = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 4,
        tasteScore: 4,
        portionScore: 4,
        overallNote: '第一次评价',
      }),
    })
    expect(firstResponse.status).toBe(201)

    const secondResponse = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 5,
        tasteScore: 5,
        portionScore: 5,
        overallNote: '第二次评价',
      }),
    })

    expect(secondResponse.status).toBe(409)
    expect(await readJson<{ error: string }>(secondResponse)).toEqual({
      error: 'You have already reviewed this order',
    })
  })

  test('returns 400 for invalid score values', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)
    const reviewsRequest = await createReviewsRequest()

    const family = await ctx.seedFamily({
      username: 'invalid-review-admin',
      displayName: '无效评价管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '酸菜鱼',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const createdOrder = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      recipeId: recipe.recipeId,
    })

    const response = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: 6,
        tasteScore: 5,
        portionScore: 4,
        overallNote: '分数超范围',
      }),
    })

    expect(response.status).toBe(400)
    expect(await readJson<{ error: string }>(response)).toEqual(
      expect.objectContaining({ error: 'Validation failed' }),
    )
  })

  test('returns 404 for another family trying to access reviews', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)
    const reviewsRequest = await createReviewsRequest()

    const firstFamily = await ctx.seedFamily({
      username: 'reviews-family-one',
      displayName: '家庭一评价员',
    })
    const recipe = ctx.seedRecipe({
      familyId: firstFamily.familyId,
      createdBy: firstFamily.userId,
      title: '蒜蓉虾',
    })

    const createdOrder = seedOrder(ctx, {
      familyId: firstFamily.familyId,
      userId: firstFamily.userId,
      recipeId: recipe.recipeId,
    })

    const secondFamily = await ctx.seedFamily({
      username: 'reviews-family-two',
      displayName: '家庭二评价员',
      inviteCode: 'REV002',
    })

    const otherFamilyGet = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      headers: { Cookie: ctx.createSessionCookie(secondFamily.userId) },
    })
    expect(otherFamilyGet.status).toBe(404)
    expect(await readJson<{ error: string }>(otherFamilyGet)).toEqual({
      error: 'Order not found',
    })

    const otherFamilyPost = await reviewsRequest(`/api/orders/${createdOrder.orderId}/reviews`, {
      method: 'POST',
      headers: {
        Cookie: ctx.createSessionCookie(secondFamily.userId),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: 5,
        tasteScore: 5,
        portionScore: 5,
        overallNote: '越权评价',
      }),
    })
    expect(otherFamilyPost.status).toBe(404)
    expect(await readJson<{ error: string }>(otherFamilyPost)).toEqual({
      error: 'Order not found',
    })
  })
})
