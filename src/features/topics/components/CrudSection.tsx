import type { ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '../../../shared/components/EmptyState'
import { confirmDelete } from '../../../shared/utils/confirmDelete'

export function CrudSection({
  children,
  empty,
  items,
  onAdd,
  title,
}: {
  children: ReactNode
  empty: string
  items: Array<{ id: string; title: string; meta: string; description?: string; onEdit: () => void; onDelete: () => void }>
  onAdd: () => void
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="btn-primary" onClick={onAdd} type="button">
          <Plus size={16} />
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div className="rounded-md border border-slate-200 p-3" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.meta}</p>
                {item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="icon-button" onClick={item.onEdit} title="Edit" type="button">
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button text-red-600"
                  onClick={() => {
                    if (confirmDelete('Hapus data ini dari bank pembelajaran?')) item.onDelete()
                  }}
                  title="Hapus"
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState text={empty} />}
      </div>
      {children}
    </section>
  )
}
