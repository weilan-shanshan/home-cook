import { Badge } from '@/components/ui/badge'
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from '@/lib/order-status'
import type { OrderStatus } from '@/hooks/useOrders'

interface Props {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
