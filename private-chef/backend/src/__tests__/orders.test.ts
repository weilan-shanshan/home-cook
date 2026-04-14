import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext, readJson } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) {
      await cleanup()
    }
  }
})

describe.sequential('orders critical path', () => {
  test('creates an order transaction with multiple items', async () => {
    const ctx = await createTestContext({ stubWechat: true })
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'order-admin',
      displayName: '点餐管理员',
    })
    const recipeOne = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '红烧肉',
      imageUrl: 'https://example.com/1.jpg',
      thumbUrl: 'https://example.com/1-thumb.jpg',
    })
    const recipeTwo = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '清炒时蔬',
    })
    const cookie = ctx.createSessionCookie(family.userId)

    const response = await ctx.request('/api/orders', {
      method: 'POST',
      cookie,
      json: {
        meal_type: 'dinner',
        meal_date: '2026-04-11',
        note: '少辣',
        items: [
          { recipe_id: recipeOne.recipeId, quantity: 2 },
          { recipe_id: recipeTwo.recipeId, quantity: 1 },
        ],
      },
    })

    expect(response.status).toBe(201)

    const body = await readJson<{
      id: number
      mealType: string
      mealDate: string
      note: string | null
      status: string
      items: Array<{
        recipeId: number
        quantity: number
        recipeTitle: string
        image: { url: string; thumbUrl: string | null } | null
      }>
    }>(response)

    expect(body.mealType).toBe('dinner')
    expect(body.mealDate).toBe('2026-04-11')
    expect(body.note).toBe('少辣')
    expect(body.status).toBe('pending')
    expect(body.items).toHaveLength(2)
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipeId: recipeOne.recipeId,
          quantity: 2,
          recipeTitle: '红烧肉',
          image: {
            url: 'https://example.com/1.jpg',
            thumbUrl: 'https://example.com/1-thumb.jpg',
          },
        }),
        expect.objectContaining({
          recipeId: recipeTwo.recipeId,
          quantity: 1,
          recipeTitle: '清炒时蔬',
          image: null,
        }),
      ]),
    )

    const orderCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM orders')
      .get() as { count: number }
    const itemCount = ctx.sqlite
      .prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?')
      .get(body.id) as { count: number }

    expect(orderCount.count).toBe(1)
    expect(itemCount.count).toBe(2)
    expect(ctx.wechatMock?.notifyNewOrder).toHaveBeenCalledWith('点餐管理员', 'dinner', [
      '红烧肉',
      '清炒时蔬',
    ])
  })

  test('supports the valid pending -> confirmed -> completed status flow', async () => {
    const ctx = await createTestContext({ stubWechat: true })
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'status-admin',
      displayName: '状态管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '番茄炒蛋',
    })
    const cookie = ctx.createSessionCookie(family.userId)

    const createResponse = await ctx.request('/api/orders', {
      method: 'POST',
      cookie,
      json: {
        meal_type: 'lunch',
        meal_date: '2026-04-12',
        items: [{ recipe_id: recipe.recipeId, quantity: 1 }],
      },
    })
    const created = await readJson<{ id: number }>(createResponse)

    const confirmResponse = await ctx.request(`/api/orders/${created.id}/status`, {
      method: 'PUT',
      cookie,
      json: { status: 'confirmed' },
    })
    expect(confirmResponse.status).toBe(200)
    expect(await readJson<{ id: number; status: string }>(confirmResponse)).toEqual({
      id: created.id,
      status: 'confirmed',
    })

    const completeResponse = await ctx.request(`/api/orders/${created.id}/status`, {
      method: 'PUT',
      cookie,
      json: { status: 'completed' },
    })
    expect(completeResponse.status).toBe(200)
    expect(await readJson<{ id: number; status: string }>(completeResponse)).toEqual({
      id: created.id,
      status: 'completed',
    })

    const stored = ctx.sqlite
      .prepare('SELECT status FROM orders WHERE id = ?')
      .get(created.id) as { status: string }
    expect(stored.status).toBe('completed')
  })

  test('rejects invalid rollback attempts with 400 and leaves status unchanged', async () => {
    const ctx = await createTestContext({ stubWechat: true })
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'rollback-admin',
      displayName: '回滚管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '糖醋排骨',
    })
    const cookie = ctx.createSessionCookie(family.userId)

    const createResponse = await ctx.request('/api/orders', {
      method: 'POST',
      cookie,
      json: {
        meal_type: 'dinner',
        meal_date: '2026-04-13',
        items: [{ recipe_id: recipe.recipeId, quantity: 1 }],
      },
    })
    const created = await readJson<{ id: number }>(createResponse)

    await ctx.request(`/api/orders/${created.id}/status`, {
      method: 'PUT',
      cookie,
      json: { status: 'confirmed' },
    })
    await ctx.request(`/api/orders/${created.id}/status`, {
      method: 'PUT',
      cookie,
      json: { status: 'completed' },
    })

    const rollbackResponse = await ctx.request(`/api/orders/${created.id}/status`, {
      method: 'PUT',
      cookie,
      json: { status: 'confirmed' },
    })

    expect(rollbackResponse.status).toBe(400)
    expect(await readJson<{ error: string }>(rollbackResponse)).toEqual({
      error: "Cannot transition from 'completed' to 'confirmed'",
    })

    const stored = ctx.sqlite
      .prepare('SELECT status FROM orders WHERE id = ?')
      .get(created.id) as { status: string }
    expect(stored.status).toBe('completed')
  })

  test('enforces family isolation with 404 for another family', async () => {
    const ctx = await createTestContext({ stubWechat: true })
    cleanups.push(ctx.cleanup)

    const firstFamily = await ctx.seedFamily({
      username: 'family-one-admin',
      displayName: '家庭一管理员',
    })
    const firstRecipe = ctx.seedRecipe({
      familyId: firstFamily.familyId,
      createdBy: firstFamily.userId,
      title: '宫保鸡丁',
    })

    const createResponse = await ctx.request('/api/orders', {
      method: 'POST',
      cookie: ctx.createSessionCookie(firstFamily.userId),
      json: {
        meal_type: 'dinner',
        meal_date: '2026-04-14',
        items: [{ recipe_id: firstRecipe.recipeId, quantity: 1 }],
      },
    })
    const created = await readJson<{ id: number }>(createResponse)

    const secondFamily = await ctx.seedFamily({
      username: 'family-two-admin',
      displayName: '家庭二管理员',
      inviteCode: 'FAM002',
    })

    const otherFamilyResponse = await ctx.request(`/api/orders/${created.id}`, {
      cookie: ctx.createSessionCookie(secondFamily.userId),
    })

    expect(otherFamilyResponse.status).toBe(404)
    expect(await readJson<{ error: string }>(otherFamilyResponse)).toEqual({
      error: 'Order not found',
    })
  })
})
