import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Copy, Download, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { getDraftDocumentInput } from '../../core/documentSnapshot'
import { deleteAdministrationArchive, insertAdministrationArchive, loadAdministrationArchives, mergeAdministrationArchives, updateAdministrationArchive } from '../../core/supabase/administrationArchives'
import type { AdministrationDraft, AppState, AppView, LearningTopic } from '../../core/types'
import { EmptyState } from '../../shared/components/EmptyState'
import { SearchField } from '../../shared/components/FormControls'
import { Toast } from '../../shared/components/Toast'
import { confirmDelete } from '../../shared/utils/confirmDelete'
import { downloadAdministrationDocumentDocx } from '../builder/documentExportDocx'
import { ArchiveDetail } from './ArchiveDetail'
import { copyArchiveDraft, filterArchiveEntries, getArchiveEntries } from './archiveData'

export function ArchivePage({ setActiveView, setState, state }: {
  setActiveView: (view: AppView) => void
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [detailId, setDetailId] = useState('')
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState('')
  const [year, setYear] = useState('')
  const [downloadingId, setDownloadingId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [remoteReady, setRemoteReady] = useState(false)
  const [remoteError, setRemoteError] = useState('')
  const [reload, setReload] = useState(0)
  const [mutatingId, setMutatingId] = useState('')
  const entries = remoteError ? [] : getArchiveEntries(state).filter((entry) => entry.draft.storage === 'supabase')
  const filtered = filterArchiveEntries(entries, { query, grade, year })
  const detail = entries.find(({ draft }) => draft.id === detailId)
  const years = [...new Set(entries.map((entry) => entry.year))].sort().reverse()
  const grades = [...new Set(entries.map((entry) => entry.topic?.classGrade).filter((value) => value !== undefined))].sort()

  useEffect(() => {
    let active = true
    const teacherId = state.activeTeacherId
    setIsLoading(true)
    setRemoteReady(false)
    setRemoteError('')
    setState((current) => ({ ...current, drafts: mergeAdministrationArchives(current.drafts, teacherId, []) }))
    void loadAdministrationArchives(teacherId).then((drafts) => {
      if (!active) return
      setState((current) => ({ ...current, drafts: mergeAdministrationArchives(current.drafts, teacherId, drafts) }))
      setRemoteReady(true)
    }).catch((error: unknown) => {
      if (active) setRemoteError(error instanceof Error ? error.message : 'Arsip Supabase gagal dimuat.')
    }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [state.activeTeacherId, setState, reload])

  function applySaved(saved: AdministrationDraft) {
    setState((current) => ({ ...current, drafts: [saved, ...current.drafts.filter((draft) => draft.id !== saved.id)] }))
  }

  async function deleteDraft(draft: AdministrationDraft) {
    if (!remoteReady || mutatingId) return
    if (!confirmDelete('Hapus dokumen ini dari Arsip Administrasi?')) return
    setMutatingId(draft.id)
    try {
      await deleteAdministrationArchive(draft)
      setState((current) => ({ ...current, drafts: current.drafts.filter((item) => item.id !== draft.id) }))
      setToast('Dokumen dihapus dari Arsip. Penghapusan tidak dapat dibatalkan.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Arsip gagal dihapus.')
    } finally { setMutatingId('') }
  }

  async function updateDraft(draft: AdministrationDraft, patch: Pick<AdministrationDraft, 'changeNotes'>) {
    if (!remoteReady || mutatingId) return
    setMutatingId(draft.id)
    try {
      applySaved(await updateAdministrationArchive(draft, patch))
      setToast('Catatan arsip berhasil disimpan ke Supabase.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Catatan gagal disimpan.')
    } finally { setMutatingId('') }
  }

  async function copyDraft(draft: AdministrationDraft) {
    if (!remoteReady || mutatingId) return
    setMutatingId(draft.id)
    try {
      applySaved(await insertAdministrationArchive(copyArchiveDraft(draft)))
      setToast('Salinan arsip disimpan ke Supabase sebagai dokumen baru versi 1.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Arsip gagal disalin.')
    } finally { setMutatingId('') }
  }

  async function downloadDraft(draft: AdministrationDraft, topic: LearningTopic, blob?: Blob) {
    if (downloadingId || !remoteReady) return
    setDownloadingId(draft.id)
    try {
      await downloadAdministrationDocumentDocx(getDraftDocumentInput(state, topic, draft), blob)
      if (remoteReady) {
        try {
          applySaved(await updateAdministrationArchive(draft, { lastDownloadedAt: new Date().toISOString() }))
          setToast('File Word berhasil disiapkan; riwayat download disimpan ke Supabase.')
        } catch (error) {
          setToast(`File Word sudah disiapkan, tetapi riwayat gagal disimpan: ${error instanceof Error ? error.message : 'kesalahan jaringan'}`)
        }
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Download Word gagal.')
    } finally {
      setDownloadingId('')
    }
  }

  function actions(entry: typeof entries[number]) {
    const { draft, topic } = entry
    return <div className="flex flex-wrap items-center gap-2">
      <button className="btn-secondary" onClick={() => setDetailId(draft.id)} type="button"><Eye size={15} />Buka</button>
      <button className="btn-secondary disabled:opacity-50" disabled={!remoteReady || !topic || Boolean(downloadingId)} onClick={() => { if (topic) void downloadDraft(draft, topic) }} type="button"><Download size={15} />{downloadingId === draft.id ? 'Menyiapkan...' : 'Word'}</button>
      <details className="relative">
        <summary aria-label={`Aksi lainnya untuk ${draft.title}`} className="icon-button cursor-pointer list-none [&::-webkit-details-marker]:hidden"><MoreHorizontal size={18} /></summary>
        <div className="absolute right-0 top-full z-10 mt-1 grid w-44 gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          <button disabled={!remoteReady || Boolean(mutatingId)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); void copyDraft(draft) }} type="button"><Copy size={15} />Salin Arsip</button>
          <button disabled={!remoteReady || Boolean(mutatingId)} className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); void deleteDraft(draft) }} type="button"><Trash2 size={15} />Hapus</button>
        </div>
      </details>
    </div>
  }

  return <div className="grid min-w-0 gap-5">
    {isLoading && <p role="status" className="text-sm text-slate-500">Memuat arsip dari Supabase...</p>}
    {remoteError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{remoteError}</p><p className="mt-1">Arsip hanya dimuat dari Supabase. Tidak ada salinan lokal.</p><button className="btn-secondary mt-3" onClick={() => setReload((value) => value + 1)} type="button">Coba Lagi</button></div>}
    {detail ? <ArchiveDetail key={detail.draft.id} draft={detail.draft} topic={detail.topic} state={state} isSaving={!remoteReady || Boolean(mutatingId)} onBack={() => setDetailId('')} onUpdate={(patch) => { void updateDraft(detail.draft, patch) }} onDownload={(blob) => { if (detail.topic) void downloadDraft(detail.draft, detail.topic, blob) }} /> : <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm text-slate-500">{remoteReady ? 'Tersimpan di Supabase · tersedia antarperangkat' : 'Dokumen yang sudah disimpan'}</p><h2 className="text-2xl font-semibold">Arsip Administrasi</h2></div>
        <button className="btn-primary" onClick={() => setActiveView('builder')} type="button"><Plus size={16} />Buat Dokumen</button>
      </div>
      {entries.length > 0 ? <>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_1fr_1fr]">
          <SearchField onChange={setQuery} placeholder="Cari nama dokumen atau topik..." value={query} />
          <select aria-label="Filter kelas" className="input" value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">Semua kelas</option>{grades.map((value) => <option key={value} value={value}>Kelas {value}</option>)}</select>
          <select aria-label="Filter tahun ajaran" className="input" value={year} onChange={(event) => setYear(event.target.value)}><option value="">Semua tahun ajaran</option>{years.map((value) => <option key={value || 'unset'} value={value || 'unset'}>{value || 'Tahun belum diisi'}</option>)}</select>
        </div>
        <p className="mb-3 text-xs text-slate-500">{filtered.length} dari {entries.length} dokumen · Terbaru lebih dahulu</p>
        {filtered.length ? <>
          <table className="hidden w-full table-fixed text-left text-sm lg:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="w-[38%] p-3">Dokumen</th><th className="w-[8%] p-3">Kelas</th><th className="w-[15%] p-3">Tahun Ajaran</th><th className="w-[13%] p-3">Disimpan</th><th className="w-[26%] p-3">Aksi</th></tr></thead>
            <tbody>{filtered.map((entry) => <tr className="border-b border-slate-100" key={entry.draft.id}><td className="break-words p-3 font-medium">{entry.draft.title}</td><td className="p-3">{entry.topic?.classGrade ?? '—'}</td><td className="p-3">{entry.year || 'Belum diisi'}</td><td className="p-3 text-xs text-slate-500">{formatDate(entry.draft.createdAt)}</td><td className="p-3">{actions(entry)}</td></tr>)}</tbody>
          </table>
          <div className="grid gap-3 lg:hidden">{filtered.map((entry) => <article className="rounded-lg border border-slate-200 p-4" key={entry.draft.id}>
            <h3 className="min-w-0 break-words text-sm font-semibold">{entry.draft.title}</h3>
            <p className="mt-2 text-xs text-slate-500">{entry.topic ? `Kelas ${entry.topic.classGrade}` : 'Topik tidak tersedia'} · {entry.year || 'Tahun belum diisi'} · {formatDate(entry.draft.createdAt)}</p>
            <div className="mt-3">{actions(entry)}</div>
          </article>)}</div>
        </> : <EmptyState title="Tidak ada dokumen yang cocok" text="Coba kata kunci lain atau reset filter." action={<button className="btn-secondary" onClick={() => { setQuery(''); setGrade(''); setYear('') }} type="button">Reset Filter</button>} />}
      </> : <EmptyState title="Arsip Administrasi kosong" text="Dokumen yang disimpan melalui Buat Dokumen akan tampil di sini." />}
    </section>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
