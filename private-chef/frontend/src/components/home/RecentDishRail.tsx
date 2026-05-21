import { Link } from 'react-router'
import { DishThumb } from '@/components/recipe/DishThumb'

export type RailDish = { id: string | number; name: string; cover?: string | null }

type Props = { dishes: RailDish[]; viewAllPath?: string }

export function RecentDishRail({ dishes, viewAllPath = '/menu' }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg text-ink-900">最近常做</h2>
        <Link to={viewAllPath} className="text-xs text-brand">全部 →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
        {dishes.map((d) => (
          <Link
            key={d.id}
            to={`/recipe/${d.id}`}
            className="shrink-0 w-20 flex flex-col items-center gap-1.5"
          >
            <DishThumb id={d.id} name={d.name} src={d.cover ?? undefined} size="lg" rounded="2xl" />
            <span className="text-[11px] text-ink-700 line-clamp-1">{d.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
