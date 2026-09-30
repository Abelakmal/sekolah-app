import { useState } from 'react'
import { ArrowLeft, Download, Save } from 'lucide-react'
import type { AdministrationDraft, AppState, LearningTopic } from '../../core/types'
import { getDraftDocumentInput } from '../../core/documentSnapshot'
import { getModuleCompletion } from '../../core/moduleCompletion'
import { DocxDocumentPreview } from '../builder/DocxDocumentPreview'

export function ArchiveDetail({ draft, topic, state, onBack, onUpdate, onDownload, isSaving = false }: {
  draft: AdministrationDraft
  topic?: LearningTopic
  state: AppState
  onBack: () => void
  onUpdate: (patch: Pick<AdministrationDraft, 'changeNotes'>) => void
  onDownload: (blob?: Blob) => void
  isSaving?: boolean
}) {
  const [input] = useState(() => topic ? getDraftDocumentInput(state, topic, draft) : null)
  const [blob, setBlob] = useState<Blob | undefined>(undefined)
  const [notes, setNotes] = useState(draft.changeNotes)
  const completion = input ? getModuleCompletion(input.state, input.topic, draft) : null
  const year = input?.state.moduleInfo[draft.topicId]?.academicYear
  return <div className="grid min-w-0 gap-5">
    <button className="btn-secondary justify-self-start" onClick={onBack} type="button"><ArrowLeft size={16} />Kembali ke Arsip</button>
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><p className="text-sm text-slate-500">Detail arsip · Versi {draft.version}</p><h2 className="break-words text-xl font-semibold">{draft.title}</h2><p className="mt-2 text-sm text-slate-500">{topic ? `Kelas ${topic.classGrade}` : 'Topik tidak tersedia'} · Tahun ajaran {year || 'belum diisi'}</p></div>
        <button className="btn-primary shrink-0 disabled:opacity-50" disabled={!blob} onClick={() => onDownload(blob)} type="button"><Download size={16} />Download Word</button>
      </div>
      <p className="mt-3 text-xs text-slate-500">Dibuat: {formatDate(draft.createdAt)} · Diperbarui: {formatDate(draft.updatedAt)} · Download terakhir: {draft.lastDownloadedAt ? formatDate(draft.lastDownloadedAt) : 'Belum pernah'}</p>
      <p className="mt-2 text-xs text-slate-500">{draft.snapshot ? 'Isi dokumen merupakan salinan saat diarsipkan; perubahan topik tidak mengubah arsip ini.' : 'Arsip lama: isi dokumen masih mengikuti data topik terkini.'}</p>
    </section>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="grid self-start gap-5">
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); onUpdate({ changeNotes: notes }) }}>
          <h3 className="font-semibold">Pengaturan Arsip</h3>
          <label className="text-sm font-medium">Catatan Perubahan<textarea className="input mt-2 min-h-28 resize-y" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="btn-primary disabled:opacity-50" disabled={isSaving || notes === draft.changeNotes} type="submit"><Save size={16} />{isSaving ? 'Menunggu Supabase...' : 'Simpan Perubahan'}</button>
        </form>
        {completion && <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Kelengkapan · {completion.progress}%</h3>
          <div className="my-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${completion.progress}%` }} /></div>
          <div className="grid gap-3">{completion.sections.map((section) => <div key={section.label}><p className="text-sm font-medium">{section.label} · {section.complete ? 'Lengkap' : 'Belum lengkap'}</p>{section.missing.length > 0 && <p className="mt-1 text-xs leading-5 text-amber-700">{section.missing.join(', ')}</p>}</div>)}</div>
        </section>}
      </aside>
      <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5"><h3 className="mb-4 font-semibold">Preview Dokumen</h3>
        {input ? <DocxDocumentPreview state={input.state} topic={input.topic} selected={input.selected} onPrepared={setBlob} /> : <p className="text-sm text-amber-700">Topik sumber sudah tidak tersedia dan arsip ini belum memiliki salinan isi. Preview dan download tidak tersedia.</p>}
      </section>
    </div>
  </div>
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
