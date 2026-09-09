import type { ReactNode } from 'react'
import { Save } from 'lucide-react'

export function FormPanel({
  children,
  onCancel,
  onSave,
  title,
}: {
  children: ReactNode
  onCancel: () => void
  onSave: () => void
  title: string
}) {
  return (
    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-semibold">{title}</h4>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={onCancel} type="button">
            Batal
          </button>
          <button className="btn-primary" onClick={onSave} type="button">
            <Save size={16} />
            Simpan
          </button>
        </div>
      </div>
      <div className="grid gap-5">{children}</div>
    </div>
  )
}
