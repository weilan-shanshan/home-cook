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

async function setupFreeFamily() {
  const ctx = await createTestContext({ stubWechat: true })
  cleanups.push(ctx.cleanup)
  const family = await ctx.seedFamily({
    username: 'chef',
    displayName: '主厨',
  })
  // Migration 0006 already added plan='free' as default for new inserts.
  return { ctx, family }
}

function upgradeToUnlimited(ctx: TestContext, familyId: number) {
  ctx.sqlite
    .prepare('UPDATE families SET plan = ? WHERE id = ?')
    .run('unlimited', familyId)
}

describe.sequential('quota: family plan defaults', () => {
  test('newly seeded family defaults to plan=free', async () => {
    const { ctx, family } = await setupFreeFamily()
    const row = ctx.sqlite
      .prepare('SELECT plan FROM families WHERE id = ?')
      .get(family.familyId) as { plan: string }
    expect(row.plan).toBe('free')
  })
})

describe.sequential('GET /api/quota', () => {
  test('returns free plan with zero usage and limits', async () => {
    const { ctx, family } = await setupFreeFamily()
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/quota', { cookie })
    expect(res.status).toBe(200)
    const body = await readJson<{
      plan: string
      recipes: { used: number; limit: number | null }
      images: { used: number; limit: number | null }
    }>(res)
    expect(body).toEqual({
      plan: 'free',
      recipes: { used: 0, limit: 30 },
      images: { used: 0, limit: 60 },
    })
  })

  test('reflects existing recipes and images count', async () => {
    const { ctx, family } = await setupFreeFamily()
    ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '番茄炒蛋',
      imageUrl: 'https://example.com/a.jpg',
    })
    ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '红烧肉',
    })
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/quota', { cookie })
    const body = await readJson<{ recipes: { used: number }; images: { used: number } }>(res)
    expect(body.recipes.used).toBe(2)
    expect(body.images.used).toBe(1)
  })

  test('unlimited plan reports null limits', async () => {
    const { ctx, family } = await setupFreeFamily()
    upgradeToUnlimited(ctx, family.familyId)
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/quota', { cookie })
    const body = await readJson<{ plan: string; recipes: { limit: number | null } }>(res)
    expect(body.plan).toBe('unlimited')
    expect(body.recipes.limit).toBeNull()
  })
})

describe.sequential('POST /api/recipes quota enforcement', () => {
  test('free family at 30 recipes gets 409 quota_exceeded', async () => {
    const { ctx, family } = await setupFreeFamily()
    // Seed 30 recipes directly.
    for (let i = 0; i < 30; i++) {
      ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: `菜${i}`,
      })
    }
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/recipes', {
      method: 'POST',
      cookie,
      json: { title: '第31道', steps: ['step1'] },
    })
    expect(res.status).toBe(409)
    const body = await readJson<{ error: string; resource: string; used: number; limit: number }>(res)
    expect(body.error).toBe('quota_exceeded')
    expect(body.resource).toBe('recipes')
    expect(body.used).toBe(30)
    expect(body.limit).toBe(30)
  })

  test('unlimited family can create beyond 30', async () => {
    const { ctx, family } = await setupFreeFamily()
    upgradeToUnlimited(ctx, family.familyId)
    for (let i = 0; i < 30; i++) {
      ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: `菜${i}`,
      })
    }
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/recipes', {
      method: 'POST',
      cookie,
      json: { title: '第31道', steps: ['step1'] },
    })
    expect(res.status).toBe(201)
  })

  test('deleting a recipe frees the quota', async () => {
    const { ctx, family } = await setupFreeFamily()
    const ids: number[] = []
    for (let i = 0; i < 30; i++) {
      const { recipeId } = ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: `菜${i}`,
      })
      ids.push(recipeId)
    }
    // Hard-delete one to free up a slot.
    ctx.sqlite.prepare('DELETE FROM recipes WHERE id = ?').run(ids[0])
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request('/api/recipes', {
      method: 'POST',
      cookie,
      json: { title: '替补菜', steps: ['step1'] },
    })
    expect(res.status).toBe(201)
  })
})

describe.sequential('POST recipe-image quota enforcement', () => {
  test('free family at 60 images gets 409 quota_exceeded', async () => {
    const { ctx, family } = await setupFreeFamily()
    const { recipeId } = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '相册菜',
    })
    // Seed 60 images directly on this recipe.
    const insert = ctx.sqlite.prepare(
      'INSERT INTO recipe_images (recipe_id, url, sort_order) VALUES (?, ?, ?)',
    )
    for (let i = 0; i < 60; i++) {
      insert.run(recipeId, `https://example.com/${i}.jpg`, i)
    }
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request(`/api/recipes/${recipeId}/images`, {
      method: 'POST',
      cookie,
      json: { url: 'https://example.com/overflow.jpg' },
    })
    expect(res.status).toBe(409)
    const body = await readJson<{ error: string; resource: string }>(res)
    expect(body.error).toBe('quota_exceeded')
    expect(body.resource).toBe('images')
  })

  test('image count is cross-recipe within the family', async () => {
    const { ctx, family } = await setupFreeFamily()
    // 30 recipes × 2 images each = 60 → next upload should be blocked.
    const insertImg = ctx.sqlite.prepare(
      'INSERT INTO recipe_images (recipe_id, url, sort_order) VALUES (?, ?, ?)',
    )
    let lastRecipeId = 0
    for (let r = 0; r < 30; r++) {
      const { recipeId } = ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: `菜${r}`,
      })
      lastRecipeId = recipeId
      insertImg.run(recipeId, `https://example.com/${r}-a.jpg`, 0)
      insertImg.run(recipeId, `https://example.com/${r}-b.jpg`, 1)
    }
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request(`/api/recipes/${lastRecipeId}/images`, {
      method: 'POST',
      cookie,
      json: { url: 'https://example.com/61.jpg' },
    })
    expect(res.status).toBe(409)
  })

  test('unlimited family can upload beyond 60', async () => {
    const { ctx, family } = await setupFreeFamily()
    upgradeToUnlimited(ctx, family.familyId)
    const { recipeId } = ctx.seedRecipe({
      familyId: family.familyId,
      createdBy: family.userId,
      title: '相册菜',
    })
    const insert = ctx.sqlite.prepare(
      'INSERT INTO recipe_images (recipe_id, url, sort_order) VALUES (?, ?, ?)',
    )
    for (let i = 0; i < 60; i++) {
      insert.run(recipeId, `https://example.com/${i}.jpg`, i)
    }
    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request(`/api/recipes/${recipeId}/images`, {
      method: 'POST',
      cookie,
      json: { url: 'https://example.com/61.jpg' },
    })
    expect(res.status).toBe(201)
  })
})

describe.sequential('POST /api/square/recipes/:id/clone quota enforcement', () => {
  test('clone is blocked when quota is full', async () => {
    const { ctx, family } = await setupFreeFamily()
    // Seed 30 recipes in caller family.
    for (let i = 0; i < 30; i++) {
      ctx.seedRecipe({
        familyId: family.familyId,
        createdBy: family.userId,
        title: `菜${i}`,
      })
    }
    // Seed another family with a public recipe.
    const other = await ctx.seedFamily({
      username: 'chef2',
      displayName: '主厨2',
      inviteCode: 'CHEF002',
    })
    const { recipeId: publicRecipeId } = ctx.seedRecipe({
      familyId: other.familyId,
      createdBy: other.userId,
      title: '公共菜',
    })
    ctx.sqlite
      .prepare('UPDATE recipes SET is_public = 1 WHERE id = ?')
      .run(publicRecipeId)

    const cookie = ctx.createSessionCookie(family.userId)
    const res = await ctx.request(`/api/square/recipes/${publicRecipeId}/clone`, {
      method: 'POST',
      cookie,
    })
    expect(res.status).toBe(409)
    const body = await readJson<{ error: string; resource: string }>(res)
    expect(body.error).toBe('quota_exceeded')
    expect(body.resource).toBe('recipes')
  })
})
