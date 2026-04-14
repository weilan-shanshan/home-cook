import {} from 'react'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface StepEditorProps {
  steps: string[]
  onChange: (steps: string[]) => void
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const handleAdd = () => {
    onChange([...steps, ''])
  }

  const handleRemove = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    onChange(newSteps.length > 0 ? newSteps : [''])
  }

  const handleChange = (index: number, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = value
    onChange(newSteps)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newSteps = [...steps]
    const temp = newSteps[index]
    newSteps[index] = newSteps[index - 1]
    newSteps[index - 1] = temp
    onChange(newSteps)
  }

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return
    const newSteps = [...steps]
    const temp = newSteps[index]
    newSteps[index] = newSteps[index + 1]
    newSteps[index + 1] = temp
    onChange(newSteps)
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-3 group">
          <div className="flex flex-col items-center mt-2 gap-1 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
            <button
              type="button"
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
              className="disabled:opacity-20 hover:text-primary transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium w-5 text-center">{index + 1}</span>
            <button
              type="button"
              onClick={() => handleMoveDown(index)}
              disabled={index === steps.length - 1}
              className="disabled:opacity-20 hover:text-primary transition-colors"
            >
              <GripVertical className="h-4 w-4 rotate-180" />
            </button>
          </div>
          <Textarea
            value={step}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`第 ${index + 1} 步说明...`}
            className="min-h-[80px] resize-y"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(index)}
            className="mt-1 text-destructive/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
            disabled={steps.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加步骤
      </Button>
    </div>
  )
}
