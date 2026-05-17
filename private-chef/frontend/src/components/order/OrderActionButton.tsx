import { Button } from '@/components/ui/button'
import { nextActionFor } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'
import type { OrderAction } from '@/lib/order-status'
import { cn } from '@/lib/utils'

interface Props {
  status: OrderStatus
  isMine: boolean
  hasCook: boolean
  isCook: boolean
  onAction: (next: OrderAction['next']) => void
  isPending?: boolean
  variant?: 'primary' | 'wide'
  className?: string
}

export function OrderActionButton({
  status,
  isMine,
  hasCook,
  isCook,
  onAction,
  isPending,
  variant = 'primary',
  className,
}: Props) {
  const action = nextActionFor({ status, isMine, hasCook, isCook })
  if (!action) return null

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation()
        onAction(action.next)
      }}
      disabled={isPending}
      variant={action.variant}
      className={cn(variant === 'wide' && 'w-full', className)}
    >
      {action.label} →
    </Button>
  )
}
