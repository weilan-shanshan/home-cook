import { useNavigate } from 'react-router'
import type { AchievementSummary } from '@/hooks/useHomeSummary'

type Props = { summary: AchievementSummary }

function nextMilestone(n: number): number {
  const steps = [10, 50, 100, 200, 500]
  for (const s of steps) {
    if (n < s) return s
  }
  return Math.ceil((n + 1) / 100) * 100
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-ink-700 font-medium">{label}</span>
        <span className="text-ink-400">{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function HomeAchievementProgressCard({ summary }: Props) {
  const navigate = useNavigate()
  const orderMilestone = nextMilestone(summary.totalOrders)
  const cookMilestone = nextMilestone(summary.totalCooks)

  return (
    <button
      type="button"
      className="surface-card p-4 w-full text-left cursor-pointer hover:shadow-sm transition-shadow h-full flex flex-col"
      onClick={() => navigate('/achievements')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-base text-ink-900">成就</h2>
        <span className="text-xs text-brand">全部 →</span>
      </div>

      {/* Progress bars */}
      <div className="space-y-2.5 flex-1">
        <ProgressBar value={summary.totalOrders} max={orderMilestone} label="点单" />
        <ProgressBar value={summary.totalCooks} max={cookMilestone} label="掌勺" />
      </div>
    </button>
  )
}
