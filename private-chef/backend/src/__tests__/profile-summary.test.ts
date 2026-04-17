import { afterEach, describe, expect, test } from 'vitest'
import { createTestContext, readJson, type TestContext } from './helpers.js'

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
  ctx: TestContext,
  input: {
    familyId: number
    userId: number
    mealType: string
    mealDate: string
    status: string
    createdAt: string
    cookUserId?: number | null
    items: Array<{ recipeId: number; quantity: number }>
  },
) {
  const orderResult = ctx.sqlite
    .prepare(
      `INSERT INTO orders (family_id, user_id, cook_user_id, meal_type, meal_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.familyId,
      input.userId,
      input.cookUserId ?? null,
      input.mealType,
      input.mealDate,
      input.status,
      input.createdAt,
    )

  const orderId = Number(orderResult.lastInsertRowid)

  ctx.sqlite
    .prepare(
      'INSERT INTO order_status_events (order_id, from_status, to_status, operator_id, note) VALUES (?, ?, ?, ?, ?)',
    )
    .run(orderId, null, input.status, input.userId, 'Seeded order')

  for (const item of input.items) {
    ctx.sqlite
      .prepare('INSERT INTO order_items (order_id, recipe_id, quantity) VALUES (?, ?, ?)')
      .run(orderId, item.recipeId, item.quantity)
  }

  return { orderId }
}

function seedComment(
  ctx: TestContext,
  input: {
    orderId: number
    userId: number
    roleType: string
    content: string
    createdAt: string
  },
) {
  const result = ctx.sqlite
    .prepare(
      `INSERT INTO order_comments (order_id, user_id, role_type, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.orderId,
      input.userId,
      input.roleType,
      input.content,
      input.createdAt,
    )

  return { commentId: Number(result.lastInsertRowid) }
}

function seedFavorite(ctx: TestContext, input: { userId: number; recipeId: number }) {
  ctx.sqlite
    .prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)')
    .run(input.userId, input.recipeId)
}

describe.sequential('profile summary api', () => {
  test('returns profile summary payload for ProfileV2 consumption', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'profile-admin',
      displayName: '个人页管理员',
    })
    const familyCook = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'profile-cook',
      displayName: '家庭主厨',
    })

    const recipes = [
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '红烧肉' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '清蒸鱼' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '番茄炒蛋' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '青椒土豆丝' }),
    ]

    const orderedOne = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: familyCook.userId,
      mealType: 'dinner',
      mealDate: '2026-04-18',
      status: 'submitted',
      createdAt: '2026-04-18 18:00:00',
      items: [
        { recipeId: recipes[0].recipeId, quantity: 1 },
        { recipeId: recipes[1].recipeId, quantity: 1 },
      ],
    })
    const orderedTwo = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: familyCook.userId,
      mealType: 'lunch',
      mealDate: '2026-04-17',
      status: 'completed',
      createdAt: '2026-04-17 12:00:00',
      items: [{ recipeId: recipes[2].recipeId, quantity: 1 }],
    })
    const orderedThree = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      mealType: 'breakfast',
      mealDate: '2026-04-16',
      status: 'preparing',
      createdAt: '2026-04-16 08:00:00',
      items: [{ recipeId: recipes[3].recipeId, quantity: 1 }],
    })
    const cookedOne = seedOrder(ctx, {
      familyId: family.familyId,
      userId: familyCook.userId,
      cookUserId: family.userId,
      mealType: 'dinner',
      mealDate: '2026-04-15',
      status: 'confirmed',
      createdAt: '2026-04-15 19:00:00',
      items: [{ recipeId: recipes[1].recipeId, quantity: 1 }],
    })

    seedComment(ctx, {
      orderId: orderedOne.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '今天想早点吃饭。',
      createdAt: '2026-04-18 18:05:00',
    })
    seedComment(ctx, {
      orderId: cookedOne.orderId,
      userId: family.userId,
      roleType: 'cook',
      content: '已经开始处理食材了。',
      createdAt: '2026-04-15 19:05:00',
    })

    seedFavorite(ctx, { userId: family.userId, recipeId: recipes[0].recipeId })
    seedFavorite(ctx, { userId: family.userId, recipeId: recipes[2].recipeId })

    const response = await ctx.request('/api/profile/summary', {
      cookie: ctx.createSessionCookie(family.userId),
    })

    expect(response.status).toBe(200)

    const body = await readJson<{
      family: {
        id: number
        name: string
        inviteCode: string
      }
      myOrderStats: { total: number; pending: number; completed: number }
      myFavoritesCount: number
      myCommentsCount: number
      orderedByMe: Array<{
        id: number
        mealType: string
        mealDate: string
        status: string
        createdAt: string
        requester: { userId: number; displayName: string }
        recipeTitles: string[]
      }>
      cookedByMe: Array<{
        id: number
        mealType: string
        mealDate: string
        status: string
        createdAt: string
        requester: { userId: number; displayName: string }
        recipeTitles: string[]
      }>
      familyMembers: Array<{
        userId: number
        displayName: string
        role: string
        joinedAt: string
      }>
    }>(response)

    expect(body).toEqual(
      expect.objectContaining({
        family: expect.objectContaining({
          id: family.familyId,
        }),
        myOrderStats: {
          total: 3,
          pending: 2,
          completed: 1,
        },
        myFavoritesCount: 2,
        myCommentsCount: 2,
        orderedByMe: expect.any(Array),
        cookedByMe: expect.any(Array),
        familyMembers: expect.any(Array),
      }),
    )

    expect(body.orderedByMe).toHaveLength(3)
    expect(body.orderedByMe[0]).toEqual(
      expect.objectContaining({
        id: orderedOne.orderId,
        mealType: 'dinner',
        mealDate: '2026-04-18',
        status: 'submitted',
        requester: {
          userId: family.userId,
          displayName: '个人页管理员',
        },
        recipeTitles: ['红烧肉', '清蒸鱼'],
      }),
    )
    expect(body.cookedByMe).toEqual([
      expect.objectContaining({
        id: cookedOne.orderId,
        mealType: 'dinner',
        status: 'confirmed',
        requester: {
          userId: familyCook.userId,
          displayName: '家庭主厨',
        },
        recipeTitles: ['清蒸鱼'],
      }),
    ])
    expect(body.familyMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: family.userId,
          displayName: '个人页管理员',
          role: 'admin',
        }),
        expect.objectContaining({
          userId: familyCook.userId,
          displayName: '家庭主厨',
          role: 'member',
        }),
      ]),
    )

    expect(body.orderedByMe.map((order) => order.id)).toEqual([
      orderedOne.orderId,
      orderedTwo.orderId,
      orderedThree.orderId,
    ])
  })

  test('keeps profile summary family-scoped for counts, lists, and members', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'profile-boundary-admin',
      displayName: '边界管理员',
    })
    const familyMember = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'profile-boundary-member',
      displayName: '边界家人',
    })

    const localRecipe = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '家常豆腐',
    })
    const localOrder = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: familyMember.userId,
      mealType: 'dinner',
      mealDate: '2026-04-18',
      status: 'submitted',
      createdAt: '2026-04-18 18:00:00',
      items: [{ recipeId: localRecipe.recipeId, quantity: 1 }],
    })

    seedFavorite(ctx, { userId: family.userId, recipeId: localRecipe.recipeId })
    seedComment(ctx, {
      orderId: localOrder.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '这是本家庭评论。',
      createdAt: '2026-04-18 18:10:00',
    })

    const otherFamily = await ctx.seedFamily({
      username: 'profile-other-admin',
      displayName: '外家庭管理员',
      inviteCode: 'PRO002',
    })
    const otherRecipe = ctx.seedRecipe({
      familyId: otherFamily.familyId,
      createdBy: otherFamily.userId,
      title: '外家庭排骨',
    })
    const otherOrder = seedOrder(ctx, {
      familyId: otherFamily.familyId,
      userId: family.userId,
      cookUserId: family.userId,
      mealType: 'lunch',
      mealDate: '2026-04-17',
      status: 'completed',
      createdAt: '2026-04-17 12:00:00',
      items: [{ recipeId: otherRecipe.recipeId, quantity: 1 }],
    })

    seedFavorite(ctx, { userId: family.userId, recipeId: otherRecipe.recipeId })
    seedComment(ctx, {
      orderId: otherOrder.orderId,
      userId: family.userId,
      roleType: 'cook',
      content: '这条跨家庭评论不该被统计。',
      createdAt: '2026-04-17 12:10:00',
    })

    const response = await ctx.request('/api/profile/summary', {
      cookie: ctx.createSessionCookie(family.userId),
    })

    expect(response.status).toBe(200)

    const body = await readJson<{
      family: { id: number; name: string; inviteCode: string }
      myOrderStats: { total: number; pending: number; completed: number }
      myFavoritesCount: number
      myCommentsCount: number
      orderedByMe: Array<{ id: number }>
      cookedByMe: Array<{ id: number }>
      familyMembers: Array<{ userId: number; displayName: string }>
    }>(response)

    expect(body.family).toEqual({
      id: family.familyId,
      name: '边界管理员的家庭',
      inviteCode: 'PRO001',
    })
    expect(body.myOrderStats).toEqual({
      total: 1,
      pending: 1,
      completed: 0,
    })
    expect(body.myFavoritesCount).toBe(1)
    expect(body.myCommentsCount).toBe(1)
    expect(body.orderedByMe.map((order) => order.id)).toEqual([localOrder.orderId])
    expect(body.cookedByMe.map((order) => order.id)).not.toContain(otherOrder.orderId)
    expect(body.familyMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: family.userId, displayName: '边界管理员' }),
        expect.objectContaining({ userId: familyMember.userId, displayName: '边界家人' }),
      ]),
    )
    expect(body.familyMembers.every((member) => member.displayName !== '外家庭管理员')).toBe(true)
  })
})
