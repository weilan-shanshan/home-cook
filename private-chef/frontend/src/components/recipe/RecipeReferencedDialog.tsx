import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ReferencingOrder {
  id: number
  meal_date: string
  meal_type: string
  status: string
}

interface RecipeReferencedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blockedBy: {
    recipeTitle: string
    recipeId: number
    referencingOrders: ReferencingOrder[]
    referencingOrderCount: number
  } | null
  onConfirmDelete?: () => void
  recipeTitleForConfirm?: string
  isDeleting?: boolean
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const STATUS_LABEL: Record<string, string> = {
  submitted: '等接手',
  confirmed: '已接手',
  preparing: '正在做',
  completed: '做好了',
  cancelled: '已取消',
}

export function RecipeReferencedDialog({
  open,
  onOpenChange,
  blockedBy,
  onConfirmDelete,
  recipeTitleForConfirm,
  isDeleting,
}: RecipeReferencedDialogProps) {
  const navigate = useNavigate()

  if (blockedBy) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>删不了：「{blockedBy.recipeTitle}」被 {blockedBy.referencingOrderCount} 个订单引用</DialogTitle>
            <DialogDescription>
              要删除菜谱，需要先从这些订单里把它移除。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
              近 {blockedBy.referencingOrders.length} 单
            </p>
            {blockedBy.referencingOrders.map((order) => (
              <div
                key={order.id}
                className="text-sm text-ink-700 flex items-center gap-2 py-1"
              >
                <span>·</span>
                <span>{order.meal_date}</span>
                <span>{MEAL_TYPE_LABEL[order.meal_type] || order.meal_type}</span>
                <span>#{order.id}</span>
                <span className="text-ink-500">（{STATUS_LABEL[order.status] || order.status}）</span>
              </div>
            ))}
            {blockedBy.referencingOrderCount > blockedBy.referencingOrders.length && (
              <p className="text-[11px] text-ink-500 italic pt-1">
                ……共 {blockedBy.referencingOrderCount} 单
              </p>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              我知道了
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                navigate(`/orders?recipeId=${blockedBy.recipeId}`)
              }}
              className="w-full sm:w-auto"
            >
              去看这些订单 →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>删除菜谱</DialogTitle>
          <DialogDescription>
            确定要删除「{recipeTitleForConfirm}」吗？此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? '删除中…' : '删除菜谱'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
