import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

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

export function useAchievementsSummary() {
  return useQuery<AchievementSummary>({
    queryKey: ['achievements-summary'],
    queryFn: async () => {
      const response = await apiFetch('/api/achievements/summary')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
  })
}

export interface AchievementDish {
  recipe_id: number
  title: string
  score: number
  first_image: { url: string; thumbUrl: string | null } | null
}

export interface AchievementDishesRes {
  orders: AchievementDish[]
  cooks: AchievementDish[]
}

export function useAchievementDishes(enabled: boolean) {
  return useQuery<AchievementDishesRes>({
    queryKey: ['achievements-dishes'],
    enabled,
    queryFn: async () => {
      const response = await apiFetch('/api/achievements/dishes')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
  })
}
