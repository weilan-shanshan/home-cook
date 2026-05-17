import { useRef, useState } from 'react'
import { Loader2, Plus, RotateCcw, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface ImageItem {
  localId: string
  serverId?: number
  url: string
  thumbUrl?: string
  status: 'picked' | 'uploading' | 'uploaded' | 'error' | 'deleting'
  progress?: number
  errorMessage?: string
}

interface RecipeImageGridProps {
  items: ImageItem[]
  onPick: (file: File) => void
  onRemoveLocal: (localId: string) => void
  onRemoveUploaded: (serverId: number) => void
  onRetry: (localId: string) => void
  maxColumns?: number
}

export function RecipeImageGrid({
  items,
  onPick,
  onRemoveLocal,
  onRemoveUploaded,
  onRetry,
}: RecipeImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingDeleteServerId, setPendingDeleteServerId] = useState<number | null>(null)

  const handleAddClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) onPick(file)
    e.target.value = ''
  }

  const handleRemoveClick = (item: ImageItem) => {
    if (item.status === 'uploaded' && item.serverId != null) {
      setPendingDeleteServerId(item.serverId)
    } else {
      onRemoveLocal(item.localId)
    }
  }

  const confirmDelete = () => {
    if (pendingDeleteServerId != null) {
      onRemoveUploaded(pendingDeleteServerId)
      setPendingDeleteServerId(null)
    }
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div
            key={item.localId}
            className="relative aspect-square rounded-2xl overflow-hidden border border-cream-300 bg-cream-100"
          >
            <img
              src={item.thumbUrl || item.url}
              alt=""
              className="w-full h-full object-cover"
            />

            {item.status === 'uploading' && (
              <div className="absolute inset-0 bg-ink-900/40 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                {item.progress != null && (
                  <span className="text-[10px] font-bold mt-1">{item.progress}%</span>
                )}
              </div>
            )}
            {item.status === 'deleting' && (
              <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
            {item.status === 'error' && (
              <div className="absolute inset-0 bg-rose-500/40 flex items-end justify-start p-1.5">
                <span className="text-[10px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded">
                  失败
                </span>
              </div>
            )}
            {item.status === 'uploaded' && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-sage-500 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                  <path strokeLinecap="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {item.status === 'error' ? (
              <button
                type="button"
                aria-label={`重试图片 ${item.localId}`}
                onClick={() => onRetry(item.localId)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-ink-900 flex items-center justify-center shadow"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            ) : item.status !== 'deleting' ? (
              <button
                type="button"
                aria-label={`移除图片 ${item.localId}`}
                onClick={() => handleRemoveClick(item)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-ink-900 text-xs font-bold flex items-center justify-center shadow"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          aria-label="添加图片"
          onClick={handleAddClick}
          className="aspect-square rounded-2xl border-2 border-dashed border-cream-400 flex items-center justify-center text-cream-400 hover:border-brand hover:text-brand transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={pendingDeleteServerId != null} onOpenChange={(o) => !o && setPendingDeleteServerId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除这张图？</DialogTitle>
            <DialogDescription>删了不可恢复，确认要删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setPendingDeleteServerId(null)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="w-full sm:w-auto">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
