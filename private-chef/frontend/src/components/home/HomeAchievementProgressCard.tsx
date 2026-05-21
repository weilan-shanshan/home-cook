import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AchievementSummary } from '@/hooks/useHomeSummary'

type Props = { summary: AchievementSummary }

function nextMilestone(n: number): number {
  const steps = [10, 50, 100, 200, 500]
  for (const s of steps) {
    if (n < s) return s
  }
  return Math.ceil((n + 1) / 100) * 100
}

interface AchievementRow {
  id: string
  icon: string
  name: string
  value: number
  max: number
  hint: string
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 rounded-full bg-cream-200 overflow-hidden flex-1">
      <div
        className="h-full rounded-full bg-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function HomeAchievementProgressCard({ summary }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const orderMilestone = nextMilestone(summary.totalOrders)
  const cookMilestone = nextMilestone(summary.totalCooks)

  const achievements: AchievementRow[] = [
    {
      id: 'orders',
      icon: '🍳',
      name: '想吃达人',
      value: summary.totalOrders,
      max: orderMilestone,
      hint: '累计想吃',
    },
    {
      id: 'cooks',
      icon: '👨‍🍳',
      name: '家庭掌勺',
      value: summary.totalCooks,
      max: cookMilestone,
      hint: '累计掌勺',
    },
  ]

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="surface-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-4">
        <h2 className="font-serif text-lg text-ink-900">成就</h2>
        <Link to="/achievements" aria-label="查看全部">
            <button type="button" className="w-7 h-7 rounded-full surface-card flex items-center justify-center text-ink-500 hover:text-ink-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
      </div>

      {/* Achievement rows */}
      <div className="divide-y divide-cream-100">
        {achievements.map((ach) => {
          const isExpanded = expandedIds.has(ach.id)
          return (
            <div key={ach.id}>
              {/* Row */}
              <button
                type="button"
                className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-cream-50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(ach.id)}
              >
                <div className="w-8 h-8 rounded-full bg-honey-100 flex items-center justify-center text-base shrink-0">
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-ink-900">{ach.name}</span>
                    <span className="text-[11px] text-ink-500 shrink-0">
                      {ach.value}
                      <span className="text-ink-300"> / {ach.max}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={ach.value} max={ach.max} />
                  </div>
                  <div className="mt-1 text-[10px] text-ink-400">
                    {ach.hint} · 解锁奖励 🎁
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="px-5 pb-4 bg-cream-50">
                  <p className="text-[11px] text-ink-400 mb-3">相关菜品</p>
                  {/* TODO(data): per-achievement dish list not yet available from /api/achievements/summary.
                      Need a dedicated endpoint or extend the summary to return recipe references. */}
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-full aspect-square rounded-xl bg-cream-200 animate-pulse" />
                        <div className="h-2 w-10 rounded bg-cream-200 animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/achievements`}
                    className="mt-3 inline-block text-[11px] text-brand"
                  >
                    查看全部 →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
