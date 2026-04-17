import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

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

export function useAchievementsLeaderboard() {
  return useQuery<AchievementLeaderboard>({
    queryKey: ['achievements-leaderboard'],
    queryFn: async () => {
      const response = await apiFetch('/api/achievements/leaderboard')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    },
  })
}
