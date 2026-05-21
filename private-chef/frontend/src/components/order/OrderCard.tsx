import { useNavigate } from 'react-router'
import { OrderColorChips } from './OrderColorChips'
import { Button } from '@/components/ui/button'

export type OrderCardData = {
  id: string | number
  no: string
  meta: string
  agoLabel: string
  status: 'pending' | 'cooking' | 'done'
  items: { id: string | number; name?: string }[]
  primaryActionLabel?: string
  onPrimary?: () => void
  primaryDisabled?: boolean
}

const STATUS_CHIP: Record<OrderCardData['status'], { label: string; cls: string }> = {
  pending: { label: '等你接单', cls: 'bg-brand-100 text-brand-700' },
  cooking: { label: '制作中', cls: 'bg-mustard-100 text-mustard-700' },
  done: { label: '已完成', cls: 'bg-sage-100 text-sage-700' },
}

export function OrderCard(props: OrderCardData) {
  const navigate = useNavigate()
  const chip = STATUS_CHIP[props.status]
  const defaultLabel =
    props.status === 'pending'
      ? '我来接单'
      : props.status === 'cooking'
        ? '出锅完成 ✓'
        : '已完成'
  const label = props.primaryActionLabel ?? defaultLabel
  return (
    <article
      className="surface-card p-4 cursor-pointer"
      onClick={() => navigate(`/orders/${props.id}`)}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full text-xs px-2.5 py-1 ${chip.cls}`}>{chip.label}</span>
        <span className="text-xs text-ink-500">{props.agoLabel}</span>
      </div>
      <div className="mt-2 font-medium text-ink-900">{props.no}</div>
      <div className="text-xs text-ink-500 mb-3">{props.meta}</div>
      <OrderColorChips items={props.items} className="mb-4" />
      {props.status !== 'done' ? (
        <Button
          variant={props.status === 'pending' ? 'inverse' : 'default'}
          size="lg"
          className="w-full"
          disabled={props.primaryDisabled}
          onClick={(e) => {
            e.stopPropagation()
            props.onPrimary?.()
          }}
        >
          {label}
        </Button>
      ) : (
        <div className="rounded-full bg-cream-100 text-ink-500 h-11 flex items-center justify-center text-sm">
          {label}
        </div>
      )}
    </article>
  )
}
