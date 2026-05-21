import { cn } from '@/lib/utils'

type Tone = 'cream' | 'sage' | 'mustard' | 'blush' | 'sky' | 'butter'

type Props = {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: Tone
  className?: string
}

const toneClass: Record<Tone, string> = {
  cream:   'bg-white/55 border-white/55 text-ink-900',
  sage:    'bg-brand-100/65 border-brand-200/60 text-brand-700',
  mustard: 'bg-honey-100/70 border-honey-300/55 text-honey-700',
  blush:   'bg-blush-100/65 border-blush-300/55 text-blush-700',
  sky:     'bg-sky-100/70 border-sky-300/55 text-sky-700',
  butter:  'bg-butter-100/65 border-butter-300/55 text-butter-700',
}

export function StatTile({ label, value, hint, tone = 'cream', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-4 flex flex-col justify-between min-h-[112px] backdrop-blur-xl shadow-card transition-shadow hover:shadow-elevated',
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
