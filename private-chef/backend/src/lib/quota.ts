import { sqlite } from '../db/index.js'

export const PLAN_LIMITS = {
  free: { recipes: 30, images: 60 },
  unlimited: { recipes: null, images: null },
} as const

export type Plan = keyof typeof PLAN_LIMITS
export type QuotaResource = 'recipes' | 'images'

export class QuotaExceededError extends Error {
  constructor(
    public resource: QuotaResource,
    public used: number,
    public limit: number,
  ) {
    super(`quota_exceeded:${resource}`)
    this.name = 'QuotaExceededError'
  }
}

export function getFamilyPlan(familyId: number): Plan {
  const row = sqlite
    .prepare('SELECT plan FROM families WHERE id = ?')
    .get(familyId) as { plan: string } | undefined
  if (!row) {
    // 不存在的家庭按 free 兜底（实际不会发生 —— auth middleware 已保证）
    return 'free'
  }
  return row.plan === 'unlimited' ? 'unlimited' : 'free'
}

function countRecipes(familyId: number): number {
  const row = sqlite
    .prepare('SELECT COUNT(*) AS c FROM recipes WHERE family_id = ?')
    .get(familyId) as { c: number }
  return row.c
}

function countImages(familyId: number): number {
  const row = sqlite
    .prepare(
      `SELECT COUNT(*) AS c FROM recipe_images ri
       INNER JOIN recipes r ON ri.recipe_id = r.id
       WHERE r.family_id = ?`,
    )
    .get(familyId) as { c: number }
  return row.c
}

export type QuotaUsage = {
  plan: Plan
  recipes: { used: number; limit: number | null }
  images: { used: number; limit: number | null }
}

export function getQuotaUsage(familyId: number): QuotaUsage {
  const plan = getFamilyPlan(familyId)
  const limits = PLAN_LIMITS[plan]
  return {
    plan,
    recipes: { used: countRecipes(familyId), limit: limits.recipes },
    images: { used: countImages(familyId), limit: limits.images },
  }
}

export function assertCanCreateRecipe(familyId: number): void {
  const plan = getFamilyPlan(familyId)
  const limit = PLAN_LIMITS[plan].recipes
  if (limit === null) return
  const used = countRecipes(familyId)
  if (used >= limit) {
    throw new QuotaExceededError('recipes', used, limit)
  }
}

export function assertCanUploadImage(familyId: number): void {
  const plan = getFamilyPlan(familyId)
  const limit = PLAN_LIMITS[plan].images
  if (limit === null) return
  const used = countImages(familyId)
  if (used >= limit) {
    throw new QuotaExceededError('images', used, limit)
  }
}
