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

function ProgressBar({
  value,
  max,
  label,
  hint,
}: {
  value: number
  max: number
  label: string
  hint?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1.5">
        <span className="text-ink-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {hint && <span className="text-ink-400 text-[11px]">{hint}</span>}
          <span className="text-ink-500 font-medium">
            {value}
            <span className="text-ink-400 font-normal"> / {max}</span>
          </span>
        </div>
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
    <button
      type="button"
      className="surface-card p-5 w-full text-left cursor-pointer hover:shadow-sm transition-shadow"
      onClick={() => navigate('/achievements')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-ink-900">成就进度</h2>
        <span className="text-xs text-brand">全部 →</span>
      </div>

      {/* Progress bars — 2-col on wider space */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgressBar
          value={summary.totalOrders}
          max={orderMilestone}
          label="累计点单"
          hint={`下一里程碑: ${orderMilestone} 单`}
        />
        <ProgressBar
          value={summary.totalCooks}
          max={cookMilestone}
          label="累计掌勺"
          hint={`下一里程碑: ${cookMilestone} 次`}
        />
      </div>
    </button>
  )
}
