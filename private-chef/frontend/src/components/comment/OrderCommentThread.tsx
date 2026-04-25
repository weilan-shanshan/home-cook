import { useOrderComments } from '@/hooks/useOrderInteractions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { OrderCommentComposer } from './OrderCommentComposer'
export function OrderCommentThread({ orderId }: { orderId: number }) {
  const { data: comments, isLoading } = useOrderComments(orderId)

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <Card className="mt-6 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">评论</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 w-full animate-pulse bg-muted rounded" />
            <div className="h-12 w-full animate-pulse bg-muted rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.display_name?.slice(0, 1).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-secondary/50 border border-border/40 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">
                        {comment.display_name || '用户'}
                        {comment.role_type === 'cook' && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">厨师</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">暂无评论，来抢沙发吧</p>
            )}
          </div>
        )}
        <OrderCommentComposer orderId={orderId} />
      </CardContent>
    </Card>
  )
}
