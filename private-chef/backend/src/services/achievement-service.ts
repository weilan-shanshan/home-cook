import { sqlite } from '../db/index.js'

export type AchievementStats = {
  orderCount: number
  cookCount: number
  reviewCount: number
  commentCount: number
  likeCount: number
  favoriteCount: number
  shareCount: number
}

export type AchievementSummary = {
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
    stats: AchievementStats
  }
}

export type AchievementLeaderboardEntry = {
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
}

export type AchievementLeaderboard = {
  leaderboard: AchievementLeaderboardEntry[]
}

type FamilyAchievementRow = {
  userId: number
  displayName: string
  role: string
  orderCount: number
  cookCount: number
  reviewCount: number
  commentCount: number
  likeCount: number
  favoriteCount: number
  shareCount: number
}

type FamilyAchievementTotalsRow = {
  memberCount: number | null
  totalOrders: number | null
  totalCooks: number | null
  totalReviews: number | null
  totalComments: number | null
  totalLikes: number | null
  totalFavorites: number | null
  totalShares: number | null
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0)
}

export function calculateAchievementScore(stats: AchievementStats) {
  return stats.orderCount + stats.cookCount
}

function mapStats(row: FamilyAchievementRow): AchievementStats {
  return {
    orderCount: toNumber(row.orderCount),
    cookCount: toNumber(row.cookCount),
    reviewCount: toNumber(row.reviewCount),
    commentCount: toNumber(row.commentCount),
    likeCount: toNumber(row.likeCount),
    favoriteCount: toNumber(row.favoriteCount),
    shareCount: toNumber(row.shareCount),
  }
}

function getFamilyAchievementRows(familyId: number): FamilyAchievementRow[] {
  return sqlite
    .prepare(
      `
        WITH member_base AS (
          SELECT
            u.id AS userId,
            u.display_name AS displayName,
            u.role AS role,
            fm.joined_at AS joinedAt
          FROM family_members fm
          INNER JOIN users u
            ON u.id = fm.user_id
          WHERE fm.family_id = ?
        )
        SELECT
          mb.userId AS userId,
          mb.displayName AS displayName,
          mb.role AS role,
          COALESCE(ordered.orderCount, 0) AS orderCount,
          COALESCE(cooked.cookCount, 0) AS cookCount,
          COALESCE(reviewed.reviewCount, 0) AS reviewCount,
          COALESCE(commented.commentCount, 0) AS commentCount,
          COALESCE(liked.likeCount, 0) AS likeCount,
          COALESCE(favorited.favoriteCount, 0) AS favoriteCount,
          COALESCE(shared.shareCount, 0) AS shareCount
        FROM member_base mb
        LEFT JOIN (
          SELECT user_id AS userId, COUNT(*) AS orderCount
          FROM orders
          WHERE family_id = ?
          GROUP BY user_id
        ) AS ordered
          ON ordered.userId = mb.userId
        LEFT JOIN (
          SELECT cook_user_id AS userId, COUNT(*) AS cookCount
          FROM orders
          WHERE family_id = ?
            AND cook_user_id IS NOT NULL
          GROUP BY cook_user_id
        ) AS cooked
          ON cooked.userId = mb.userId
        LEFT JOIN (
          SELECT r.user_id AS userId, COUNT(*) AS reviewCount
          FROM order_reviews r
          INNER JOIN orders o
            ON o.id = r.order_id
          WHERE o.family_id = ?
          GROUP BY r.user_id
        ) AS reviewed
          ON reviewed.userId = mb.userId
        LEFT JOIN (
          SELECT oc.user_id AS userId, COUNT(*) AS commentCount
          FROM order_comments oc
          INNER JOIN orders o
            ON o.id = oc.order_id
          WHERE o.family_id = ?
          GROUP BY oc.user_id
        ) AS commented
          ON commented.userId = mb.userId
        LEFT JOIN (
          SELECT ol.user_id AS userId, COUNT(*) AS likeCount
          FROM order_likes ol
          INNER JOIN orders o
            ON o.id = ol.order_id
          WHERE o.family_id = ?
          GROUP BY ol.user_id
        ) AS liked
          ON liked.userId = mb.userId
        LEFT JOIN (
          SELECT f.user_id AS userId, COUNT(*) AS favoriteCount
          FROM favorites f
          INNER JOIN recipes r
            ON r.id = f.recipe_id
          WHERE r.family_id = ?
          GROUP BY f.user_id
        ) AS favorited
          ON favorited.userId = mb.userId
        LEFT JOIN (
          SELECT os.user_id AS userId, COUNT(*) AS shareCount
          FROM order_shares os
          INNER JOIN orders o
            ON o.id = os.order_id
          WHERE o.family_id = ?
          GROUP BY os.user_id
        ) AS shared
          ON shared.userId = mb.userId
        ORDER BY mb.joinedAt ASC, mb.userId ASC
      `,
    )
    .all(
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
    ) as FamilyAchievementRow[]
}

function getFamilyAchievementTotals(familyId: number) {
  const row = sqlite
    .prepare(
      `
        SELECT
          (SELECT COUNT(*) FROM family_members WHERE family_id = ?) AS memberCount,
          (SELECT COUNT(*) FROM orders WHERE family_id = ?) AS totalOrders,
          (SELECT COUNT(*) FROM orders WHERE family_id = ? AND cook_user_id IS NOT NULL) AS totalCooks,
          (
            SELECT COUNT(*)
            FROM order_reviews r
            INNER JOIN orders o
              ON o.id = r.order_id
            WHERE o.family_id = ?
          ) AS totalReviews,
          (
            SELECT COUNT(*)
            FROM order_comments oc
            INNER JOIN orders o
              ON o.id = oc.order_id
            WHERE o.family_id = ?
          ) AS totalComments,
          (
            SELECT COUNT(*)
            FROM order_likes ol
            INNER JOIN orders o
              ON o.id = ol.order_id
            WHERE o.family_id = ?
          ) AS totalLikes,
          (
            SELECT COUNT(*)
            FROM favorites f
            INNER JOIN recipes r
              ON r.id = f.recipe_id
            WHERE r.family_id = ?
          ) AS totalFavorites,
          (
            SELECT COUNT(*)
            FROM order_shares os
            INNER JOIN orders o
              ON o.id = os.order_id
            WHERE o.family_id = ?
          ) AS totalShares
      `,
    )
    .get(
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
      familyId,
    ) as FamilyAchievementTotalsRow

  return {
    memberCount: toNumber(row.memberCount),
    totalOrders: toNumber(row.totalOrders),
    totalCooks: toNumber(row.totalCooks),
    totalReviews: toNumber(row.totalReviews),
    totalComments: toNumber(row.totalComments),
    totalLikes: toNumber(row.totalLikes),
    totalFavorites: toNumber(row.totalFavorites),
    totalShares: toNumber(row.totalShares),
  }
}

function buildAchievementLeaderboard(familyId: number): AchievementLeaderboardEntry[] {
  const rows = getFamilyAchievementRows(familyId)

  return rows
    .map((row) => {
      const stats = mapStats(row)
      return {
        userId: row.userId,
        displayName: row.displayName,
        role: row.role,
        score: calculateAchievementScore(stats),
        stats,
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      if (right.stats.cookCount !== left.stats.cookCount) {
        return right.stats.cookCount - left.stats.cookCount
      }
      if (right.stats.orderCount !== left.stats.orderCount) {
        return right.stats.orderCount - left.stats.orderCount
      }
      if (right.stats.commentCount !== left.stats.commentCount) {
        return right.stats.commentCount - left.stats.commentCount
      }
      return left.userId - right.userId
    })
    .map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      displayName: entry.displayName,
      role: entry.role,
      score: entry.score,
      orderCount: entry.stats.orderCount,
      cookCount: entry.stats.cookCount,
      reviewCount: entry.stats.reviewCount,
      commentCount: entry.stats.commentCount,
      likeCount: entry.stats.likeCount,
      favoriteCount: entry.stats.favoriteCount,
      shareCount: entry.stats.shareCount,
    }))
}

export async function getAchievementSummary(
  familyId: number,
  userId: number,
): Promise<AchievementSummary> {
  const [familyTotals, leaderboard] = await Promise.all([
    Promise.resolve(getFamilyAchievementTotals(familyId)),
    Promise.resolve(buildAchievementLeaderboard(familyId)),
  ])

  const me = leaderboard.find((entry) => entry.userId === userId)

  return {
    family: {
      memberCount: familyTotals.memberCount,
      activeMembers: leaderboard.filter((entry) => entry.score > 0).length,
      totalOrders: familyTotals.totalOrders,
      totalCooks: familyTotals.totalCooks,
      totalReviews: familyTotals.totalReviews,
      totalComments: familyTotals.totalComments,
      totalLikes: familyTotals.totalLikes,
      totalFavorites: familyTotals.totalFavorites,
      totalShares: familyTotals.totalShares,
    },
    me: me
      ? {
          userId: me.userId,
          displayName: me.displayName,
          role: me.role,
          rank: me.rank,
          score: me.score,
          stats: {
            orderCount: me.orderCount,
            cookCount: me.cookCount,
            reviewCount: me.reviewCount,
            commentCount: me.commentCount,
            likeCount: me.likeCount,
            favoriteCount: me.favoriteCount,
            shareCount: me.shareCount,
          },
        }
      : {
          userId,
          displayName: '',
          role: 'member',
          rank: leaderboard.length + 1,
          score: 0,
          stats: {
            orderCount: 0,
            cookCount: 0,
            reviewCount: 0,
            commentCount: 0,
            likeCount: 0,
            favoriteCount: 0,
            shareCount: 0,
          },
        },
  }
}

export async function getAchievementLeaderboard(
  familyId: number,
): Promise<AchievementLeaderboard> {
  return {
    leaderboard: buildAchievementLeaderboard(familyId),
  }
}
