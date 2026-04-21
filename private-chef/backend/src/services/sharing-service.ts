import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db, sqlite } from '../db/index.js'
import {
  families,
  orderItems,
  orderLikes,
  orders,
  recipeImages,
  recipes,
  shares,
  users,
  type Share,
} from '../db/schema.js'
import { env } from '../lib/env.js'
import { resolveImageUrls } from '../lib/image-urls.js'
import { getAchievementLeaderboard, getAchievementSummary } from './achievement-service.js'
import { getHomeSummary } from './home-summary-service.js'

export const shareTargetTypes = ['order', 'recipe', 'achievements', 'daily_menu'] as const
export const shareChannels = ['copy_link', 'wechat', 'poster_download'] as const
export const shareTypes = ['link', 'card', 'poster'] as const

export type ShareTargetType = (typeof shareTargetTypes)[number]
export type ShareChannel = (typeof shareChannels)[number]
export type ShareType = (typeof shareTypes)[number]

type SharePreviewInput = {
  familyId: number
  userId: number
  targetType: ShareTargetType
  targetId: string
}

type ShareMetaInput = SharePreviewInput & {
  shareRecord: Share | null
}

type SharePage = {
  token: string
  url: string
}

export type ShareCardPayload = {
  target_type: ShareTargetType
  target_id: string
  title: string
  summary: string
  cover_image_url: string | null
  share_page: SharePage | null
  wechat: {
    title: string
    summary: string
    cover_url: string | null
  }
  poster: {
    title: string
    summary: string
    qr_target_url: string | null
    helper_text: string
  }
  visual: {
    hero_emphasis: 'order' | 'recipe' | 'achievements' | 'daily_menu'
    accent: 'amber' | 'tomato' | 'champagne' | 'sage'
    chips: string[]
  }
  public_context: {
    family_name: string | null
    requester_display_name?: string | null
    cook_display_name?: string | null
    featured_display_name?: string | null
    date_label?: string | null
  }
  facts: string[]
  order?: {
    id: number
    meal_type: string
    meal_date: string
    note: string | null
    status: string
    created_at: string
  }
  items?: Array<{
    id: number
    recipe_id: number
    quantity: number
    recipe_title: string
    image: { url: string; thumbUrl: string | null } | null
  }>
  like_count?: number
  recipe?: {
    id: number
    title: string
    description: string | null
    cook_minutes: number | null
    servings: number | null
    tags: string[]
  }
  achievements?: {
    rank: number
    score: number
    member_count: number
    total_orders: number
    total_shares: number
    highlight_lines: string[]
  }
  daily_menu?: {
    menu_items: Array<{
      recipe_id: number
      title: string
      image: { url: string; thumbUrl: string | null } | null
    }>
    reason_chips: string[]
  }
}

export type ShareActionResponse = {
  id: number
  user_id: number
  target_type: ShareTargetType
  target_id: string
  share_type: ShareType
  channel: ShareChannel
  token: string
  share_url: string
  created_at: string
  wechat: ShareCardPayload['wechat']
  poster: ShareCardPayload['poster']
}

function toDisplayDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.replace(/-/g, '.')
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`
}

function truncateText(value: string | null | undefined, fallback: string, maxLength: number) {
  const normalized = value?.trim() || fallback
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

function mealTypeLabel(mealType: string) {
  switch (mealType) {
    case 'breakfast':
      return '早餐'
    case 'lunch':
      return '午餐'
    case 'dinner':
      return '晚餐'
    case 'snack':
      return '加餐'
    default:
      return mealType
  }
}

function orderStatusLabel(status: string) {
  switch (status) {
    case 'pending':
    case 'submitted':
      return '待处理'
    case 'confirmed':
      return '已接单'
    case 'preparing':
      return '制作中'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

function buildShareUrl(token: string) {
  return `${env.FRONTEND_ORIGIN.replace(/\/$/, '')}/share/${token}`
}

async function getFamilyName(familyId: number) {
  const [family] = await db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  return family?.name ?? null
}

async function findLatestSharePage(targetType: ShareTargetType, targetId: string, familyId: number) {
  const [latestShare] = await db
    .select({ token: shares.token })
    .from(shares)
    .where(
      and(
        eq(shares.familyId, familyId),
        eq(shares.targetType, targetType),
        eq(shares.targetId, targetId),
      ),
    )
    .orderBy(desc(shares.id))
    .limit(1)

  if (!latestShare) {
    return null
  }

  return {
    token: latestShare.token,
    url: buildShareUrl(latestShare.token),
  }
}

async function findShareRecordByToken(token: string) {
  const [shareRecord] = await db
    .select()
    .from(shares)
    .where(eq(shares.token, token))
    .limit(1)

  return shareRecord ?? null
}

async function buildOrderSharePayload(input: ShareMetaInput): Promise<ShareCardPayload | null> {
  const orderId = Number(input.targetId)
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return null
  }

  const orderRow = sqlite
    .prepare(
      `SELECT
         o.id AS id,
         o.meal_type AS mealType,
         o.meal_date AS mealDate,
         o.note AS note,
         o.status AS status,
         o.created_at AS createdAt,
         requester.display_name AS requesterDisplayName,
         cook.display_name AS cookDisplayName
       FROM orders o
       INNER JOIN users requester ON requester.id = o.user_id
       LEFT JOIN users cook ON cook.id = o.cook_user_id
       WHERE o.id = ? AND o.family_id = ?`,
    )
    .get(orderId, input.familyId) as
    | {
        id: number
        mealType: string
        mealDate: string
        note: string | null
        status: string
        createdAt: string
        requesterDisplayName: string | null
        cookDisplayName: string | null
      }
    | undefined

  if (!orderRow) {
    return null
  }

  const itemRows = sqlite
    .prepare(
      `SELECT
         oi.id AS id,
         oi.recipe_id AS recipeId,
         oi.quantity AS quantity,
         r.title AS recipeTitle,
         ri.url AS imageUrl,
         ri.thumb_url AS thumbUrl
       FROM order_items oi
       INNER JOIN recipes r ON r.id = oi.recipe_id
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = 0
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
    )
    .all(orderId) as Array<{
    id: number
    recipeId: number
    quantity: number
    recipeTitle: string
    imageUrl: string | null
    thumbUrl: string | null
  }>

  const likeCountRow = sqlite
    .prepare('SELECT COUNT(*) AS count FROM order_likes WHERE order_id = ?')
    .get(orderId) as { count: number }

  const familyName = await getFamilyName(input.familyId)
  const items = await Promise.all(
    itemRows.map(async (item) => {
      const image = await resolveImageUrls(item.imageUrl, item.thumbUrl)
      return {
        id: item.id,
        recipe_id: item.recipeId,
        quantity: item.quantity,
        recipe_title: item.recipeTitle,
        image: image ? { url: image.url, thumbUrl: image.thumbUrl } : null,
      }
    }),
  )
  const heroImage = items.find((item) => item.image)?.image?.url ?? null
  const primaryDishNames = items.slice(0, 3).map((item) => item.recipe_title)
  const title = orderRow.requesterDisplayName
    ? `${orderRow.requesterDisplayName}点的${mealTypeLabel(orderRow.mealType)}`
    : `${mealTypeLabel(orderRow.mealType)} · ${primaryDishNames[0] ?? '家常好菜'}`
  const summaryParts = [familyName, orderRow.requesterDisplayName ? `${orderRow.requesterDisplayName}点单` : null]
  if (orderRow.cookDisplayName) {
    summaryParts.push(`${orderRow.cookDisplayName}掌勺`)
  }
  const summary = summaryParts.filter(Boolean).join(' · ') || '一顿值得分享的家常好饭'
  const sharePage = input.shareRecord
    ? { token: input.shareRecord.token, url: buildShareUrl(input.shareRecord.token) }
    : await findLatestSharePage('order', input.targetId, input.familyId)

  return {
    target_type: 'order',
    target_id: input.targetId,
    title: truncateText(title, '今晚这顿很值得分享', 22),
    summary: truncateText(summary, '一顿值得分享的家常好饭', 36),
    cover_image_url: heroImage,
    share_page: sharePage,
    wechat: {
      title: truncateText(title, '今晚这顿很值得分享', 22),
      summary: truncateText(summary, '一顿值得分享的家常好饭', 36),
      cover_url: heroImage,
    },
    poster: {
      title: truncateText(title, '今晚这顿很值得分享', 22),
      summary: primaryDishNames.join(' / ') || truncateText(summary, '一顿值得分享的家常好饭', 28),
      qr_target_url: sharePage?.url ?? null,
      helper_text: '扫码查看完整内容',
    },
    visual: {
      hero_emphasis: 'order',
      accent: 'amber',
      chips: [mealTypeLabel(orderRow.mealType), `${items.length}道菜`, orderStatusLabel(orderRow.status)],
    },
    public_context: {
      family_name: familyName,
      requester_display_name: orderRow.requesterDisplayName,
      cook_display_name: orderRow.cookDisplayName,
      date_label: toDisplayDate(orderRow.mealDate),
    },
    facts: items.slice(0, 4).map((item) => `${item.recipe_title} x${item.quantity}`),
    order: {
      id: orderRow.id,
      meal_type: orderRow.mealType,
      meal_date: orderRow.mealDate,
      note: orderRow.note,
      status: orderRow.status,
      created_at: orderRow.createdAt,
    },
    items,
    like_count: Number(likeCountRow.count),
  }
}

async function buildRecipeSharePayload(input: ShareMetaInput): Promise<ShareCardPayload | null> {
  const recipeId = Number(input.targetId)
  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return null
  }

  const recipeRow = sqlite
    .prepare(
      `SELECT
         r.id AS id,
         r.title AS title,
         r.description AS description,
         r.cook_minutes AS cookMinutes,
         r.servings AS servings,
         creator.display_name AS creatorDisplayName,
         ri.url AS imageUrl,
         ri.thumb_url AS thumbUrl
       FROM recipes r
       INNER JOIN users creator ON creator.id = r.created_by
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id AND ri.sort_order = 0
       WHERE r.id = ? AND r.family_id = ?`,
    )
    .get(recipeId, input.familyId) as
    | {
        id: number
        title: string
        description: string | null
        cookMinutes: number | null
        servings: number | null
        creatorDisplayName: string | null
        imageUrl: string | null
        thumbUrl: string | null
      }
    | undefined

  if (!recipeRow) {
    return null
  }

  const familyName = await getFamilyName(input.familyId)
  const tagRows = sqlite
    .prepare(
      `SELECT t.name AS name
       FROM recipe_tags rt
       INNER JOIN tags t ON t.id = rt.tag_id
       WHERE rt.recipe_id = ?
       ORDER BY t.id ASC`,
    )
    .all(recipeId) as Array<{ name: string }>
  const orderCountRow = sqlite
    .prepare(
      `SELECT COUNT(*) AS count
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.recipe_id = ? AND o.family_id = ?`,
    )
    .get(recipeId, input.familyId) as { count: number }
  const image = await resolveImageUrls(recipeRow.imageUrl, recipeRow.thumbUrl)
  const sharePage = input.shareRecord
    ? { token: input.shareRecord.token, url: buildShareUrl(input.shareRecord.token) }
    : await findLatestSharePage('recipe', input.targetId, input.familyId)

  const description = truncateText(recipeRow.description, '一道值得收藏的家常菜', 36)
  const tags = tagRows.map((tag) => tag.name).slice(0, 3)

  return {
    target_type: 'recipe',
    target_id: input.targetId,
    title: truncateText(recipeRow.title, '私厨灵感', 22),
    summary: truncateText(
      recipeRow.description
        ? `${recipeRow.description}${familyName ? ` · 来自${familyName}的私厨灵感` : ''}`
        : `${familyName ? `${familyName}私厨灵感` : '一道值得收藏的家常菜'}`,
      '一道值得收藏的家常菜',
      36,
    ),
    cover_image_url: image?.url ?? null,
    share_page: sharePage,
    wechat: {
      title: truncateText(recipeRow.title, '私厨灵感', 22),
      summary: description,
      cover_url: image?.url ?? null,
    },
    poster: {
      title: truncateText(recipeRow.title, '私厨灵感', 22),
      summary: description,
      qr_target_url: sharePage?.url ?? null,
      helper_text: '扫码查看做法与详情',
    },
    visual: {
      hero_emphasis: 'recipe',
      accent: 'tomato',
      chips: [
        ...tags,
        recipeRow.cookMinutes ? `${recipeRow.cookMinutes}分钟` : null,
        Number(orderCountRow.count) > 0 ? `点过${orderCountRow.count}次` : null,
      ].filter((value): value is string => Boolean(value)).slice(0, 4),
    },
    public_context: {
      family_name: familyName,
      featured_display_name: recipeRow.creatorDisplayName,
    },
    facts: [
      description,
      recipeRow.creatorDisplayName ? `${recipeRow.creatorDisplayName}推荐` : null,
      recipeRow.servings ? `${recipeRow.servings}人份` : null,
    ].filter((value): value is string => Boolean(value)),
    recipe: {
      id: recipeRow.id,
      title: recipeRow.title,
      description: recipeRow.description,
      cook_minutes: recipeRow.cookMinutes,
      servings: recipeRow.servings,
      tags,
    },
  }
}

async function buildAchievementsSharePayload(input: ShareMetaInput): Promise<ShareCardPayload | null> {
  const familyName = await getFamilyName(input.familyId)
  const [summary, leaderboard] = await Promise.all([
    getAchievementSummary(input.familyId, input.userId),
    getAchievementLeaderboard(input.familyId),
  ])

  const me = summary.me
  const highlights = leaderboard.leaderboard
    .slice(0, 3)
    .map((entry) => `#${entry.rank} ${entry.displayName} · ${entry.score}分`)
  const sharePage = input.shareRecord
    ? { token: input.shareRecord.token, url: buildShareUrl(input.shareRecord.token) }
    : await findLatestSharePage('achievements', input.targetId, input.familyId)
  const title = familyName ? `${familyName}本期厨房成就` : `${me.displayName}的家庭成就卡`

  return {
    target_type: 'achievements',
    target_id: input.targetId,
    title: truncateText(title, '家庭成就', 22),
    summary: truncateText('点餐、掌勺与互动热度，一页看完', '点餐、掌勺与互动热度，一页看完', 36),
    cover_image_url: null,
    share_page: sharePage,
    wechat: {
      title: truncateText(title, '家庭成就', 22),
      summary: '点餐、掌勺与互动热度，一页看完',
      cover_url: null,
    },
    poster: {
      title: truncateText(title, '家庭成就', 22),
      summary: `${me.displayName || '本期成员'} · 第${me.rank}名 · ${me.score}分`,
      qr_target_url: sharePage?.url ?? null,
      helper_text: '扫码查看完整榜单',
    },
    visual: {
      hero_emphasis: 'achievements',
      accent: 'champagne',
      chips: [`第${me.rank}名`, `${me.score}分`, `分享${me.stats.shareCount}`],
    },
    public_context: {
      family_name: familyName,
      featured_display_name: me.displayName,
    },
    facts: highlights,
    achievements: {
      rank: me.rank,
      score: me.score,
      member_count: summary.family.memberCount,
      total_orders: summary.family.totalOrders,
      total_shares: summary.family.totalShares,
      highlight_lines: highlights,
    },
  }
}

async function buildDailyMenuSharePayload(input: ShareMetaInput): Promise<ShareCardPayload | null> {
  const familyName = await getFamilyName(input.familyId)
  const homeSummary = await getHomeSummary(input.familyId, input.userId)
  const menuItems = homeSummary.recommendedRecipes.slice(0, 4).map((recipe) => ({
    recipe_id: recipe.recipeId,
    title: recipe.title,
    image: recipe.image,
  }))

  if (menuItems.length === 0) {
    return null
  }

  const sharePage = input.shareRecord
    ? { token: input.shareRecord.token, url: buildShareUrl(input.shareRecord.token) }
    : await findLatestSharePage('daily_menu', input.targetId, input.familyId)
  const title = familyName ? `${familyName}今日菜单` : '今天吃什么，已经替你想好了'
  const summary = menuItems.slice(0, 3).map((item) => item.title).join(' / ')

  return {
    target_type: 'daily_menu',
    target_id: input.targetId,
    title: truncateText(title, '今天吃什么，已经替你想好了', 22),
    summary: truncateText(summary, '几道刚刚好的搭配，今晚照着吃就行', 36),
    cover_image_url: menuItems.find((item) => item.image)?.image?.url ?? null,
    share_page: sharePage,
    wechat: {
      title: truncateText(title, '今天吃什么，已经替你想好了', 22),
      summary: truncateText(summary, '几道刚刚好的搭配，今晚照着吃就行', 36),
      cover_url: menuItems.find((item) => item.image)?.image?.url ?? null,
    },
    poster: {
      title: truncateText(title, '今天吃什么，已经替你想好了', 22),
      summary: truncateText(summary, '几道刚刚好的搭配，今晚照着吃就行', 28),
      qr_target_url: sharePage?.url ?? null,
      helper_text: '扫码查看完整菜单',
    },
    visual: {
      hero_emphasis: 'daily_menu',
      accent: 'sage',
      chips: ['均衡搭配', '适合晚餐', '家庭高频'],
    },
    public_context: {
      family_name: familyName,
      date_label: toDisplayDate(new Date().toISOString().slice(0, 10)),
    },
    facts: ['简单、稳妥、大家都愿意吃', `共${menuItems.length}道推荐`],
    daily_menu: {
      menu_items: menuItems,
      reason_chips: ['均衡搭配', '适合晚餐', '家庭高频'],
    },
  }
}

async function buildSharePayload(input: ShareMetaInput) {
  switch (input.targetType) {
    case 'order':
      return buildOrderSharePayload(input)
    case 'recipe':
      return buildRecipeSharePayload(input)
    case 'achievements':
      return buildAchievementsSharePayload(input)
    case 'daily_menu':
      return buildDailyMenuSharePayload(input)
    default:
      return null
  }
}

export function normalizeShareType(value: string): ShareType | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'url') {
    return 'link'
  }
  if (normalized === 'image') {
    return 'poster'
  }
  return shareTypes.includes(normalized as ShareType) ? (normalized as ShareType) : null
}

export function normalizeShareChannel(value: string): ShareChannel | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'web' || normalized === 'copy') {
    return 'copy_link'
  }
  if (normalized === 'poster' || normalized === 'download') {
    return 'poster_download'
  }
  return shareChannels.includes(normalized as ShareChannel)
    ? (normalized as ShareChannel)
    : null
}

export async function createShareResponse(input: SharePreviewInput & { shareType: ShareType; channel: ShareChannel }) {
  const token = randomUUID().replace(/-/g, '')
  const [created] = await db
    .insert(shares)
    .values({
      familyId: input.familyId,
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      shareType: input.shareType,
      channel: input.channel,
      token,
    })
    .returning()

  const payload = await buildSharePayload({ ...input, shareRecord: created })
  if (!payload) {
    return null
  }

  return {
    id: created.id,
    user_id: created.userId,
    target_type: created.targetType as ShareTargetType,
    target_id: created.targetId,
    share_type: created.shareType as ShareType,
    channel: created.channel as ShareChannel,
    token: created.token,
    share_url: buildShareUrl(created.token),
    created_at: created.createdAt,
    wechat: payload.wechat,
    poster: payload.poster,
  } satisfies ShareActionResponse
}

export async function getShareCardPreview(input: SharePreviewInput) {
  return buildSharePayload({ ...input, shareRecord: null })
}

export async function getPublicSharePayload(token: string) {
  const shareRecord = await findShareRecordByToken(token)
  if (!shareRecord) {
    return null
  }

  return buildSharePayload({
    familyId: shareRecord.familyId,
    userId: shareRecord.userId,
    targetType: shareRecord.targetType as ShareTargetType,
    targetId: shareRecord.targetId,
    shareRecord,
  })
}
