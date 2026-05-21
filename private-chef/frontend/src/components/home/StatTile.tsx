import { cn } from '@/lib/utils'

type Tone = 'cream' | 'sage' | 'mustard'

type Props = {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: Tone
  className?: string
}

const toneClass: Record<Tone, string> = {
  cream: 'bg-cream-100 border-cream-200 text-ink-900',
  sage: 'bg-sage-200 border-sage-200 text-sage-700',
  mustard: 'bg-mustard-300/70 border-mustard-300 text-ink-900',
}

export function StatTile({ label, value, hint, tone = 'cream', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-4 flex flex-col justify-between min-h-[112px]',
        toneClass[tone],
        className,
      )}
    >
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      {hint && <div className="text-[11px] text-ink-500">{hint}</div>}
    </div>
  )
}
