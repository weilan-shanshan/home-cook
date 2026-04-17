import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export type RecipeCardSummary = {
  recipeId: number
  title: string
  orderCount: number
  image: {
    url: string
    thumbUrl: string | null
  } | null
}

export type RecentOrderSummary = {
  id: number
  mealType: string
  mealDate: string
  status: string
  createdAt: string
  requester: {
    userId: number
    displayName: string
  }
  recipeTitles: string[]
}

export type RecentCommentSummary = {
  id: number
  orderId: number
  userId: number
  displayName: string
  roleType: 'diner' | 'cook'
  contentPreview: string
  createdAt: string
}

export type AchievementSummary = {
  totalOrders: number
  totalCooks: number
}

export type HomeSummary = {
  recommendedRecipes: RecipeCardSummary[]
  frequentRecipes: RecipeCardSummary[]
  recentOrders: RecentOrderSummary[]
  recentComments: RecentCommentSummary[]
  achievementSummary: AchievementSummary
}

export function useHomeSummary() {
  return useQuery({
    queryKey: ['home-summary'],
    queryFn: async () => {
      const res = await apiFetch('/api/home/summary')
      if (!res.ok) {
        throw new Error('Network response was not ok')
      }
      return res.json() as Promise<HomeSummary>
    }
  })
}
