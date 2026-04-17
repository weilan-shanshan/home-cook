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

describe.sequential('home summary api', () => {
  test('returns family-scoped summary payload with recent limits', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'home-admin',
      displayName: '首页管理员',
    })
    const familyMember = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'home-member',
      displayName: '首页家人',
    })

    const recipes = [
      ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: '红烧肉',
        imageUrl: 'https://example.com/hongshaorou.jpg',
        thumbUrl: 'https://example.com/hongshaorou-thumb.jpg',
      }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '清蒸鱼' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '番茄炒蛋' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '宫保鸡丁' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '炒时蔬' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '蒜蓉虾' }),
      ctx.seedRecipe({ familyId: family.familyId, createdBy: family.userId, title: '可乐鸡翅' }),
    ]

    const orderOne = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: familyMember.userId,
      mealType: 'dinner',
      mealDate: '2026-04-16',
      status: 'pending',
      createdAt: '2026-04-16 18:00:00',
      items: [
        { recipeId: recipes[0].recipeId, quantity: 2 },
        { recipeId: recipes[1].recipeId, quantity: 1 },
      ],
    })
    const orderTwo = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: familyMember.userId,
      mealType: 'lunch',
      mealDate: '2026-04-15',
      status: 'confirmed',
      createdAt: '2026-04-15 12:00:00',
      items: [
        { recipeId: recipes[0].recipeId, quantity: 1 },
        { recipeId: recipes[2].recipeId, quantity: 1 },
      ],
    })
    const orderThree = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      mealType: 'dinner',
      mealDate: '2026-04-14',
      status: 'preparing',
      createdAt: '2026-04-14 19:00:00',
      items: [{ recipeId: recipes[3].recipeId, quantity: 1 }],
    })
    const orderFour = seedOrder(ctx, {
      familyId: family.familyId,
      userId: familyMember.userId,
      mealType: 'lunch',
      mealDate: '2026-04-13',
      status: 'completed',
      createdAt: '2026-04-13 12:00:00',
      items: [{ recipeId: recipes[0].recipeId, quantity: 1 }],
    })
    const orderFive = seedOrder(ctx, {
      familyId: family.familyId,
      userId: familyMember.userId,
      mealType: 'breakfast',
      mealDate: '2026-04-12',
      status: 'submitted',
      createdAt: '2026-04-12 08:00:00',
      items: [{ recipeId: recipes[4].recipeId, quantity: 1 }],
    })
    const orderSix = seedOrder(ctx, {
      familyId: family.familyId,
      userId: familyMember.userId,
      mealType: 'snack',
      mealDate: '2026-04-11',
      status: 'cancelled',
      createdAt: '2026-04-11 16:00:00',
      items: [{ recipeId: recipes[5].recipeId, quantity: 1 }],
    })

    seedComment(ctx, {
      orderId: orderOne.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '这次红烧肉看起来特别香。',
      createdAt: '2026-04-16 18:10:00',
    })
    seedComment(ctx, {
      orderId: orderTwo.orderId,
      userId: familyMember.userId,
      roleType: 'cook',
      content: '鱼已经开始准备了，稍后出锅。',
      createdAt: '2026-04-15 12:10:00',
    })
    seedComment(ctx, {
      orderId: orderThree.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '宫保鸡丁记得少放一点辣椒。',
      createdAt: '2026-04-14 19:10:00',
    })
    seedComment(ctx, {
      orderId: orderFour.orderId,
      userId: familyMember.userId,
      roleType: 'cook',
      content: '今天的番茄炒蛋做得很成功，颜色也很好看。',
      createdAt: '2026-04-13 12:10:00',
    })

    const otherFamily = await ctx.seedFamily({
      username: 'other-home-admin',
      displayName: '别家管理员',
      inviteCode: 'HOM002',
    })
    const otherRecipe = ctx.seedRecipe({
      familyId: otherFamily.familyId,
      createdBy: otherFamily.userId,
      title: '外家庭秘制排骨',
    })
    const otherOrder = seedOrder(ctx, {
      familyId: otherFamily.familyId,
      userId: otherFamily.userId,
      mealType: 'dinner',
      mealDate: '2026-04-17',
      status: 'submitted',
      createdAt: '2026-04-17 19:00:00',
      items: [{ recipeId: otherRecipe.recipeId, quantity: 1 }],
    })
    seedComment(ctx, {
      orderId: otherOrder.orderId,
      userId: otherFamily.userId,
      roleType: 'requester',
      content: '这条评论不应该出现在当前家庭首页摘要里。',
      createdAt: '2026-04-17 19:10:00',
    })

    const response = await ctx.request('/api/home/summary', {
      cookie: ctx.createSessionCookie(family.userId),
    })

    expect(response.status).toBe(200)

    const body = await readJson<{
      recommendedRecipes: Array<{
        recipeId: number
        title: string
        orderCount: number
        image: { url: string; thumbUrl: string | null } | null
      }>
      frequentRecipes: Array<{
        recipeId: number
        title: string
        orderCount: number
        image: { url: string; thumbUrl: string | null } | null
      }>
      recentOrders: Array<{
        id: number
        mealType: string
        mealDate: string
        status: string
        createdAt: string
        requester: { userId: number; displayName: string }
        recipeTitles: string[]
      }>
      recentComments: Array<{
        id: number
        orderId: number
        userId: number
        displayName: string
        roleType: string
        contentPreview: string
        createdAt: string
      }>
      achievementSummary: {
        totalOrders: number
        totalCooks: number
      }
    }>(response)

    expect(body).toEqual(
      expect.objectContaining({
        recommendedRecipes: expect.any(Array),
        frequentRecipes: expect.any(Array),
        recentOrders: expect.any(Array),
        recentComments: expect.any(Array),
        achievementSummary: expect.objectContaining({
          totalOrders: 6,
          totalCooks: 2,
        }),
      }),
    )

    expect(body.recentOrders).toHaveLength(5)
    expect(body.recentComments).toHaveLength(3)
    expect(body.recentOrders.map((order) => order.id)).toContain(orderFive.orderId)
    expect(body.recentOrders.map((order) => order.id)).not.toContain(orderSix.orderId)

    expect(body.recentOrders[0]).toEqual(
      expect.objectContaining({
        id: orderOne.orderId,
        mealType: 'dinner',
        mealDate: '2026-04-16',
        status: 'submitted',
        requester: expect.objectContaining({
          userId: family.userId,
          displayName: '首页管理员',
        }),
        recipeTitles: expect.arrayContaining(['红烧肉', '清蒸鱼']),
      }),
    )

    expect(body.frequentRecipes[0]).toEqual(
      expect.objectContaining({
        recipeId: recipes[0].recipeId,
        title: '红烧肉',
        orderCount: 3,
        image: {
          url: 'https://example.com/hongshaorou.jpg',
          thumbUrl: 'https://example.com/hongshaorou-thumb.jpg',
        },
      }),
    )
    expect(body.recommendedRecipes.every((recipe) => recipe.recipeId !== otherRecipe.recipeId)).toBe(true)
    expect(body.frequentRecipes.every((recipe) => recipe.recipeId !== otherRecipe.recipeId)).toBe(true)
    expect(body.recentOrders.every((order) => order.id !== otherOrder.orderId)).toBe(true)
    expect(body.recentComments.every((comment) => comment.displayName !== '别家管理员')).toBe(true)
    expect(body.recentComments[0]).toEqual(
      expect.objectContaining({
        orderId: orderOne.orderId,
        displayName: '首页管理员',
        roleType: 'requester',
        contentPreview: '这次红烧肉看起来特别香。',
      }),
    )
  })
})
