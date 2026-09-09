import { useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, ChevronDown, Circle } from 'lucide-react'
import { className } from '../../../core/utils'

export function AutoSavedNotice() {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
      <CheckCircle2 size={14} />
      Tersimpan otomatis
    </div>
  )
}

export function BankSection({
  children,
  defaultOpen = false,
  isComplete,
  title,
}: {
  children: ReactNode
  defaultOpen?: boolean
  isComplete?: boolean
  title: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setIsOpen((current) => !current)} type="button">
        <span className="flex min-w-0 items-center gap-2">
          {isComplete ? <CheckCircle2 className="shrink-0 text-emerald-600" size={16} /> : <Circle className="shrink-0 text-slate-300" size={16} />}
          <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
        </span>
        <ChevronDown className={className('shrink-0 text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} size={18} />
      </button>
      {isOpen && <div className="border-t border-slate-200 p-4">{children}</div>}
    </div>
  )
}
