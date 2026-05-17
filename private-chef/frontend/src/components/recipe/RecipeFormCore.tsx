import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StepEditor } from '@/components/recipe/StepEditor'
import { RecipeImageGrid, type ImageItem } from './RecipeImageGrid'
import type { RecipeTag } from '@/hooks/useRecipes'

export interface RecipeFormValues {
  title: string
  description: string
  cookMinutes: number | ''
  servings: number | ''
  steps: string[]
  tagIds: number[]
}

export interface RecipeImageActions {
  onPick: (file: File) => void
  onRemoveLocal: (localId: string) => void
  onRemoveUploaded: (serverId: number) => void
  onRetry: (localId: string) => void
}

interface RecipeFormCoreProps {
  values: RecipeFormValues
  onChange: (patch: Partial<RecipeFormValues>) => void
  images: ImageItem[]
  imageActions: RecipeImageActions
  availableTags: RecipeTag[]
  titleInputRef?: React.Ref<HTMLInputElement>
}

export function RecipeFormCore({
  values,
  onChange,
  images,
  imageActions,
  availableTags,
  titleInputRef,
}: RecipeFormCoreProps) {
  const toggleTag = (tagId: number) => {
    const next = values.tagIds.includes(tagId)
      ? values.tagIds.filter((id) => id !== tagId)
      : [...values.tagIds, tagId]
    onChange({ tagIds: next })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">菜名</label>
        <Input
          ref={titleInputRef}
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="输入菜名…"
          className="mt-1.5"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">图片</label>
        <div className="mt-1.5">
          <RecipeImageGrid items={images} {...imageActions} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">描述</label>
        <Textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="可选，简单描述…"
          className="mt-1.5 h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">时长（分钟）</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.cookMinutes}
            onChange={(e) => {
              const v = e.target.value
              onChange({ cookMinutes: v === '' ? '' : Number(v) })
            }}
            placeholder="45"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">份数</label>
          <Input
            type="number"
            inputMode="numeric"
            value={values.servings}
            onChange={(e) => {
              const v = e.target.value
              onChange({ servings: v === '' ? '' : Number(v) })
            }}
            placeholder="2"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">标签</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {availableTags.map((tag) => {
            const selected = values.tagIds.includes(tag.id)
            return (
              <Badge
                key={tag.id}
                variant={selected ? 'default' : 'secondary'}
                onClick={() => toggleTag(tag.id)}
                className="cursor-pointer"
              >
                {tag.name}
              </Badge>
            )
          })}
        </div>
        <p className="text-[10px] text-ink-500 mt-1.5">提交后标签会保留，方便连续录同类菜</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">步骤</label>
        <div className="mt-1.5">
          <StepEditor
            steps={values.steps}
            onChange={(steps) => onChange({ steps })}
          />
        </div>
      </div>
    </div>
  )
}
