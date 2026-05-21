import { useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'

export function HomeHeroCTA() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/menu')}
      className="relative w-full overflow-hidden rounded-3xl text-white p-5 text-left cursor-pointer shadow-elevated"
      style={{ background: 'linear-gradient(140deg, #9CC084 0%, #7AA468 55%, #5E8C50 100%)' }}
    >
      {/* iridescent sheen — 杏粉 + 冰薄荷 */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(at 85% 8%, rgba(244,213,199,.32) 0%, transparent 45%), radial-gradient(at 15% 92%, rgba(213,229,232,.28) 0%, transparent 50%)',
          mixBlendMode: 'screen',
        }}
      />
      <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-white/15" />
      <div className="absolute top-10 -right-2 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-white/10" />
      <div className="relative">
        <div className="text-xs text-white/85 mb-2">今晚吃什么</div>
        <div className="font-serif text-3xl leading-tight">
          说一声，<br />厨房有人接
        </div>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white text-brand px-4 h-10 font-medium">
          立即点单 <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  )
}
