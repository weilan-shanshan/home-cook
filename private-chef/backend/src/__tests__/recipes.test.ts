import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext, readJson } from './helpers.js'

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop()
    if (cleanup) await cleanup()
  }
})

describe.sequential('DELETE /api/recipes/:id', () => {
  test('returns 409 with referencingOrders when recipe is in any order', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'delete-admin',
      displayName: '删除管理员',
      inviteCode: 'DEL001',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '被引用菜',
    })

    const orderResult = ctx.sqlite
      .prepare(
        `INSERT INTO orders (family_id, user_id, meal_type, meal_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(family.familyId, family.userId, 'lunch', '2026-05-10', 'completed', '2026-05-10 12:00:00')
    const orderId = Number(orderResult.lastInsertRowid)
    ctx.sqlite
      .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
      .run(orderId, recipe.recipeId, 1)

    const response = await ctx.request(`/api/recipes/${recipe.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(409)

    const body = await readJson<{
      error: string
      message: string
      referencingOrders: Array<{ id: number; meal_date: string; meal_type: string; status: string }>
      referencingOrderCount: number
    }>(response)
    expect(body.error).toBe('RECIPE_REFERENCED_BY_ORDERS')
    expect(body.referencingOrderCount).toBe(1)
    expect(body.referencingOrders).toHaveLength(1)
    expect(body.referencingOrders[0].id).toBe(orderId)
    expect(body.referencingOrders[0].meal_date).toBe('2026-05-10')
  })

  test('returns 200 and cascades when recipe has no order references', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'unreferenced-admin',
      displayName: '无引用管理员',
      inviteCode: 'DEL002',
    })
    const recipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '可删菜',
    })

    const response = await ctx.request(`/api/recipes/${recipe.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(200)

    const rows = ctx.sqlite
      .prepare('SELECT id FROM recipes WHERE id = ?')
      .all(recipe.recipeId)
    expect(rows).toHaveLength(0)
  })

  test('returns 404 when recipe does not exist', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'notfound-admin',
      displayName: '404',
      inviteCode: 'DEL003',
    })

    const response = await ctx.request('/api/recipes/999999', {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(family.userId),
    })
    expect(response.status).toBe(404)
  })

  test('returns 404 when recipe belongs to another family (cross-family guard)', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const familyA = await ctx.seedFamily({
      username: 'family-a',
      displayName: '家庭 A',
      inviteCode: 'DEL004',
    })
    const familyB = await ctx.seedFamily({
      username: 'family-b',
      displayName: '家庭 B',
      inviteCode: 'DEL005',
    })
    const recipeB = ctx.seedRecipe({
      familyId: familyB.familyId,
      createdBy: familyB.userId,
      title: 'B 家的菜',
    })

    const response = await ctx.request(`/api/recipes/${recipeB.recipeId}`, {
      method: 'DELETE',
      cookie: ctx.createSessionCookie(familyA.userId),
    })
    expect(response.status).toBe(404)
  })
})
