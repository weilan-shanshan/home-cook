import { cn } from '@/lib/utils'

interface IngredientStepProps {
  index: number
  text: string
  className?: string
}

export function IngredientStep({ index, text, className }: IngredientStepProps) {
  return (
    <div className={cn('flex gap-3 items-start', className)}>
      <div className="flex-none w-7 h-7 rounded-full bg-brand text-white font-bold flex items-center justify-center text-xs">
        {index}
      </div>
      <p className="text-sm text-ink-700 leading-relaxed flex-1 pt-0.5 whitespace-pre-line">
        {text}
      </p>
    </div>
  )
}
