import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type RecipeUploadQueueItem = {
  localId: string
  previewUrl: string
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

type RecipeUploadQueueProps = {
  items: RecipeUploadQueueItem[]
  canRetry: boolean
  onRetry: (localId: string) => void
}

function getStatusCopy(item: RecipeUploadQueueItem) {
  switch (item.status) {
    case 'uploading':
      return `上传中 ${item.progress}%`
    case 'success':
      return '上传成功'
    case 'error':
      return item.errorMessage ?? '上传失败'
    default:
      return '等待上传'
  }
}

export function RecipeUploadQueue({ items, canRetry, onRetry }: RecipeUploadQueueProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">图片上传队列</h3>
        <p className="text-xs text-muted-foreground">每张图片独立上传，可单独重试失败项。</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.localId}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-3 py-2"
          >
            <img
              src={item.previewUrl}
              alt={item.fileName}
              className="h-14 w-14 rounded-lg object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.fileName}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {item.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {item.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                {item.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                <span>{getStatusCopy(item)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${item.status === 'error' ? 'bg-amber-500' : item.status === 'success' ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${item.status === 'error' ? 100 : Math.max(item.progress, item.status === 'success' ? 100 : 8)}%` }}
                />
              </div>
            </div>

            {item.status === 'error' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canRetry}
                onClick={() => onRetry(item.localId)}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                重试
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
