import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Copy, Download, Eye, Plus, Trash2 } from 'lucide-react'
import { getModuleCompletion } from '../../core/moduleCompletion'
import { getDraftDocumentInput } from '../../core/documentSnapshot'
import type { AdministrationDraft, AppState, AppView, LearningTopic } from '../../core/types'
import { className } from '../../core/utils'
import { DraftSummary } from '../../shared/components/DraftSummary'
import { EmptyState } from '../../shared/components/EmptyState'
import { Toast } from '../../shared/components/Toast'
import { confirmDelete } from '../../shared/utils/confirmDelete'
import { DocumentPreviewModal } from '../builder/DocumentPreviewModal'
import { buildAdministrationDocumentHtml } from '../builder/documentExport'
import { buildAdministrationDocumentDocxBlob, downloadAdministrationDocumentDocx } from '../builder/documentExportDocx'

type ArchivePreview = {
  draft: AdministrationDraft
  html: string
  topic: LearningTopic
}

export function ArchivePage({
  setActiveView,
  setState,
  state,
}: {
  setActiveView: (view: AppView) => void
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [preview, setPreview] = useState<ArchivePreview | null>(null)
  const [toast, setToast] = useState('')
  const teacherDrafts = state.drafts.filter((draft) => draft.teacherId === state.activeTeacherId)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function deleteDraft(draftId: string) {
    if (!confirmDelete('Hapus draft administrasi ini dari Arsip Administrasi?')) return
    setState((current) => ({ ...current, drafts: current.drafts.filter((item) => item.id !== draftId) }))
    showToast('Draft berhasil dihapus dari Arsip Administrasi.')
  }

  function updateDraft(draftId: string, patch: Partial<Pick<AdministrationDraft, 'changeNotes' | 'status'>>) {
    setState((current) => ({
      ...current,
      drafts: current.drafts.map((draft) => (draft.id === draftId ? { ...draft, ...patch, updatedAt: new Date().toISOString() } : draft)),
    }))
  }

  function duplicateDraft(draft: AdministrationDraft) {
    const now = new Date().toISOString()
    setState((current) => ({
      ...current,
      drafts: [
        {
          ...draft,
          id: `${draft.id}-copy-${Date.now()}`,
          title: `Salinan ${draft.title}`,
          status: 'Draft',
          version: draft.version + 1,
          changeNotes: `Salinan dari ${draft.title} versi ${draft.version}.`,
          createdAt: now,
          updatedAt: now,
          lastDownloadedAt: undefined,
        },
        ...current.drafts,
      ],
    }))
    showToast('Draft berhasil diduplikasi.')
  }

  async function downloadDraft(draft: AdministrationDraft, topic: LearningTopic, blob?: Blob) {
    try {
      await downloadAdministrationDocumentDocx(getDraftDocumentInput(state, topic, draft), blob)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Export DOCX gagal.')
      return
    }
    setState((current) => ({
      ...current,
      drafts: current.drafts.map((item) => (item.id === draft.id ? { ...item, lastDownloadedAt: new Date().toISOString() } : item)),
    }))
    showToast('File DOCX mulai diunduh.')
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Riwayat dokumen</p>
          <h2 className="text-2xl font-semibold">Arsip Administrasi</h2>
        </div>
        <button className="btn-primary" onClick={() => setActiveView('builder')} type="button">
          <Plus size={16} />
          Susun Baru
        </button>
      </div>

      <div className="grid gap-3">
        {teacherDrafts.map((draft) => {
          const topic = draft.snapshot?.topic ?? state.topics.find((item) => item.id === draft.topicId)
          const status = topic ? getArchiveStatus(state, topic, draft) : { complete: 0, total: 7, progress: 0, missing: ['Topik sudah tidak tersedia'] }

          return (
            <article className="rounded-lg border border-slate-200 p-4" key={draft.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{draft.title}</h3>
                    <span className={className('rounded-full px-2 py-1 text-xs font-semibold', statusTone[draft.status])}>{draft.status}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Versi {draft.version}</span>
                    <span
                      className={className(
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        status.progress === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                      )}
                    >
                      {status.progress}% lengkap
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {topic ? `Kelas ${topic.classGrade} / ${topic.title}` : 'Topik dihapus'} | Dibuat {formatDate(draft.createdAt)} | Diperbarui{' '}
                    {formatDate(draft.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Download terakhir: {draft.lastDownloadedAt ? formatDateTime(draft.lastDownloadedAt) : 'Belum pernah download'}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${status.progress}%` }} />
                  </div>
                  {status.missing.length > 0 && (
                    <p className="mt-2 text-xs font-medium text-amber-700">Masih kosong: {status.missing.join(', ')}</p>
                  )}
                  <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Status Dokumen</label>
                      <select
                        className="input"
                        onChange={(event) => updateDraft(draft.id, { status: event.target.value as AdministrationDraft['status'] })}
                        value={draft.status}
                      >
                        <option>Draft</option>
                        <option>Siap Review</option>
                        <option>Final</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Catatan Perubahan</label>
                      <textarea
                        className="input min-h-20 resize-y py-2"
                        onChange={(event) => updateDraft(draft.id, { changeNotes: event.target.value })}
                        value={draft.changeNotes}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    disabled={!topic}
                    onClick={() => {
                      if (!topic) return
                      setPreview({
                        draft,
                        html: buildAdministrationDocumentHtml(getDraftDocumentInput(state, topic, draft)),
                        topic,
                      })
                    }}
                    type="button"
                  >
                    <Eye size={16} />
                    Buka Detail
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!topic}
                    onClick={() => {
                      if (topic) {
                        void downloadDraft(draft, topic)
                      }
                    }}
                    type="button"
                  >
                    <Download size={16} />
                    Download DOCX
                  </button>
                  <button className="btn-secondary" onClick={() => duplicateDraft(draft)} type="button">
                    <Copy size={16} />
                    Duplikasi
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteDraft(draft.id)}
                    type="button"
                  >
                    <Trash2 size={15} />
                    Hapus
                  </button>
                </div>
              </div>

              {topic && <DraftSummary selected={draft} state={getDraftDocumentInput(state, topic, draft).state} topic={topic} compact />}
            </article>
          )
        })}
        {teacherDrafts.length === 0 && (
          <EmptyState
            action={
              <button className="btn-primary" onClick={() => setActiveView('builder')} type="button">
                <Plus size={16} />
                Buat Dokumen
              </button>
            }
            text="Modul Ajar yang disimpan dari Buat Dokumen akan tampil di sini."
            title="Arsip Administrasi kosong"
          />
        )}
      </div>

      {preview && (
        <DocumentPreviewModal
          html={preview.html}
          docxBlob={() => buildAdministrationDocumentDocxBlob(getDraftDocumentInput(state, preview.topic, preview.draft))}
          onClose={() => setPreview(null)}
          onDownload={(blob) => {
            void downloadDraft(preview.draft, preview.topic, blob)
          }}
          title={preview.draft.title}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </section>
  )
}

function getArchiveStatus(state: AppState, topic: LearningTopic, draft: AdministrationDraft) {
  const input = getDraftDocumentInput(state, topic, draft)
  return getModuleCompletion(input.state, input.topic, draft)
}

const statusTone: Record<AdministrationDraft['status'], string> = {
  Draft: 'bg-slate-100 text-slate-700',
  'Siap Review': 'bg-blue-50 text-blue-700',
  Final: 'bg-emerald-50 text-emerald-700',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
