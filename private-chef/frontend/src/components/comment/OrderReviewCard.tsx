import { useState } from 'react'
import { useOrderReviews, useCreateOrderReview } from '@/hooks/useOrderInteractions'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Star } from 'lucide-react'

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (val: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 ${!readonly && 'cursor-pointer'} ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  )
}

export function OrderReviewCard({ orderId }: { orderId: number }) {
  const { data: reviews, isLoading } = useOrderReviews(orderId)
  const { mutateAsync: createReview, isPending } = useCreateOrderReview(orderId)
  const { toast } = useToast()

  const [score, setScore] = useState(5)
  const [tasteScore, setTasteScore] = useState(5)
  const [portionScore, setPortionScore] = useState(5)
  const [note, setNote] = useState('')

  if (isLoading) return null

  if (reviews && reviews.length > 0) {
    const review = reviews[0]
    return (
      <Card className="mt-6 border-yellow-200 bg-yellow-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">我的评价</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">总评分</span>
              <StarRating value={review.score} readonly />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground w-16">口味</span>
              <StarRating value={review.taste_score} readonly />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground w-16">分量</span>
              <StarRating value={review.portion_score} readonly />
            </div>
            {review.overall_note && (
              <p className="mt-2 text-sm italic text-muted-foreground bg-white/50 p-2 rounded border border-yellow-100">
                "{review.overall_note}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createReview({
        score,
        tasteScore,
        portionScore,
        overallNote: note.trim() || undefined,
      })
      toast({ title: '评价成功' })
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: '评价失败',
        description: e.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">评价本次服务</CardTitle>
        <CardDescription>您的反馈将帮助我们不断改进</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium w-16">总评分</span>
            <StarRating value={score} onChange={setScore} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-16">口味</span>
            <StarRating value={tasteScore} onChange={setTasteScore} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-16">分量</span>
            <StarRating value={portionScore} onChange={setPortionScore} />
          </div>

          <Textarea
            placeholder="写下具体的评价内容（选填）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            提交评价
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
