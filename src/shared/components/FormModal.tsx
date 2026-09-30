import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Save, X } from 'lucide-react'

export function FormModal({ children, onCancel, onSave, title, canSave = true }: {
  children: ReactNode
  onCancel: () => void
  onSave: () => void
  title: string
  canSave?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/40"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      onClick={(event) => { if (event.target === event.currentTarget) onCancel() }}
      ref={dialogRef}
    >
      <form className="p-5" onSubmit={(event) => { event.preventDefault(); if (canSave) onSave() }}>
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h4 className="text-lg font-semibold" id={titleId}>{title}</h4>
          <button aria-label="Tutup" className="icon-button" onClick={onCancel} type="button"><X size={18} /></button>
        </div>
        <div className="grid gap-5">{children}</div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button className="btn-secondary" onClick={onCancel} type="button">Batal</button>
          <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSave} type="submit"><Save size={16} />Simpan</button>
        </div>
      </form>
    </dialog>
  )
}
