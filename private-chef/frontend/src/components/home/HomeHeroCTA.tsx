import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'

export function HomeHeroCTA() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/menu')}
      className="relative w-full overflow-hidden rounded-3xl bg-brand text-white p-5 text-left cursor-pointer shadow-elevated"
    >
      <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-white/15" />
      <div className="absolute top-10 -right-2 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-xs text-white/80 mb-2">今晚吃什么</div>
        <div className="font-serif text-3xl leading-tight">
          点单一下，<br />厨房有人接
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white text-brand px-4 h-10 font-medium">
          立即点单 <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  )
}
