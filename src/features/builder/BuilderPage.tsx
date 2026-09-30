import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { AlertCircle, CheckCircle2, Download, Pencil, Save } from 'lucide-react'
import type { AppState, BankTab, ClassGrade, LearningTopic } from '../../core/types'
import { getModuleCompletion } from '../../core/moduleCompletion'
import { createId } from '../../core/utils'
import { createDocumentSnapshot } from '../../core/documentSnapshot'
import { insertAdministrationArchive, updateAdministrationArchive } from '../../core/supabase/administrationArchives'
import { Toast } from '../../shared/components/Toast'
import { SaveAdministrationModal } from './LegacyBuilderPage'
import { DocxDocumentPreview } from './DocxDocumentPreview'
import { downloadAdministrationDocumentDocx } from './documentExportDocx'

const sectionTabs: BankTab[] = ['module-info', 'competencies', 'activities', 'assessments', 'attachments']

export function BuilderPage({ selectedTopic, setState, state, onEditSection }: {
  selectedTopic: LearningTopic
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  onEditSection: (topic: LearningTopic, tab: BankTab) => void
}) {
  const [topicId, setTopicId] = useState(selectedTopic.id)
  const [grade, setGrade] = useState<ClassGrade>(selectedTopic.classGrade)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [preparedBlob, setPreparedBlob] = useState<Blob | undefined>(undefined)
  const topics = state.topics.filter((item) => item.teacherId === state.activeTeacherId)
  const grades = state.teacher.classes.length ? state.teacher.classes : [1, 2, 3, 4, 5, 6] as ClassGrade[]
  const filteredTopics = topics.filter((item) => item.classGrade === grade && grades.includes(item.classGrade))
  const topic = filteredTopics.find((item) => item.id === topicId) ?? filteredTopics[0]
  const selected = useMemo(() => ({
    objectiveIds: state.objectives.filter((item) => item.topicId === topic?.id).map((item) => item.id),
    materialIds: state.materials.filter((item) => item.topicId === topic?.id).map((item) => item.id),
    activityIds: state.activities.filter((item) => item.topicId === topic?.id).map((item) => item.id),
    assessmentIds: state.assessments.filter((item) => item.topicId === topic?.id).map((item) => item.id),
  }), [state.objectives, state.materials, state.activities, state.assessments, topic?.id])
  const completion = topic ? getModuleCompletion(state, topic, selected) : null

  async function download() {
    if (!topic) return
    try {
      await downloadAdministrationDocumentDocx({ state, topic, selected }, preparedBlob)
      setToast('File Word berhasil disiapkan.')
      return true
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Download Word gagal.')
      return false
    }
  }

  async function saveDraft(andDownload = false) {
    if (!topic || isSaving) return
    setIsSaving(true)
    const now = new Date().toISOString()
    const draft = {
      id: createId('draft'), teacherId: state.activeTeacherId,
      title: `Administrasi ${topic.title} - Kelas ${topic.classGrade}`,
      topicId: topic.id, status: 'Draft' as const, version: 1,
      changeNotes: 'Dokumen dibuat dari Buat Dokumen.',
      ...selected, createdAt: now, updatedAt: now,
      snapshot: createDocumentSnapshot(state, topic),
    }
    try {
      const saved = await insertAdministrationArchive(draft)
      setState((current) => ({ ...current, drafts: [saved, ...current.drafts] }))
      setShowSaveModal(false)
      setToast('Dokumen dan salinan isinya berhasil disimpan ke Supabase.')
      if (andDownload && await download()) {
        try {
          const downloaded = await updateAdministrationArchive(saved, { lastDownloadedAt: new Date().toISOString() })
          setState((current) => ({ ...current, drafts: current.drafts.map((item) => item.id === downloaded.id ? downloaded : item) }))
        } catch (error) {
          setToast(`Arsip sudah disimpan dan Word disiapkan, tetapi riwayat download belum tersimpan: ${error instanceof Error ? error.message : 'kesalahan jaringan'}`)
        }
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Arsip gagal disimpan ke Supabase.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-xl font-semibold">Buat Dokumen</h2>
        <p className="mt-1 text-sm text-slate-500">Pilih topik, periksa dokumen lengkap, lalu simpan atau download Word. Semua isi topik disertakan otomatis.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
          <label className="min-w-0 text-sm font-semibold">Kelas
            <select className="input mt-2" value={grade} onChange={(event) => setGrade(Number(event.target.value) as ClassGrade)}>
              {grades.map((value) => <option key={value} value={value}>Kelas {value}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-sm font-semibold">Topik Pembelajaran
            <select className="input mt-2" value={topic?.id ?? ''} disabled={!filteredTopics.length} onChange={(event) => setTopicId(event.target.value)}>
              {!filteredTopics.length && <option value="">Belum ada topik untuk kelas ini</option>}
              {filteredTopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        </div>
      </section>
      {topic && completion ? <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="self-start rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Kelengkapan Dokumen · {completion.progress}%</h3>
          <div className="my-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{ width: `${completion.progress}%` }} /></div>
          <p className="mb-4 text-xs text-slate-500">Bagian kosong dapat dilengkapi melalui tombol Edit bagian. Draft tetap dapat disimpan.</p>
          <div className="grid gap-3">{completion.sections.map((section, index) => <section className="rounded-md border border-slate-200 p-3" key={section.label}>
            <div className="flex items-start gap-2">{section.complete ? <CheckCircle2 className="shrink-0 text-emerald-600" size={17} /> : <AlertCircle className="shrink-0 text-amber-600" size={17} />}<h4 className="text-sm font-semibold">{section.label}</h4></div>
            {section.missing.length > 0 && <p className="mt-2 text-xs leading-5 text-amber-700">Belum lengkap: {section.missing.join(', ')}</p>}
            <button className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700" onClick={() => onEditSection(topic, sectionTabs[index])} type="button"><Pencil size={14} />Edit bagian</button>
          </section>)}</div>
        </aside>
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><h3 className="break-words font-semibold">Preview Dokumen Lengkap</h3><p className="mt-1 break-words text-sm text-slate-500">{topic.title} · Tahun ajaran {state.moduleInfo[topic.id]?.academicYear || 'belum diisi'}</p></div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => setShowSaveModal(true)} type="button"><Save size={16} />Simpan ke Arsip</button>
              <button className="btn-primary disabled:opacity-50" disabled={!preparedBlob} onClick={() => void download()} type="button"><Download size={16} />Download Word</button>
            </div>
          </div>
          <DocxDocumentPreview state={state} topic={topic} selected={selected} onPrepared={setPreparedBlob} />
        </section>
      </div> : <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Belum ada topik di kelas ini. Buat topik melalui menu Topik Pembelajaran terlebih dahulu.</p>}
      {showSaveModal && topic && completion && <SaveAdministrationModal
        isSaving={isSaving}
        completion={completion.sections} missingRequired={completion.missing}
        onClose={() => setShowSaveModal(false)} onSave={() => saveDraft()} onSaveAndDownload={() => saveDraft(true)}
        progress={completion.progress} selected={selected} state={state} topic={topic}
      />}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
