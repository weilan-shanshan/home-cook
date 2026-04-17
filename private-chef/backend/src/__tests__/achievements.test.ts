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
    cookUserId?: number | null
    mealType: string
    mealDate: string
    status?: string
    createdAt: string
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
      input.status ?? 'submitted',
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
  input: { orderId: number; userId: number; roleType: string; content: string; createdAt: string },
) {
  ctx.sqlite
    .prepare(
      `INSERT INTO order_comments (order_id, user_id, role_type, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.orderId, input.userId, input.roleType, input.content, input.createdAt)
}

function seedReview(
  ctx: TestContext,
  input: {
    orderId: number
    userId: number
    score: number
    tasteScore: number
    portionScore: number
    overallNote?: string
    createdAt: string
  },
) {
  ctx.sqlite
    .prepare(
      `INSERT INTO order_reviews (order_id, user_id, score, taste_score, portion_score, overall_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.orderId,
      input.userId,
      input.score,
      input.tasteScore,
      input.portionScore,
      input.overallNote ?? null,
      input.createdAt,
    )
}

function seedLike(ctx: TestContext, input: { orderId: number; userId: number; createdAt: string }) {
  ctx.sqlite
    .prepare('INSERT INTO order_likes (order_id, user_id, created_at) VALUES (?, ?, ?)')
    .run(input.orderId, input.userId, input.createdAt)
}

function seedFavorite(ctx: TestContext, input: { userId: number; recipeId: number; createdAt: string }) {
  ctx.sqlite
    .prepare('INSERT INTO favorites (user_id, recipe_id, created_at) VALUES (?, ?, ?)')
    .run(input.userId, input.recipeId, input.createdAt)
}

function seedShare(
  ctx: TestContext,
  input: { orderId: number; userId: number; shareType: string; channel: string; createdAt: string },
) {
  ctx.sqlite
    .prepare(
      `INSERT INTO order_shares (order_id, user_id, share_type, channel, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.orderId, input.userId, input.shareType, input.channel, input.createdAt)
}

describe.sequential('achievements api', () => {
  test('returns summary and leaderboard for T20 consumption with stable ordering', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'achievement-admin',
      displayName: '成就管理员',
    })
    const cook = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'achievement-cook',
      displayName: '成就主厨',
    })
    const member = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'achievement-member',
      displayName: '成就达人',
    })

    const recipeOne = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '红烧肉',
    })
    const recipeTwo = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '清蒸鱼',
    })
    const recipeThree = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '番茄炒蛋',
    })

    const orderOne = seedOrder(ctx, {
      familyId: family.familyId,
      userId: family.userId,
      cookUserId: cook.userId,
      mealType: 'dinner',
      mealDate: '2026-04-18',
      createdAt: '2026-04-18 18:00:00',
      items: [{ recipeId: recipeOne.recipeId, quantity: 1 }],
    })
    const orderTwo = seedOrder(ctx, {
      familyId: family.familyId,
      userId: member.userId,
      cookUserId: cook.userId,
      mealType: 'lunch',
      mealDate: '2026-04-17',
      createdAt: '2026-04-17 12:00:00',
      items: [{ recipeId: recipeTwo.recipeId, quantity: 1 }],
    })
    const orderThree = seedOrder(ctx, {
      familyId: family.familyId,
      userId: cook.userId,
      cookUserId: family.userId,
      mealType: 'breakfast',
      mealDate: '2026-04-16',
      createdAt: '2026-04-16 08:00:00',
      items: [{ recipeId: recipeThree.recipeId, quantity: 1 }],
    })

    seedReview(ctx, {
      orderId: orderOne.orderId,
      userId: family.userId,
      score: 5,
      tasteScore: 5,
      portionScore: 4,
      overallNote: '很好吃',
      createdAt: '2026-04-18 18:10:00',
    })
    seedReview(ctx, {
      orderId: orderTwo.orderId,
      userId: member.userId,
      score: 4,
      tasteScore: 4,
      portionScore: 5,
      overallNote: '很满意',
      createdAt: '2026-04-17 12:10:00',
    })

    seedComment(ctx, {
      orderId: orderOne.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '这顿想早点开饭',
      createdAt: '2026-04-18 18:15:00',
    })
    seedComment(ctx, {
      orderId: orderTwo.orderId,
      userId: member.userId,
      roleType: 'requester',
      content: '记得少盐',
      createdAt: '2026-04-17 12:15:00',
    })
    seedComment(ctx, {
      orderId: orderThree.orderId,
      userId: member.userId,
      roleType: 'member',
      content: '明天还想再做一次',
      createdAt: '2026-04-16 08:15:00',
    })

    seedLike(ctx, { orderId: orderOne.orderId, userId: family.userId, createdAt: '2026-04-18 18:20:00' })
    seedLike(ctx, { orderId: orderOne.orderId, userId: member.userId, createdAt: '2026-04-18 18:21:00' })
    seedLike(ctx, { orderId: orderTwo.orderId, userId: member.userId, createdAt: '2026-04-17 12:20:00' })

    seedFavorite(ctx, { userId: family.userId, recipeId: recipeOne.recipeId, createdAt: '2026-04-18 18:30:00' })
    seedFavorite(ctx, { userId: member.userId, recipeId: recipeTwo.recipeId, createdAt: '2026-04-17 12:30:00' })
    seedFavorite(ctx, { userId: member.userId, recipeId: recipeThree.recipeId, createdAt: '2026-04-16 08:30:00' })

    seedShare(ctx, {
      orderId: orderOne.orderId,
      userId: cook.userId,
      shareType: 'card',
      channel: 'wechat',
      createdAt: '2026-04-18 18:40:00',
    })
    seedShare(ctx, {
      orderId: orderTwo.orderId,
      userId: member.userId,
      shareType: 'card',
      channel: 'wechat',
      createdAt: '2026-04-17 12:40:00',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const summaryResponse = await ctx.request('/api/achievements/summary', { cookie })
    const leaderboardResponse = await ctx.request('/api/achievements/leaderboard', { cookie })

    expect(summaryResponse.status).toBe(200)
    expect(leaderboardResponse.status).toBe(200)

    const summaryBody = await readJson<{
      family: {
        memberCount: number
        activeMembers: number
        totalOrders: number
        totalCooks: number
        totalReviews: number
        totalComments: number
        totalLikes: number
        totalFavorites: number
        totalShares: number
      }
      me: {
        userId: number
        displayName: string
        role: string
        rank: number
        score: number
        stats: {
          orderCount: number
          cookCount: number
          reviewCount: number
          commentCount: number
          likeCount: number
          favoriteCount: number
          shareCount: number
        }
      }
    }>(summaryResponse)

    const leaderboardBody = await readJson<{
      leaderboard: Array<{
        rank: number
        userId: number
        displayName: string
        role: string
        score: number
        orderCount: number
        cookCount: number
        reviewCount: number
        commentCount: number
        likeCount: number
        favoriteCount: number
        shareCount: number
      }>
    }>(leaderboardResponse)

    expect(summaryBody).toEqual({
      family: {
        memberCount: 3,
        activeMembers: 3,
        totalOrders: 3,
        totalCooks: 3,
        totalReviews: 2,
        totalComments: 3,
        totalLikes: 3,
        totalFavorites: 3,
        totalShares: 2,
      },
      me: {
        userId: family.userId,
        displayName: '成就管理员',
        role: 'admin',
        rank: 2,
        score: 2,
        stats: {
          orderCount: 1,
          cookCount: 1,
          reviewCount: 1,
          commentCount: 1,
          likeCount: 1,
          favoriteCount: 1,
          shareCount: 0,
        },
      },
    })

    expect(leaderboardBody.leaderboard).toEqual([
      {
        rank: 1,
        userId: cook.userId,
        displayName: '成就主厨',
        role: 'member',
        score: 3,
        orderCount: 1,
        cookCount: 2,
        reviewCount: 0,
        commentCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        shareCount: 1,
      },
      {
        rank: 2,
        userId: family.userId,
        displayName: '成就管理员',
        role: 'admin',
        score: 2,
        orderCount: 1,
        cookCount: 1,
        reviewCount: 1,
        commentCount: 1,
        likeCount: 1,
        favoriteCount: 1,
        shareCount: 0,
      },
      {
        rank: 3,
        userId: member.userId,
        displayName: '成就达人',
        role: 'member',
        score: 1,
        orderCount: 1,
        cookCount: 0,
        reviewCount: 1,
        commentCount: 2,
        likeCount: 2,
        favoriteCount: 2,
        shareCount: 1,
      },
    ])
  })

  test('keeps summary and leaderboard family-scoped', async () => {
    const ctx = await createTestContext()
    cleanups.push(ctx.cleanup)

    const family = await ctx.seedFamily({
      username: 'achievement-boundary-admin',
      displayName: '边界成就管理员',
    })
    const familyMember = await ctx.seedFamilyMember({
      familyId: family.familyId,
      username: 'achievement-boundary-member',
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
      createdAt: '2026-04-18 18:00:00',
      items: [{ recipeId: localRecipe.recipeId, quantity: 1 }],
    })

    seedComment(ctx, {
      orderId: localOrder.orderId,
      userId: family.userId,
      roleType: 'requester',
      content: '这是本家庭评论',
      createdAt: '2026-04-18 18:10:00',
    })
    seedLike(ctx, { orderId: localOrder.orderId, userId: family.userId, createdAt: '2026-04-18 18:20:00' })
    seedFavorite(ctx, { userId: family.userId, recipeId: localRecipe.recipeId, createdAt: '2026-04-18 18:30:00' })

    const otherFamily = await ctx.seedFamily({
      username: 'achievement-other-admin',
      displayName: '外家庭管理员',
      inviteCode: 'ACH002',
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
      createdAt: '2026-04-17 12:00:00',
      items: [{ recipeId: otherRecipe.recipeId, quantity: 1 }],
    })

    seedReview(ctx, {
      orderId: otherOrder.orderId,
      userId: family.userId,
      score: 5,
      tasteScore: 5,
      portionScore: 5,
      overallNote: '这条跨家庭评价不应计入',
      createdAt: '2026-04-17 12:10:00',
    })
    seedComment(ctx, {
      orderId: otherOrder.orderId,
      userId: family.userId,
      roleType: 'cook',
      content: '这条跨家庭评论不应计入',
      createdAt: '2026-04-17 12:11:00',
    })
    seedLike(ctx, { orderId: otherOrder.orderId, userId: family.userId, createdAt: '2026-04-17 12:12:00' })
    seedFavorite(ctx, { userId: family.userId, recipeId: otherRecipe.recipeId, createdAt: '2026-04-17 12:13:00' })
    seedShare(ctx, {
      orderId: otherOrder.orderId,
      userId: family.userId,
      shareType: 'card',
      channel: 'wechat',
      createdAt: '2026-04-17 12:14:00',
    })

    const cookie = ctx.createSessionCookie(family.userId)
    const summaryResponse = await ctx.request('/api/achievements/summary', { cookie })
    const leaderboardResponse = await ctx.request('/api/achievements/leaderboard', { cookie })

    expect(summaryResponse.status).toBe(200)
    expect(leaderboardResponse.status).toBe(200)

    const summaryBody = await readJson<{
      family: {
        memberCount: number
        activeMembers: number
        totalOrders: number
        totalCooks: number
        totalReviews: number
        totalComments: number
        totalLikes: number
        totalFavorites: number
        totalShares: number
      }
      me: {
        userId: number
        displayName: string
        rank: number
        score: number
        stats: {
          orderCount: number
          cookCount: number
          reviewCount: number
          commentCount: number
          likeCount: number
          favoriteCount: number
          shareCount: number
        }
      }
    }>(summaryResponse)

    const leaderboardBody = await readJson<{
      leaderboard: Array<{
        userId: number
        displayName: string
        score: number
        orderCount: number
        cookCount: number
        reviewCount: number
        commentCount: number
        likeCount: number
        favoriteCount: number
        shareCount: number
      }>
    }>(leaderboardResponse)

    expect(summaryBody.family).toEqual({
      memberCount: 2,
      activeMembers: 2,
      totalOrders: 1,
      totalCooks: 1,
      totalReviews: 0,
      totalComments: 1,
      totalLikes: 1,
      totalFavorites: 1,
      totalShares: 0,
    })
    expect(summaryBody.me).toEqual({
      userId: family.userId,
      displayName: '边界成就管理员',
      role: 'admin',
      rank: 2,
      score: 1,
      stats: {
        orderCount: 1,
        cookCount: 0,
        reviewCount: 0,
        commentCount: 1,
        likeCount: 1,
        favoriteCount: 1,
        shareCount: 0,
      },
    })

    expect(leaderboardBody.leaderboard).toEqual([
      expect.objectContaining({
        userId: familyMember.userId,
        displayName: '边界家人',
        score: 1,
        orderCount: 0,
        cookCount: 1,
        reviewCount: 0,
        commentCount: 0,
        likeCount: 0,
        favoriteCount: 0,
        shareCount: 0,
      }),
      expect.objectContaining({
        userId: family.userId,
        displayName: '边界成就管理员',
        score: 1,
        orderCount: 1,
        cookCount: 0,
        reviewCount: 0,
        commentCount: 1,
        likeCount: 1,
        favoriteCount: 1,
        shareCount: 0,
      }),
    ])
    expect(leaderboardBody.leaderboard.every((entry) => entry.displayName !== '外家庭管理员')).toBe(true)
  })
})
