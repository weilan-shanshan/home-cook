import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import { aiUsage } from '../db/schema.js'
import { authMiddleware, type AuthUser } from '../middleware/auth.js'
import { env } from '../lib/env.js'
import { chatComplete, BailianError } from '../lib/bailian.js'

type AuthEnv = {
  Variables: {
    user: AuthUser
    familyId: number
  }
}

const aiRouter = new Hono<AuthEnv>()
aiRouter.use('*', authMiddleware)

function currentYearMonth(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

async function readUsage(familyId: number): Promise<number> {
  const ym = currentYearMonth()
  const [row] = await db
    .select({ count: aiUsage.count })
    .from(aiUsage)
    .where(and(eq(aiUsage.familyId, familyId), eq(aiUsage.yearMonth, ym)))
    .limit(1)
  return row?.count ?? 0
}

async function incrementUsage(familyId: number): Promise<number> {
  const ym = currentYearMonth()
  // Upsert with increment
  sqlite
    .prepare(
      `INSERT INTO ai_usage (family_id, year_month, count, updated_at)
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(family_id, year_month)
       DO UPDATE SET count = count + 1, updated_at = datetime('now')`,
    )
    .run(familyId, ym)
  return readUsage(familyId)
}

// Quota status — used by the frontend to show "remaining N calls this month".
aiRouter.get('/quota', async (c) => {
  const familyId = c.get('familyId')
  const used = await readUsage(familyId)
  return c.json({
    monthly_quota: env.AI_MONTHLY_QUOTA,
    used,
    remaining: Math.max(0, env.AI_MONTHLY_QUOTA - used),
    year_month: currentYearMonth(),
    available: env.BAILIAN_API_KEY ? true : false,
  })
})

const wishSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
})

interface RecipeForAi {
  id: number
  title: string
  description: string | null
  tags: string[]
  cook_minutes: number | null
  is_favorite: boolean
  order_count: number
}

// Build the corpus of dishes available to the recommender.
// We include all family recipes plus signals (favorited, recent order count).
function loadFamilyCorpus(familyId: number, userId: number): RecipeForAi[] {
  const rows = sqlite
    .prepare(
      `SELECT
         r.id, r.title, r.description, r.cook_minutes,
         (SELECT COUNT(*) FROM favorites WHERE user_id = ? AND recipe_id = r.id) AS is_favorite,
         (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE oi.recipe_id = r.id AND o.family_id = ?) AS order_count
       FROM recipes r
       WHERE r.family_id = ?
       ORDER BY order_count DESC, r.id DESC
       LIMIT 80`,
    )
    .all(userId, familyId, familyId) as Array<{
    id: number
    title: string
    description: string | null
    cook_minutes: number | null
    is_favorite: number
    order_count: number
  }>

  const recipeIds = rows.map((r) => r.id)
  const tagRows = recipeIds.length
    ? (sqlite
        .prepare(
          `SELECT rt.recipe_id, t.name FROM recipe_tags rt
           JOIN tags t ON t.id = rt.tag_id
           WHERE rt.recipe_id IN (${recipeIds.map(() => '?').join(',')})`,
        )
        .all(...recipeIds) as Array<{ recipe_id: number; name: string }>)
    : []
  const tagsByRecipe = new Map<number, string[]>()
  for (const t of tagRows) {
    const list = tagsByRecipe.get(t.recipe_id) ?? []
    list.push(t.name)
    tagsByRecipe.set(t.recipe_id, list)
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    tags: tagsByRecipe.get(r.id) ?? [],
    cook_minutes: r.cook_minutes,
    is_favorite: !!r.is_favorite,
    order_count: r.order_count,
  }))
}

interface AiRecommendation {
  recipe_id: number
  title: string
  reason: string
}

aiRouter.post('/wish-recommend', async (c) => {
  const familyId = c.get('familyId')
  const user = c.get('user')

  const used = await readUsage(familyId)
  if (used >= env.AI_MONTHLY_QUOTA) {
    return c.json(
      {
        error: 'AI_QUOTA_EXCEEDED',
        message: `本月 ${env.AI_MONTHLY_QUOTA} 次 AI 推荐已用完`,
        used,
        monthly_quota: env.AI_MONTHLY_QUOTA,
      },
      429,
    )
  }

  if (!env.BAILIAN_API_KEY) {
    return c.json(
      { error: 'AI_UNAVAILABLE', message: 'AI 服务未配置，联系管理员' },
      503,
    )
  }

  const body = await c.req.json().catch(() => ({}))
  const parsed = wishSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const corpus = loadFamilyCorpus(familyId, user.id)
  if (corpus.length === 0) {
    return c.json(
      { error: 'NO_RECIPES', message: '本家还没菜谱，先去菜单加几道再来问 AI' },
      400,
    )
  }

  const corpusText = corpus
    .map((r) => {
      const labels = [
        r.is_favorite ? '收藏' : '',
        r.order_count > 0 ? `常点(${r.order_count})` : '',
        ...r.tags,
      ]
        .filter(Boolean)
        .join(' / ')
      const timing = r.cook_minutes ? ` ⏱${r.cook_minutes}min` : ''
      const desc = r.description ? ` - ${r.description.slice(0, 40)}` : ''
      return `#${r.id} ${r.title}${timing}${labels ? ` [${labels}]` : ''}${desc}`
    })
    .join('\n')

  const systemPrompt = `你是家庭餐桌的私厨助手。下面是这个家庭已有的菜谱（每行：#id 菜名 ⏱时长 [标签/信号]）：

${corpusText}

你的任务：根据用户的诉求，从上面这些菜里挑 3-5 道推荐。
- 优先选「收藏」「常点」、和用户诉求最契合的；
- 给出推荐理由（一句话，30 字以内，要具体、口语化）；
- 必须只从上面菜单 id 里选，不要编造新菜。

只返回 JSON，结构：
{"recommendations":[{"recipe_id":数字, "title":"菜名", "reason":"理由"}], "intro":"开头一句话"}`

  let result
  try {
    result = await chatComplete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: parsed.data.prompt },
      ],
      responseFormat: 'json_object',
      temperature: 0.5,
    })
  } catch (err) {
    if (err instanceof BailianError) {
      return c.json({ error: 'AI_REQUEST_FAILED', message: err.message }, 502)
    }
    throw err
  }

  // Parse / validate the model output. Drop any items that reference unknown
  // recipe ids (LLM hallucination guard).
  let parsedOutput: { recommendations?: AiRecommendation[]; intro?: string }
  try {
    parsedOutput = JSON.parse(result.content)
  } catch {
    return c.json(
      { error: 'AI_PARSE_FAILED', message: 'AI 返回格式异常，请重试' },
      502,
    )
  }
  const knownIds = new Set(corpus.map((r) => r.id))
  const recommendations = (parsedOutput.recommendations ?? [])
    .filter((r) => knownIds.has(r.recipe_id))
    .slice(0, 5)

  if (recommendations.length === 0) {
    return c.json(
      { error: 'AI_EMPTY', message: 'AI 没找到合适的菜，换种说法再试试' },
      502,
    )
  }

  // Only count successful, non-empty calls against the quota.
  const newUsed = await incrementUsage(familyId)

  // Enrich each recommendation with image + tags
  const enriched = recommendations.map((rec) => {
    const corpusRow = corpus.find((c) => c.id === rec.recipe_id)
    const firstImage = sqlite
      .prepare(
        `SELECT url, thumb_url FROM recipe_images WHERE recipe_id = ? ORDER BY sort_order LIMIT 1`,
      )
      .get(rec.recipe_id) as { url: string; thumb_url: string | null } | undefined
    return {
      recipe_id: rec.recipe_id,
      title: corpusRow?.title ?? rec.title,
      reason: rec.reason,
      tags: corpusRow?.tags ?? [],
      cook_minutes: corpusRow?.cook_minutes ?? null,
      first_image: firstImage
        ? { url: firstImage.url, thumb_url: firstImage.thumb_url }
        : null,
    }
  })

  return c.json({
    intro: parsedOutput.intro ?? '',
    recommendations: enriched,
    quota: {
      monthly_quota: env.AI_MONTHLY_QUOTA,
      used: newUsed,
      remaining: Math.max(0, env.AI_MONTHLY_QUOTA - newUsed),
    },
  })
})

// quota helpers reference avoidance — keep referenced
void sql

export { aiRouter }
