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

function seedOrder(
  ctx: Awaited<ReturnType<typeof createTestContext>>,
  input: { familyId: number; userId: number; cookUserId?: number | null; recipeId: number },
) {
  const result = ctx.sqlite
    .prepare(
      `INSERT INTO orders (family_id, user_id, cook_user_id, meal_type, meal_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(input.familyId, input.userId, input.cookUserId ?? null, 'dinner', '2026-04-20', 'completed')

  const orderId = Number(result.lastInsertRowid)

  ctx.sqlite
    .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
    .run(orderId, input.recipeId, 2)

  return { orderId }
}

describe.sequential('sharing api', () => {
  test('creates public share records for order and resolves public payload', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({ username: 'share-public', displayName: '公开分享管理员' })
    const cook = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'share-public-cook',
      displayName: '公开大厨',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '红烧排骨',
      imageUrl: 'https://example.com/order.jpg',
      thumbUrl: 'https://example.com/order-thumb.jpg',
    })
    const order = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: cook.userId,
      recipeId: recipe.recipeId,
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const createResponse = await ctx.request(`/api/orders/${order.orderId}/share`, {
      method: 'POST',
      cookie,
      json: {
        shareType: 'poster',
        channel: 'poster_download',
      },
    })

    expect(createResponse.status).toBe(201)
    const created = await readJson<{
      token: string
      share_url: string
      target_type: string
      poster: { qr_target_url: string | null }
    }>(createResponse)

    expect(created.target_type).toBe('order')
    expect(created.share_url).toContain(`/share/${created.token}`)
    expect(created.poster.qr_target_url).toBe(created.share_url)

    const publicResponse = await ctx.request(`/api/shares/${created.token}`)
    expect(publicResponse.status).toBe(200)
    const payload = await readJson<{
      target_type: string
      title: string
      share_page: { token: string; url: string } | null
      public_context: {
        family_name: string | null
        requester_display_name?: string | null
        cook_display_name?: string | null
      }
      items: Array<{ recipe_title: string; quantity: number }>
    }>(publicResponse)

    expect(payload.target_type).toBe('order')
    expect(payload.title).toContain('点的')
    expect(payload.share_page?.token).toBe(created.token)
    expect(payload.public_context.family_name).toContain('家庭')
    expect(payload.public_context.requester_display_name).toBe('公开分享管理员')
    expect(payload.public_context.cook_display_name).toBe('公开大厨')
    expect(payload.items).toEqual([
      expect.objectContaining({ recipe_title: '红烧排骨', quantity: 2 }),
    ])
  })

  test('supports recipe, achievements, and daily menu share-card flows', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({ username: 'share-multi', displayName: '多场景分享管理员' })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '糖醋里脊',
      imageUrl: 'https://example.com/recipe.jpg',
      thumbUrl: 'https://example.com/recipe-thumb.jpg',
    })
    seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      recipeId: recipe.recipeId,
    })

    const cookie = ctx.createSessionCookie(family.userId)

    const recipeCardResponse = await ctx.request(`/api/recipes/${recipe.recipeId}/share-card`, { cookie })
    expect(recipeCardResponse.status).toBe(200)
    const recipeCard = await readJson<{ target_type: string; recipe?: { title: string } }>(recipeCardResponse)
    expect(recipeCard).toEqual(
      expect.objectContaining({
        target_type: 'recipe',
        recipe: expect.objectContaining({ title: '糖醋里脊' }),
      }),
    )

    const achievementCreate = await ctx.request('/api/achievements/share', {
      method: 'POST',
      cookie,
      json: { shareType: 'card', channel: 'wechat' },
    })
    expect(achievementCreate.status).toBe(201)
    const achievementShare = await readJson<{ token: string }>(achievementCreate)

    const achievementPublic = await ctx.request(`/api/shares/${achievementShare.token}`)
    expect(achievementPublic.status).toBe(200)
    const achievementPayload = await readJson<{
      target_type: string
      achievements?: { rank: number; total_orders: number }
    }>(achievementPublic)
    expect(achievementPayload.target_type).toBe('achievements')
    expect(achievementPayload.achievements?.rank).toBeGreaterThanOrEqual(1)
    expect(achievementPayload.achievements?.total_orders).toBeGreaterThanOrEqual(1)

    const menuCreate = await ctx.request('/api/home/share', {
      method: 'POST',
      cookie,
      json: { shareType: 'link', channel: 'copy_link' },
    })
    expect(menuCreate.status).toBe(201)
    const menuShare = await readJson<{ token: string }>(menuCreate)

    const menuPublic = await ctx.request(`/api/shares/${menuShare.token}`)
    expect(menuPublic.status).toBe(200)
    const menuPayload = await readJson<{
      target_type: string
      daily_menu?: { menu_items: Array<{ title: string }> }
    }>(menuPublic)
    expect(menuPayload.target_type).toBe('daily_menu')
    expect(menuPayload.daily_menu?.menu_items.length).toBeGreaterThan(0)
  })
})
