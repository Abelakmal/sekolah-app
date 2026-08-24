import { Check, ChevronRight } from 'lucide-react'
import { className } from '../../core/utils'
import { EmptyState } from './EmptyState'

export function SelectionList({
  items,
  onSelect,
  selectedIds,
  single,
}: {
  items: Array<{ id: string; title: string; meta: string }>
  onSelect: (id: string) => void
  selectedIds: string[]
  single?: boolean
}) {
  return (
    <div className="grid gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id)
        return (
          <button
            className={className(
              'flex min-h-14 items-center gap-3 rounded-md border p-3 text-left',
              selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50',
            )}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span
              className={className(
                'grid size-5 shrink-0 place-items-center rounded border',
                selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300',
              )}
            >
              {selected && <Check size={13} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm font-medium">{item.title}</span>
              <span className="block break-words text-xs text-slate-500">{item.meta}</span>
            </span>
            {single && <ChevronRight size={16} className="text-slate-400" />}
          </button>
        )
      })}
      {items.length === 0 && <EmptyState text="Data untuk langkah Penyusun Administrasi ini masih kosong." />}
    </div>
  )
}
