import { useState } from 'react'
import type { ScoreRow } from '../../../core/types'
import { createId } from '../../../core/utils'
import { NumberField, TextField } from '../../../shared/components/FormControls'
import { confirmDelete } from '../../../shared/utils/confirmDelete'

export function AssessmentScoreEditor({
  onChange,
  rows,
  title,
}: {
  onChange: (rows: ScoreRow[]) => void
  rows: ScoreRow[]
  title: string
}) {
  const [editing, setEditing] = useState<ScoreRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draft, setDraft] = useState({ aspect: '', maxScore: 4 })

  function closeForm() {
    setEditing(null)
    setIsFormOpen(false)
    setDraft({ aspect: '', maxScore: 4 })
  }

  function openNewForm() {
    setEditing(null)
    setDraft({ aspect: '', maxScore: 4 })
    setIsFormOpen(true)
  }

  function save() {
    if (!draft.aspect.trim() || draft.maxScore <= 0) return
    onChange(editing ? rows.map((row) => (row.id === editing.id ? { ...row, ...draft } : row)) : [{ id: createId('score'), ...draft }, ...rows])
    closeForm()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="btn-primary" onClick={openNewForm} type="button">Tambah</button>
      </div>
      <div className="grid gap-2">
        {rows.map((row) => (
          <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3" key={row.id}>
            <div className="min-w-0">
              <p className="text-sm font-medium">{row.aspect}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Skor maksimum {row.maxScore}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="text-sm font-semibold text-blue-700" onClick={() => { setEditing(row); setDraft({ aspect: row.aspect, maxScore: row.maxScore }); setIsFormOpen(true) }} type="button">Edit</button>
              <button className="text-sm font-semibold text-red-700" onClick={() => { if (confirmDelete('Hapus format nilai ini?')) onChange(rows.filter((item) => item.id !== row.id)) }} type="button">Hapus</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada format nilai.</div>}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6" onMouseDown={closeForm}>
          <section aria-labelledby="assessment-score-title" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h4 className="text-lg font-semibold text-slate-900" id="assessment-score-title">{editing ? `Edit ${title}` : `Tambah ${title}`}</h4>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={closeForm} type="button">Batal</button>
                <button className="btn-primary" onClick={save} type="button">Simpan</button>
              </div>
            </div>
            <div className="grid gap-5">
              <TextField label="Aspek" onChange={(aspect) => setDraft((current) => ({ ...current, aspect }))} value={draft.aspect} />
              <NumberField label="Skor Maksimum" onChange={(maxScore) => setDraft((current) => ({ ...current, maxScore }))} value={draft.maxScore} />
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
