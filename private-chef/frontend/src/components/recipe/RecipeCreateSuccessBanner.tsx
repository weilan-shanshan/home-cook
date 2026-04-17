import { CheckCircle2, ImageUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type RecipeCreateSuccessBannerProps = {
  recipeId: number
  uploadedCount: number
  pendingCount: number
  errorCount: number
  onViewDetail: () => void
  onDismiss: () => void
}

export function RecipeCreateSuccessBanner({
  recipeId,
  uploadedCount,
  pendingCount,
  errorCount,
  onViewDetail,
  onDismiss,
}: RecipeCreateSuccessBannerProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">创建成功</h3>
            <p className="text-sm text-emerald-800/90">
              菜品 #{recipeId} 已创建成功。图片会在后台继续上传，上传失败不会影响菜品创建结果。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-emerald-700 shadow-sm">
              <ImageUp className="h-3.5 w-3.5" />
              已完成 {uploadedCount}
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sky-700 shadow-sm">
                <ImageUp className="h-3.5 w-3.5" />
                上传中 / 待处理 {pendingCount}
              </span>
            )}
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-amber-700 shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5" />
                失败 {errorCount}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" onClick={onViewDetail}>
              查看菜品
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onDismiss}>
              继续编辑
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
