import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { className } from '../../core/utils'

export function StatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: ComponentType<LucideProps>
  label: string
  tone: string
  value: number
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    cyan: 'bg-cyan-50 text-cyan-700',
  }

  return (
    <div className={className('rounded-lg p-4', tones[tone])}>
      <Icon size={18} />
      <p className="mt-4 text-xs font-semibold">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-normal">{value}</p>
    </div>
  )
}
