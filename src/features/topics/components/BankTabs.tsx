import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { AlertCircle, CheckCircle2, Circle, FileText } from 'lucide-react'
import { getModuleCompletion } from '../../../core/moduleCompletion'
import type {
  AppState,
  BankTab,
  LearningMaterial,
  LearningObjective,
  LearningTopic,
  MaterialAttachment,
  ModuleCompetency,
  ModuleInfo,
} from '../../../core/types'
import { className, createId, maxAttachmentBytes, readAttachment } from '../../../core/utils'
import { SearchField, NumberField, TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { confirmDelete } from '../../../shared/utils/confirmDelete'
import { ActivitiesTab } from './ActivitiesTab'
import { AppendicesTab } from './AppendicesTab'
import { AssessmentsTab } from './AssessmentsTab'
import { CrudSection } from './CrudSection'
import { TemplateActions } from './TemplateActions'
import { WorksheetsTab } from './WorksheetsTab'

const bankLabels: Record<BankTab, string> = {
  'module-info': 'Informasi Modul',
  competencies: 'Kompetensi & Tujuan',
  materials: 'Materi & Media',
  activities: 'Aktivitas Pembelajaran',
  assessments: 'Asesmen & Rubrik',
  worksheets: 'LKPD',
  attachments: 'Lampiran',
}

type BankTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

export function TopicDetailPanel({
  onBack,
  selectedTopic,
  setState,
  state,
}: {
  onBack: () => void
  selectedTopic: LearningTopic
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [tab, setTab] = useState<BankTab>('module-info')
  const [query, setQuery] = useState('')
  const tabStatus = getTabStatus(state, selectedTopic)
  const filledTabs = Object.values(tabStatus).filter(Boolean).length
  const completion = getModuleCompletion(state, selectedTopic)
  const info = getModuleInfo(state, selectedTopic)

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <button className="btn-secondary mb-4" onClick={onBack} type="button">
          Kembali ke Topik
        </button>
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm text-slate-500">
              Kelas {selectedTopic.classGrade} / Detail Topik Pembelajaran
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">{selectedTopic.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{selectedTopic.description}</p>
          </div>
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 xl:grid-cols-1">
            <SummaryMetric label="Kelas" value={`Kelas ${selectedTopic.classGrade}`} />
            <SummaryMetric label="Materi Pokok" value={info.mainMaterial || selectedTopic.title} />
            <SummaryMetric label="Alokasi Waktu" value={info.timeAllocation || 'Belum diisi'} muted={!info.timeAllocation} />
            <SummaryMetric label="Kelengkapan Tab" value={`${filledTabs}/${Object.keys(bankLabels).length}`} />
            <SummaryMetric label="Kelengkapan Modul" value={`${completion.progress}%`} muted={completion.progress < 100} />
          </div>
        </div>
        {completion.missing.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-700" size={16} />
              <div>
                <p className="text-sm font-semibold text-amber-900">Field wajib belum lengkap</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">{completion.missing.slice(0, 6).join(', ')}</p>
                {completion.missing.length > 6 && <p className="mt-1 text-xs font-medium text-amber-700">+{completion.missing.length - 6} field lainnya.</p>}
              </div>
            </div>
          </div>
        )}
        <div className="mt-5 grid gap-3">
          <TemplateActions selectedTopic={selectedTopic} setState={setState} state={state} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(Object.keys(bankLabels) as BankTab[]).map((item) => (
              <button
                className={className(
                  'flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 text-left text-sm font-medium',
                  tab === item ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
                key={item}
                onClick={() => {
                  setTab(item)
                  setQuery('')
                }}
                type="button"
              >
                <span>{bankLabels[item]}</span>
                {tabStatus[item] ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-slate-300" />}
              </button>
            ))}
          </div>
          {isSearchableTab(tab) && (
            <div className="max-w-xl">
              <SearchField onChange={setQuery} placeholder={`Cari ${bankLabels[tab].toLowerCase()}...`} value={query} />
            </div>
          )}
          <CompletionChecklist state={state} topic={selectedTopic} />
        </div>
      </section>

      <BankTabContent query={query} setState={setState} state={state} tab={tab} topic={selectedTopic} />
    </div>
  )
}

function CompletionChecklist({ state, topic }: { state: AppState; topic: LearningTopic }) {
  const completion = getModuleCompletion(state, topic)

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-2">
      {completion.sections.map((section) => (
        <div className="rounded-md border border-slate-200 p-3" key={section.label}>
          <div className="flex items-center gap-2">
            {section.complete ? <CheckCircle2 className="text-emerald-600" size={16} /> : <AlertCircle className="text-amber-600" size={16} />}
            <p className="text-sm font-semibold text-slate-900">{section.label}</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {section.complete ? 'Lengkap' : section.missing.slice(0, 3).join(', ')}
            {!section.complete && section.missing.length > 3 ? `, +${section.missing.length - 3} lainnya` : ''}
          </p>
        </div>
      ))}
    </div>
  )
}

function BankTabContent({
  query,
  setState,
  state,
  tab,
  topic,
}: {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  tab: BankTab
  topic: LearningTopic
}) {
  if (tab === 'module-info') return <ModuleInfoTab setState={setState} state={state} topic={topic} />
  if (tab === 'competencies') return <CompetenciesTab query={query} setState={setState} state={state} topic={topic} />
  if (tab === 'materials') return <MaterialsTab query={query} setState={setState} state={state} topic={topic} />
  if (tab === 'activities') return <ActivitiesTab query={query} setState={setState} state={state} topic={topic} />
  if (tab === 'assessments') return <AssessmentsTab query={query} setState={setState} state={state} topic={topic} />
  if (tab === 'worksheets') return <WorksheetsTab query={query} setState={setState} state={state} topic={topic} />
  return <AppendicesTab query={query} setState={setState} state={state} topic={topic} />
}

function getModuleInfo(state: AppState, topic: LearningTopic): ModuleInfo {
  return state.moduleInfo[topic.id] ?? {
    ...fallbackModuleInfo,
    phase: topic.classGrade >= 5 ? 'C' : topic.classGrade >= 3 ? 'B' : 'A',
    mainMaterial: topic.title,
    subMaterial: topic.title,
    targetStudents: `Peserta didik kelas ${topic.classGrade} dengan kemampuan bervariasi.`,
  }
}

function getTabStatus(state: AppState, topic: LearningTopic): Record<BankTab, boolean> {
  const completion = getModuleCompletion(state, topic)
  const byLabel = new Map(completion.sections.map((section) => [section.label, section.complete]))

  return {
    'module-info': Boolean(byLabel.get('Identitas Modul')),
    competencies: Boolean(byLabel.get('Kompetensi & Tujuan')),
    materials: Boolean(byLabel.get('Materi & Media')),
    activities: Boolean(byLabel.get('Aktivitas Pembelajaran')),
    assessments: Boolean(byLabel.get('Asesmen & Rubrik')),
    worksheets: Boolean(byLabel.get('LKPD')),
    attachments: Boolean(byLabel.get('Lampiran')),
  }
}

const fallbackModuleCompetency: ModuleCompetency = {
  initialCompetency: '',
  pancasilaProfiles: [],
  learningAchievements: '',
  meaningfulUnderstanding: '',
  triggerQuestions: [],
  diagnosticQuestions: [],
  affectivePreparation: '',
  cognitivePreparation: '',
  psychomotorPreparation: '',
}

function getModuleCompetency(state: AppState, topic: LearningTopic): ModuleCompetency {
  return state.moduleCompetencies[topic.id] ?? fallbackModuleCompetency
}

function isSearchableTab(tab: BankTab) {
  return tab === 'competencies' || tab === 'materials' || tab === 'activities' || tab === 'assessments' || tab === 'worksheets' || tab === 'attachments'
}

function SummaryMetric({ label, muted, value }: { label: string; muted?: boolean; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={className('mt-1 truncate text-sm font-semibold', muted ? 'text-slate-400' : 'text-slate-900')}>{value}</p>
    </div>
  )
}

const fallbackModuleInfo: ModuleInfo = {
  academicYear: '2024/2025',
  semester: 'Ganjil',
  phase: '',
  subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  mainMaterial: '',
  subMaterial: '',
  chapterMeeting: '',
  timeAllocation: '',
  learningMode: 'Teori dan Praktek',
  learningModel: '',
  learningMethods: '',
  differentiationStrategy: '',
  media: '',
  toolsAndMaterials: '',
  learningResources: '',
  practiceArea: '',
  sportEquipment: '',
  enrichment: '',
  remedial: '',
  approvalPlace: '',
  approvalDate: '',
  studentCount: 0,
  targetStudents: '',
}

function ModuleInfoTab({
  setState,
  state,
  topic,
}: {
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}) {
  const info = getModuleInfo(state, topic)

  function updateInfo(patch: Partial<ModuleInfo>) {
    setState((current) => ({
      ...current,
      moduleInfo: {
        ...current.moduleInfo,
        [topic.id]: {
          ...info,
          ...patch,
        },
      },
    }))
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
          <FileText size={19} />
        </div>
        <div>
          <h3 className="text-base font-semibold">Informasi Modul</h3>
          <p className="text-sm text-slate-500">Data ini dipakai sebagai identitas dokumen Modul Ajar.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Tahun Ajaran" onChange={(academicYear) => updateInfo({ academicYear })} value={info.academicYear} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Semester</label>
          <select className="input" onChange={(event) => updateInfo({ semester: event.target.value as ModuleInfo['semester'] })} value={info.semester}>
            <option>Ganjil</option>
            <option>Genap</option>
          </select>
        </div>
        <TextField label="Mata Pelajaran" onChange={(subject) => updateInfo({ subject })} value={info.subject} />
        <TextField label="Fase" onChange={(phase) => updateInfo({ phase })} value={info.phase} />
        <TextField label="Materi Pokok" onChange={(mainMaterial) => updateInfo({ mainMaterial })} value={info.mainMaterial} />
        <TextField label="Sub Materi" onChange={(subMaterial) => updateInfo({ subMaterial })} value={info.subMaterial} />
        <TextField label="Bab/Pertemuan" onChange={(chapterMeeting) => updateInfo({ chapterMeeting })} value={info.chapterMeeting} />
        <TextField label="Alokasi Waktu" onChange={(timeAllocation) => updateInfo({ timeAllocation })} value={info.timeAllocation} />
        <TextField label="Model Pembelajaran" onChange={(learningModel) => updateInfo({ learningModel })} value={info.learningModel} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Mode Pembelajaran</label>
          <select
            className="input"
            onChange={(event) => updateInfo({ learningMode: event.target.value as ModuleInfo['learningMode'] })}
            value={info.learningMode}
          >
            <option>Teori</option>
            <option>Praktek</option>
            <option>Teori dan Praktek</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <TextArea label="Metode Pembelajaran" onChange={(learningMethods) => updateInfo({ learningMethods })} value={info.learningMethods} />
        </div>
        <div className="md:col-span-2">
          <TextArea
            label="Strategi Pembelajaran Berdiferensiasi"
            onChange={(differentiationStrategy) => updateInfo({ differentiationStrategy })}
            value={info.differentiationStrategy}
          />
        </div>
        <NumberField label="Jumlah Peserta Didik" onChange={(studentCount) => updateInfo({ studentCount })} value={info.studentCount} />
        <div className="md:col-span-2">
          <TextArea label="Target Peserta Didik" onChange={(targetStudents) => updateInfo({ targetStudents })} value={info.targetStudents} />
        </div>
        <div className="md:col-span-2">
          <h4 className="mt-2 text-sm font-semibold text-slate-900">Sarana dan Prasarana</h4>
        </div>
        <TextArea label="Media" onChange={(media) => updateInfo({ media })} value={info.media} />
        <TextArea label="Alat dan Bahan" onChange={(toolsAndMaterials) => updateInfo({ toolsAndMaterials })} value={info.toolsAndMaterials} />
        <TextArea label="Sumber Belajar" onChange={(learningResources) => updateInfo({ learningResources })} value={info.learningResources} />
        <TextArea label="Lapangan/Tempat Praktik" onChange={(practiceArea) => updateInfo({ practiceArea })} value={info.practiceArea} />
        <div className="md:col-span-2">
          <TextArea label="Peralatan PJOK" onChange={(sportEquipment) => updateInfo({ sportEquipment })} value={info.sportEquipment} />
        </div>
        <div className="md:col-span-2">
          <h4 className="mt-2 text-sm font-semibold text-slate-900">Pengayaan, Remedial, dan Pengesahan</h4>
        </div>
        <TextArea label="Pengayaan" onChange={(enrichment) => updateInfo({ enrichment })} value={info.enrichment} />
        <TextArea label="Remedial" onChange={(remedial) => updateInfo({ remedial })} value={info.remedial} />
        <TextField label="Tempat Pengesahan" onChange={(approvalPlace) => updateInfo({ approvalPlace })} value={info.approvalPlace} />
        <TextField label="Tanggal Pengesahan" onChange={(approvalDate) => updateInfo({ approvalDate })} value={info.approvalDate} />
      </div>
    </section>
  )
}

function CompetenciesTab({ query, setState, state, topic }: BankTabProps) {
  const competency = getModuleCompetency(state, topic)

  function updateCompetency(patch: Partial<ModuleCompetency>) {
    setState((current) => ({
      ...current,
      moduleCompetencies: {
        ...current.moduleCompetencies,
        [topic.id]: {
          ...competency,
          ...patch,
        },
      },
    }))
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Kompetensi Inti</h3>
          <p className="text-sm text-slate-500">Lengkapi bagian awal Modul Ajar sesuai format dokumen guru.</p>
        </div>
        <div className="grid gap-4">
          <TextArea
            label="Komponen Awal"
            onChange={(initialCompetency) => updateCompetency({ initialCompetency })}
            value={competency.initialCompetency}
          />
          <TextArea
            label="Capaian Pembelajaran"
            onChange={(learningAchievements) => updateCompetency({ learningAchievements })}
            value={competency.learningAchievements}
          />
          <TextArea
            label="Pemahaman Bermakna"
            onChange={(meaningfulUnderstanding) => updateCompetency({ meaningfulUnderstanding })}
            value={competency.meaningfulUnderstanding}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <TextArea
              label="Persiapan Afektif"
              onChange={(affectivePreparation) => updateCompetency({ affectivePreparation })}
              value={competency.affectivePreparation}
            />
            <TextArea
              label="Persiapan Kognitif"
              onChange={(cognitivePreparation) => updateCompetency({ cognitivePreparation })}
              value={competency.cognitivePreparation}
            />
            <div className="lg:col-span-2">
              <TextArea
                label="Persiapan Psikomotor"
                onChange={(psychomotorPreparation) => updateCompetency({ psychomotorPreparation })}
                value={competency.psychomotorPreparation}
              />
            </div>
          </div>
        </div>
      </section>

      <StringListEditor
        label="Profil Pelajar Pancasila"
        onChange={(pancasilaProfiles) => updateCompetency({ pancasilaProfiles })}
        placeholder="Contoh: Mandiri: peserta didik dapat bertanggung jawab saat latihan."
        values={competency.pancasilaProfiles}
      />
      <StringListEditor
        label="Pertanyaan Pemantik"
        onChange={(triggerQuestions) => updateCompetency({ triggerQuestions })}
        placeholder="Contoh: Bagaimana cara melakukan passing bawah dengan benar?"
        values={competency.triggerQuestions}
      />
      <StringListEditor
        label="Asesmen Diagnostik Non-Kognitif"
        onChange={(diagnosticQuestions) => updateCompetency({ diagnosticQuestions })}
        placeholder="Contoh: Bagaimana kabar peserta didik hari ini?"
        values={competency.diagnosticQuestions}
      />

      <ObjectivesTab query={query} setState={setState} state={state} topic={topic} />
    </div>
  )
}

function StringListEditor({
  label,
  onChange,
  placeholder,
  values,
}: {
  label: string
  onChange: (values: string[]) => void
  placeholder: string
  values: string[]
}) {
  const [draft, setDraft] = useState('')

  function addItem() {
    const value = draft.trim()
    if (!value) return
    onChange([...values, value])
    setDraft('')
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold">{label}</h3>
      <div className="grid gap-2">
        {values.map((value, index) => (
          <div className="flex items-start gap-3 rounded-md border border-slate-200 p-3" key={`${value}-${index}`}>
            <p className="min-w-0 flex-1 text-sm leading-6 text-slate-700">{value}</p>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirmDelete('Hapus item ini?')) onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }}
              type="button"
            >
              Hapus
            </button>
          </div>
        ))}
        {values.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada data.</div>}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input className="input" onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} value={draft} />
        <button className="btn-primary" onClick={addItem} type="button">
          Tambah
        </button>
      </div>
    </section>
  )
}

function ObjectivesTab({ query, setState, state, topic }: BankTabProps) {
  const [editing, setEditing] = useState<LearningObjective | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '' })
  const items = state.objectives
    .filter((item) => item.topicId === topic.id)
    .filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()))

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return
    if (editing) {
      setState((current) => ({
        ...current,
        objectives: current.objectives.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)),
      }))
    } else {
      setState((current) => ({
        ...current,
        objectives: [{ id: createId('objective'), topicId: topic.id, ...draft }, ...current.objectives],
      }))
    }
    setEditing(null)
    setDraft({ title: '', description: '' })
  }

  return (
    <CrudSection
      empty="Belum ada tujuan pembelajaran."
      items={items.map((item) => ({
        id: item.id,
        title: item.description,
        meta: item.title,
        onEdit: () => {
          setEditing(item)
          setDraft({ title: item.title, description: item.description })
        },
        onDelete: () => setState((current) => ({ ...current, objectives: current.objectives.filter((entry) => entry.id !== item.id) })),
      }))}
      onAdd={() => {
        setEditing(null)
        setDraft({ title: '', description: '' })
      }}
      title="Tujuan Pembelajaran"
    >
      {(editing || draft.title || draft.description) && (
        <FormPanel
          title={editing ? 'Edit Tujuan' : 'Tambah Tujuan'}
          onCancel={() => {
            setEditing(null)
            setDraft({ title: '', description: '' })
          }}
          onSave={save}
        >
          <TextField label="Judul" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
          <TextArea label="Deskripsi" onChange={(description) => setDraft((current) => ({ ...current, description }))} value={draft.description} />
        </FormPanel>
      )}
    </CrudSection>
  )
}

function MaterialsTab({ query, setState, state, topic }: BankTabProps) {
  const [editing, setEditing] = useState<LearningMaterial | null>(null)
  const [draft, setDraft] = useState<{ title: string; description: string; videoUrl: string; attachment?: MaterialAttachment }>({
    title: '',
    description: '',
    videoUrl: '',
  })
  const [fileError, setFileError] = useState('')
  const items = state.materials
    .filter((item) => item.topicId === topic.id)
    .filter((item) => `${item.title} ${item.description} ${item.videoUrl ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return
    if (draft.videoUrl && !URL.canParse(draft.videoUrl)) return
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      videoUrl: draft.videoUrl.trim() || undefined,
      attachment: draft.attachment,
    }
    if (editing) {
      setState((current) => ({
        ...current,
        materials: current.materials.map((item) => (item.id === editing.id ? { ...item, ...payload } : item)),
      }))
    } else {
      setState((current) => ({
        ...current,
        materials: [{ id: createId('material'), topicId: topic.id, ...payload }, ...current.materials],
      }))
    }
    setEditing(null)
    setDraft({ title: '', description: '', videoUrl: '' })
  }

  async function handleFile(file?: File) {
    setFileError('')
    if (!file) return
    if (file.size > maxAttachmentBytes) {
      setFileError('Ukuran file maksimal 2 MB.')
      return
    }
    setDraft((current) => ({ ...current, attachment: undefined }))
    const attachment = await readAttachment(file)
    setDraft((current) => ({ ...current, attachment }))
  }

  return (
    <CrudSection
      empty="Belum ada materi."
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        meta: [item.attachment?.name, item.videoUrl ? 'Video' : undefined].filter(Boolean).join(' | ') || 'Materi teks',
        description: item.description,
        onEdit: () => {
          setEditing(item)
          setDraft({ title: item.title, description: item.description, videoUrl: item.videoUrl ?? '', attachment: item.attachment })
        },
        onDelete: () => setState((current) => ({ ...current, materials: current.materials.filter((entry) => entry.id !== item.id) })),
      }))}
      onAdd={() => {
        setEditing(null)
        setDraft({ title: '', description: '', videoUrl: '' })
      }}
      title="Materi"
    >
      {(editing || draft.title || draft.description || draft.videoUrl || draft.attachment) && (
        <FormPanel
          title={editing ? 'Edit Materi' : 'Tambah Materi'}
          onCancel={() => {
            setEditing(null)
            setDraft({ title: '', description: '', videoUrl: '' })
            setFileError('')
          }}
          onSave={save}
        >
          <TextField label="Judul Materi" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
          <TextArea label="Deskripsi" onChange={(description) => setDraft((current) => ({ ...current, description }))} value={draft.description} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lampiran File</label>
            <input className="input" onChange={(event) => void handleFile(event.target.files?.[0])} type="file" />
            {draft.attachment && (
              <p className="mt-1 text-xs text-slate-500">
                {draft.attachment.name} ({Math.round(draft.attachment.size / 1024)} KB)
              </p>
            )}
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          </div>
          <TextField label="Link Video (Opsional)" onChange={(videoUrl) => setDraft((current) => ({ ...current, videoUrl }))} value={draft.videoUrl} />
        </FormPanel>
      )}
    </CrudSection>
  )
}
