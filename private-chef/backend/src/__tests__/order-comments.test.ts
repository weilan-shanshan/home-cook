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

describe.sequential('order comments api', () => {
  test('creates and lists comments for an order', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'comments-admin',
      displayName: '评论管理员',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '红烧鱼',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const createOrderResponse = await ctx.request('/api/orders', {
      method: 'POST',
      cookie,
      json: {
        meal_type: 'dinner',
        meal_date: '2026-04-16',
        items: [{ recipe_id: recipe.recipeId, quantity: 1 }],
      },
    })

    expect(createOrderResponse.status).toBe(201)
    const createdOrder = await readJson<{ id: number }>(createOrderResponse)

    const postResponse = await ctx.request(`/api/orders/${createdOrder.id}/comments`, {
      method: 'POST',
      cookie,
      json: {
        content: '看起来很好吃！',
        roleType: 'requester',
      },
    })

    expect(postResponse.status).toBe(201)
    expect(
      await readJson<{
        order_id: number
        user_id: number
        display_name: string
        role_type: string
        content: string
      }>(postResponse),
    ).toEqual(
      expect.objectContaining({
        order_id: createdOrder.id,
        user_id: family.userId,
        display_name: '评论管理员',
        role_type: 'requester',
        content: '看起来很好吃！',
      }),
    )

    const getResponse = await ctx.request(`/api/orders/${createdOrder.id}/comments`, {
      cookie,
    })

    expect(getResponse.status).toBe(200)
    expect(
      await readJson<
        Array<{
          order_id: number
          user_id: number
          display_name: string
          role_type: string
          content: string
        }>
      >(getResponse),
    ).toEqual([
      expect.objectContaining({
        order_id: createdOrder.id,
        user_id: family.userId,
        display_name: '评论管理员',
        role_type: 'requester',
        content: '看起来很好吃！',
      }),
    ])
  })

  test('returns 404 for another family trying to access comments', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const firstFamily = await ctx.seedFamily({
      username: 'comments-family-one',
      displayName: '家庭一评论员',
    })
    const recipe = ctx.seedRecipe({
      familyId: firstFamily.familyId,
      createdBy: firstFamily.userId,
      title: '宫保鸡丁',
    })

    const createOrderResponse = await ctx.request('/api/orders', {
      method: 'POST',
      cookie: ctx.createSessionCookie(firstFamily.userId),
      json: {
        meal_type: 'lunch',
        meal_date: '2026-04-16',
        items: [{ recipe_id: recipe.recipeId, quantity: 1 }],
      },
    })
    const createdOrder = await readJson<{ id: number }>(createOrderResponse)

    const secondFamily = await ctx.seedFamily({
      username: 'comments-family-two',
      displayName: '家庭二评论员',
      inviteCode: 'COM002',
    })

    const otherFamilyGet = await ctx.request(`/api/orders/${createdOrder.id}/comments`, {
      cookie: ctx.createSessionCookie(secondFamily.userId),
    })
    expect(otherFamilyGet.status).toBe(404)
    expect(await readJson<{ error: string }>(otherFamilyGet)).toEqual({
      error: 'Order not found',
    })

    const otherFamilyPost = await ctx.request(`/api/orders/${createdOrder.id}/comments`, {
      method: 'POST',
      cookie: ctx.createSessionCookie(secondFamily.userId),
      json: {
        content: '越权评论',
        roleType: 'member',
      },
    })
    expect(otherFamilyPost.status).toBe(404)
    expect(await readJson<{ error: string }>(otherFamilyPost)).toEqual({
      error: 'Order not found',
    })
  })
})
