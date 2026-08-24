import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({ action, text, title = 'Belum ada data' }: { action?: ReactNode; text: string; title?: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="grid size-10 place-items-center rounded-md bg-white text-slate-400 shadow-sm">
        <Inbox size={18} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
