import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ClipboardList } from 'lucide-react'
import { getModuleWorksheets } from '../../../core/moduleWorksheets'
import type { AppState, LearningTopic, Worksheet, WorksheetType } from '../../../core/types'
import { createId } from '../../../core/utils'
import { TextField } from '../../../shared/components/FormControls'
import { RichTextEditor } from '../../../shared/components/RichTextEditor'
import { confirmDelete } from '../../../shared/utils/confirmDelete'

type Props = { query: string; setState: Dispatch<SetStateAction<AppState>>; state: AppState; topic: LearningTopic }

function legacyContent(item: Worksheet) {
  if (item.content) return item.content
  return `<h3>Petunjuk</h3><p>${item.instructions}</p><h3>Soal</h3><p>${item.questions}</p><h3>Area Jawaban</h3><p>${item.answerArea}</p><h3>Kunci Jawaban</h3><p>${item.answerKey}</p>`
}

export function RichWorksheetEditor({ query, setState, state, topic }: Props) {
  const worksheets = getModuleWorksheets(state, topic)
  const [editing, setEditing] = useState<Worksheet | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<{ type: WorksheetType; title: string; content: string }>({ type: 'Berkelompok', title: '', content: '' })
  const items = worksheets.filter((item) => `${item.type} ${item.title} ${legacyContent(item)}`.toLowerCase().includes(query.toLowerCase()))

  function close() { setEditing(null); setIsOpen(false); setDraft({ type: 'Berkelompok', title: '', content: '' }) }
  function open(type: WorksheetType, item?: Worksheet) { setEditing(item ?? null); setDraft(item ? { type: item.type, title: item.title, content: legacyContent(item) } : { type, title: '', content: '' }); setIsOpen(true) }
  function save() {
    if (!draft.title.trim() || !draft.content.replace(/<[^>]*>/g, '').trim()) return
    const value = { ...draft, instructions: '', questions: draft.content, answerArea: '', answerKey: '' }
    setState((current) => ({ ...current, moduleWorksheets: { ...current.moduleWorksheets, [topic.id]: editing ? worksheets.map((item) => item.id === editing.id ? { ...item, ...value } : item) : [{ id: createId('worksheet'), ...value }, ...worksheets] } }))
    close()
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50" onClick={() => open('Berkelompok')} type="button"><ClipboardList size={16} />Tambah LKPD Berkelompok</button>
        <button className="flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50" onClick={() => open('Individu')} type="button"><ClipboardList size={16} />Tambah LKPD Individu</button>
      </div>
      {items.map((item) => <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3" key={item.id}><div><p className="font-medium">{item.title}</p><p className="text-sm text-slate-500">LKPD {item.type}</p></div><div className="flex gap-2"><button className="text-sm font-semibold text-blue-700" onClick={() => open(item.type, item)} type="button">Edit</button><button className="text-sm font-semibold text-red-700" onClick={() => { if (confirmDelete('Hapus LKPD ini?')) setState((current) => ({ ...current, moduleWorksheets: { ...current.moduleWorksheets, [topic.id]: worksheets.filter((entry) => entry.id !== item.id) } })) }} type="button">Hapus</button></div></div>)}
      {items.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada LKPD.</div>}
      {isOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6" onMouseDown={close}><section aria-modal="true" className="max-h-full w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4"><h4 className="text-lg font-semibold">{editing ? 'Edit LKPD' : 'Tambah LKPD'}</h4><div className="flex gap-2"><button className="btn-secondary" onClick={close} type="button">Batal</button><button className="btn-primary" onClick={save} type="button">Simpan</button></div></div><div className="grid gap-5"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Jenis LKPD</label><select className="input" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as WorksheetType }))} value={draft.type}><option>Berkelompok</option><option>Individu</option></select></div><TextField label="Judul LKPD" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} /><RichTextEditor label="Isi LKPD" onChange={(content) => setDraft((current) => ({ ...current, content }))} value={draft.content} /></div></section></div>}
    </div>
  )
}
