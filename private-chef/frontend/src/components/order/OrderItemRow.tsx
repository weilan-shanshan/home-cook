import { Utensils, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  item: {
    recipeId: number
    recipeTitle: string
    quantity: number
    image?: { thumbUrl: string | null; url: string } | null
    cookMinutes?: number | null
  }
  editable?: boolean
  onQuantityChange?: (delta: number) => void
}

export function OrderItemRow({ item, editable, onQuantityChange }: Props) {
  const thumb = item.image?.thumbUrl || item.image?.url

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-12 h-12 flex-none rounded-2xl bg-cream-100 overflow-hidden flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={item.recipeTitle} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="w-5 h-5 text-cream-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink-900 truncate">{item.recipeTitle}</p>
        {item.cookMinutes != null && (
          <p className="text-[10px] text-ink-500">{item.cookMinutes} 分钟</p>
        )}
      </div>
      {editable && onQuantityChange ? (
        <div className="flex items-center gap-2 flex-none">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(-1)}
            aria-label={`减少 ${item.recipeTitle}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onQuantityChange(1)}
            aria-label={`增加 ${item.recipeTitle}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <span className="text-sm font-bold text-brand flex-none">× {item.quantity}</span>
      )}
    </div>
  )
}
