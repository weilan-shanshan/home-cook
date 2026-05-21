import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  src?: string | null
  progress?: number          // 0-100, undefined when not uploading
  onClick?: () => void
  onRemove?: () => void
  variant?: 'image' | 'empty'
  className?: string
}

export function ImageUploadTile({ src, progress, onClick, onRemove, variant, className }: Props) {
  const isUploading = typeof progress === 'number' && progress < 100
  const hasImage = !!src
  return (
    <div
      className={cn(
        'relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-cream-300 bg-cream-100/60 cursor-pointer',
        hasImage && 'border-solid border-transparent',
        className,
      )}
      onClick={onClick}
      role="button"
    >
      {hasImage && (
        <img src={src ?? undefined} alt="" className="w-full h-full object-cover" />
      )}
      {!hasImage && variant !== 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center text-ink-400">
          <Plus className="w-6 h-6" />
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-x-0 bottom-0 bg-ink-900/70 text-white text-[11px] text-center py-1">
          上传中 {Math.round(progress!)}%
        </div>
      )}
      {hasImage && onRemove && !isUploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-900/70 text-white flex items-center justify-center"
          aria-label="移除"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
