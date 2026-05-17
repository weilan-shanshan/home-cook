import { Utensils, ChefHat } from 'lucide-react'

interface Props {
  totalOrders: number
  totalCooks: number
}

export function AchievementStats({ totalOrders, totalCooks }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-sage-100 rounded-3xl p-4">
        <div className="bg-white/60 w-8 h-8 rounded-full flex items-center justify-center mb-2">
          <Utensils className="h-4 w-4 text-sage-700" />
        </div>
        <p className="text-2xl font-extrabold text-sage-700">{totalOrders}</p>
        <p className="text-xs font-semibold text-ink-700 mt-0.5">总点餐数</p>
      </div>
      <div className="bg-amber-100 rounded-3xl p-4">
        <div className="bg-white/60 w-8 h-8 rounded-full flex items-center justify-center mb-2">
          <ChefHat className="h-4 w-4 text-amber-500" />
        </div>
        <p className="text-2xl font-extrabold text-amber-500">{totalCooks}</p>
        <p className="text-xs font-semibold text-ink-700 mt-0.5">被掌勺数</p>
      </div>
    </div>
  )
}
