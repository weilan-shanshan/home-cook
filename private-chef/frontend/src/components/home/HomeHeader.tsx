import { Sparkles, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  displayName: string | null
  onShareMenu: () => void
}

export function HomeHeader({ displayName, onShareMenu }: Props) {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 flex items-center gap-2">
            私厨 <Sparkles className="h-6 w-6 text-brand" />
          </h1>
          <p className="text-ink-500 text-sm font-medium">
            {displayName ? `${displayName}，` : ''}今天想吃点什么？
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onShareMenu}
        >
          <Share2 className="h-4 w-4" />
          分享菜单
        </Button>
      </div>
    </div>
  )
}
