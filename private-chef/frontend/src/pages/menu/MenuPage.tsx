import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, Plus, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRecipes, useTags } from '@/hooks/useRecipes'
import { Input } from '@/components/ui/input'
import { ChipGroup } from '@/components/ui/chip-group'
import { FloatingBar } from '@/components/ui/floating-bar'
import { DishThumb } from '@/components/recipe/DishThumb'
import { RecipeSheet } from '@/components/recipe/RecipeSheet'
import { TagChip, TagOverflowChip } from '@/components/recipe/TagChip'
import { cn } from '@/lib/utils'
import { RatingBadge } from '@/components/recipe/RatingBadge'

export default function MenuPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [activeTag, setActiveTag] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  const { data: tags = [] } = useTags()

  // Map chip value -> tag id for the API
  const tagMap = useMemo(() => {
    const m = new Map<string, number>()
    tags.forEach((t) => m.set(String(t.id), t.id))
    return m
  }, [tags])

  const activeTagId = activeTag === 'all' ? undefined : tagMap.get(activeTag)

  const { data, isLoading } = useRecipes({
    limit: 100,
    q: debouncedQ,
    tag: activeTagId,
  })

  const recipes = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])

  // ChipGroup options: "全部" + dynamic tags from API
  const chipOptions = useMemo(
    () => [
      { value: 'all', label: '全部' },
      ...tags.map((t) => ({ value: String(t.id), label: t.name })),
    ],
    [tags],
  )

  const selectedSize = selected.size

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmitOrder = () => {
    const csv = Array.from(selected).join(',')
    navigate(`/order/create?ids=${csv}`)
  }

  return (
    <div className={cn('space-y-5 animate-in fade-in duration-500', selectedSize > 0 ? 'pb-28' : 'pb-8')}>
      {/* Header row */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="font-serif text-3xl font-bold text-ink-900">菜单</h1>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 h-9 text-sm font-medium text-cream-50 hover:bg-ink-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新菜
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索菜品…"
          className="pl-10"
        />
      </div>

      {/* Chip filter — sticky so it stays visible while browsing */}
      <div className="sticky top-0 -mx-4 px-4 py-2 z-20 bg-cream-50/95 backdrop-blur supports-[backdrop-filter]:bg-cream-50/75">
        <ChipGroup
          options={chipOptions}
          value={activeTag}
          onChange={(v) => setActiveTag(v as string)}
        />
      </div>

      {/* 2-col Bento grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card overflow-hidden animate-pulse">
              <div className="aspect-square bg-cream-200" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-cream-200 rounded w-3/4" />
                <div className="h-3 bg-cream-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="surface-card p-10 text-center text-ink-400 col-span-2">
          <p className="text-sm">没有找到相关菜品</p>
          <button
            type="button"
            className="mt-3 text-xs text-brand underline"
            onClick={() => { setQ(''); setActiveTag('all') }}
          >
            清除筛选
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((r) => {
            const isSelected = selected.has(String(r.id))
            const timesInfo = r.cook_minutes ? `${r.cook_minutes}min` : ''
            const src = r.first_image?.thumb_url ?? r.first_image?.url ?? null

            return (
              <div key={r.id} className="surface-card overflow-hidden">
                {/* Image area */}
                <Link to={`/recipe/${r.id}`} className="block aspect-square relative">
                  <DishThumb
                    id={r.id}
                    name={r.title}
                    src={src}
                    size="fill"
                    rounded="lg"
                    className="object-cover"
                  />
                  {r.tags && r.tags.length > 0 && (
                    <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                      {r.tags.slice(0, 2).map((t) => (
                        <TagChip key={t.id} name={t.name} />
                      ))}
                      {r.tags.length > 2 && (
                        <TagOverflowChip count={r.tags.length - 2} />
                      )}
                    </div>
                  )}
                </Link>

                {/* Info + toggle */}
                <div className="p-3 flex items-end justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900 text-sm line-clamp-1">{r.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RatingBadge avg={(r as unknown as { avg_rating?: number | null }).avg_rating ?? null} count={(r as unknown as { rating_count?: number | null }).rating_count ?? null} />
                      {timesInfo && (
                        <span className="text-[11px] text-ink-500">{timesInfo}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={isSelected ? '移除' : '添加'}
                    onClick={() => toggleSelect(String(r.id))}
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-ink-900 text-white'
                        : 'bg-brand text-white',
                    )}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating selection bar */}
      <FloatingBar visible={selectedSize > 0}>
        <span className="text-sm text-white/80">
          已选{' '}
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold">
            {selectedSize}
          </span>{' '}
          道
        </span>
        <button
          type="button"
          onClick={handleSubmitOrder}
          className="h-9 px-4 rounded-full bg-white text-ink-900 text-sm font-medium hover:bg-cream-50 transition-colors"
        >
          提交点单 →
        </button>
      </FloatingBar>

      <RecipeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode="continuous"
        onSubmitted={() => queryClient.invalidateQueries({ queryKey: ['recipes'] })}
      />
    </div>
  )
}
