import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useCreateOrderComment } from '@/hooks/useOrderInteractions'
import { Send } from 'lucide-react'

export function OrderCommentComposer({ orderId }: { orderId: number }) {
  const [content, setContent] = useState('')
  const { mutateAsync: createComment, isPending } = useCreateOrderComment(orderId)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await createComment({ content: content.trim(), roleType: 'member' })
      setContent('')
      toast({
        title: '评论已发送',
      })
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: '发送失败',
        description: e.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        className="min-h-[40px] resize-none"
        rows={1}
      />
      <Button type="submit" size="icon" disabled={isPending || !content.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
