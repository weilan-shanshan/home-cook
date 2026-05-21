import { useNavigate } from 'react-router'
import type { AchievementSummary } from '@/hooks/useHomeSummary'

type Props = { summary: AchievementSummary }

function nextMilestone(n: number): number {
  const steps = [10, 50, 100, 200, 500]
  for (const s of steps) {
    if (n < s) return s
  }
  // Round up to next 100
  return Math.ceil((n + 1) / 100) * 100
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-ink-700 font-medium">{label}</span>
        <span className="text-ink-500">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-cream-200 overflow-hidden">
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
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">成就进度</h2>
        <button
          type="button"
          onClick={() => navigate('/achievements')}
          className="text-xs text-brand"
        >
          全部 →
        </button>
      </div>
      <button
        type="button"
        className="surface-card p-4 w-full text-left cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => navigate('/achievements')}
      >
        <div className="space-y-3">
          <ProgressBar value={summary.totalOrders} max={orderMilestone} label="累计点单" />
          <ProgressBar value={summary.totalCooks} max={cookMilestone} label="累计掌勺" />
        </div>
      </button>
    </section>
  )
}
