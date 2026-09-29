import { useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { ClipboardCheck, Table2 } from 'lucide-react'
import { getModuleAssessments } from '../../../core/moduleAssessments'
import type { AppState, LearningTopic, ModuleAssessments, RubricRow } from '../../../core/types'
import { createId } from '../../../core/utils'
import { NumberField, TextArea, TextField } from '../../../shared/components/FormControls'
import { RichTextEditor } from '../../../shared/components/RichTextEditor'
import { confirmDelete } from '../../../shared/utils/confirmDelete'
import { AutoSavedNotice, BankSection } from './BankSection'

type AssessmentsTabProps = {
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

export function AssessmentsTab({ setState, state, topic }: AssessmentsTabProps) {
  const moduleAssessments = getModuleAssessments(state, topic)
  const assessmentComplete = Boolean(
    moduleAssessments.diagnosticAssessment && moduleAssessments.formativeAssessment && moduleAssessments.summativeAssessment,
  )
  const individualFormatComplete = Boolean(
    moduleAssessments.individualRubricObjective &&
      moduleAssessments.individualRubricTiming &&
      moduleAssessments.individualScoreScale &&
      moduleAssessments.practiceObjective &&
      moduleAssessments.practiceTiming &&
      moduleAssessments.practiceTask &&
      moduleAssessments.practiceCriteria,
  )

  function updateModuleAssessments(patch: Partial<ModuleAssessments>) {
    setState((current) => ({
      ...current,
      moduleAssessments: {
        ...current.moduleAssessments,
        [topic.id]: {
          ...moduleAssessments,
          ...patch,
        },
      },
    }))
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-rose-50 text-rose-700">
            <ClipboardCheck size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Asesmen Pembelajaran</h3>
            <p className="text-sm text-slate-500">Pisahkan asesmen diagnostik, formatif, dan sumatif sesuai format Modul Ajar.</p>
          </div>
          </div>
          <AutoSavedNotice />
        </div>
        <BankSection defaultOpen isComplete={assessmentComplete} title="Diagnostik, Formatif, dan Sumatif">
          <div className="grid gap-6">
            <RichTextEditor
              label="Asesmen Diagnostik"
              onChange={(diagnosticAssessment) => updateModuleAssessments({ diagnosticAssessment })}
              value={moduleAssessments.diagnosticAssessment}
            />
            <RichTextEditor
              label="Asesmen Formatif"
              onChange={(formativeAssessment) => updateModuleAssessments({ formativeAssessment })}
              value={moduleAssessments.formativeAssessment}
            />
            <RichTextEditor
              label="Asesmen Sumatif"
              onChange={(summativeAssessment) => updateModuleAssessments({ summativeAssessment })}
              value={moduleAssessments.summativeAssessment}
            />
          </div>
        </BankSection>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <BankSection isComplete={moduleAssessments.groupRubric.length > 0 && Boolean(moduleAssessments.groupRubricContext)} title="Rubrik Penilaian Kelompok">
          <div className="mb-5 grid gap-5">
            <RichTextEditor
              label="Konteks atau Instruksi Rubrik Kelompok"
              onChange={(groupRubricContext) => updateModuleAssessments({ groupRubricContext })}
              value={moduleAssessments.groupRubricContext}
            />
          </div>
          <RubricEditor
            embedded
            onChange={(groupRubric) => updateModuleAssessments({ groupRubric })}
            rows={moduleAssessments.groupRubric}
            title="Aspek Penilaian Kelompok"
          />
          <div className="mt-5">
            <RichTextEditor label="Catatan Guru" onChange={(teacherNotes) => updateModuleAssessments({ teacherNotes })} value={moduleAssessments.teacherNotes} />
          </div>
        </BankSection>
      </section>
      <RubricEditor
        onChange={(individualRubric) => updateModuleAssessments({ individualRubric })}
        rows={moduleAssessments.individualRubric}
        title="Rubrik Individu"
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <BankSection isComplete={individualFormatComplete} title="Rubrik Individu dan Penilaian Praktik Sumatif">
          <div className="mb-4 flex justify-end">
            <AutoSavedNotice />
          </div>
          <div className="grid gap-6">
            <RichTextEditor
              label="Tujuan Rubrik Individu"
              onChange={(individualRubricObjective) => updateModuleAssessments({ individualRubricObjective })}
              value={moduleAssessments.individualRubricObjective}
            />
            <RichTextEditor
              label="Waktu Pelaksanaan Rubrik Individu"
              onChange={(individualRubricTiming) => updateModuleAssessments({ individualRubricTiming })}
              value={moduleAssessments.individualRubricTiming}
            />
            <RichTextEditor
              label="Skala Nilai Rubrik Individu"
              onChange={(individualScoreScale) => updateModuleAssessments({ individualScoreScale })}
              value={moduleAssessments.individualScoreScale}
            />
            <RichTextEditor label="Tujuan Penilaian Praktik" onChange={(practiceObjective) => updateModuleAssessments({ practiceObjective })} value={moduleAssessments.practiceObjective} />
            <RichTextEditor label="Waktu Pelaksanaan Praktik" onChange={(practiceTiming) => updateModuleAssessments({ practiceTiming })} value={moduleAssessments.practiceTiming} />
            <RichTextEditor label="Instrumen atau Tugas Praktik" onChange={(practiceTask) => updateModuleAssessments({ practiceTask })} value={moduleAssessments.practiceTask} />
            <NumberField
              label="Total Skor Praktik"
              onChange={(practiceTotalScore) => updateModuleAssessments({ practiceTotalScore })}
              value={moduleAssessments.practiceTotalScore}
            />
            <RichTextEditor
              label="Kriteria Penilaian Praktik"
              onChange={(practiceCriteria) => updateModuleAssessments({ practiceCriteria })}
              value={moduleAssessments.practiceCriteria}
            />
            <RichTextEditor
              label="Refleksi Diri Siswa (Sumatif)"
              onChange={(studentSelfReflection) => updateModuleAssessments({ studentSelfReflection })}
              value={moduleAssessments.studentSelfReflection}
            />
          </div>
        </BankSection>
      </section>

    </div>
  )
}

function RubricEditor({
  embedded,
  onChange,
  rows,
  title,
}: {
  onChange: (rows: RubricRow[]) => void
  rows: RubricRow[]
  title: string
  embedded?: boolean
}) {
  const [editing, setEditing] = useState<RubricRow | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draft, setDraft] = useState({
    aspect: '',
    excellent: '',
    good: '',
    fair: '',
    needsImprovement: '',
  })

  function reset() {
    setEditing(null)
    setIsFormOpen(false)
    setDraft({ aspect: '', excellent: '', good: '', fair: '', needsImprovement: '' })
  }

  function openNewForm() {
    setEditing(null)
    setDraft({ aspect: '', excellent: '', good: '', fair: '', needsImprovement: '' })
    setIsFormOpen(true)
  }

  function save() {
    if (!draft.aspect.trim()) return
    if (editing) {
      onChange(rows.map((row) => (row.id === editing.id ? { ...row, ...draft } : row)))
    } else {
      onChange([{ id: createId('rubric'), ...draft }, ...rows])
    }
    reset()
  }

  return (
    <section className={embedded ? '' : 'rounded-lg border border-slate-200 bg-white p-5'}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700">
            <Table2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-slate-500">Aspek penilaian dengan empat tingkat capaian.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openNewForm} type="button">
          Tambah
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500">
              <th className="w-[18%] border border-slate-200 p-3">Aspek</th>
              <th className="border border-slate-200 p-3">Baik Sekali</th>
              <th className="border border-slate-200 p-3">Baik</th>
              <th className="border border-slate-200 p-3">Cukup</th>
              <th className="border border-slate-200 p-3">Perlu Perbaikan</th>
              <th className="w-28 border border-slate-200 p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="break-words border border-slate-200 p-3 font-medium">{row.aspect}</td>
                <td className="break-words border border-slate-200 p-3 text-slate-600">{row.excellent}</td>
                <td className="break-words border border-slate-200 p-3 text-slate-600">{row.good}</td>
                <td className="break-words border border-slate-200 p-3 text-slate-600">{row.fair}</td>
                <td className="break-words border border-slate-200 p-3 text-slate-600">{row.needsImprovement}</td>
                <td className="border border-slate-200 p-3">
                  <div className="flex gap-2">
                    <button
                      className="text-sm font-semibold text-blue-700"
                      onClick={() => {
                        setEditing(row)
                        setDraft({
                          aspect: row.aspect,
                          excellent: row.excellent,
                          good: row.good,
                          fair: row.fair,
                          needsImprovement: row.needsImprovement,
                        })
                        setIsFormOpen(true)
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-sm font-semibold text-red-700"
                      onClick={() => {
                        if (confirmDelete('Hapus baris rubrik ini?')) onChange(rows.filter((item) => item.id !== row.id))
                      }}
                      type="button"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="border border-dashed border-slate-300 p-4 text-center text-slate-500" colSpan={6}>
                  Belum ada rubrik.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <AssessmentFormModal title={editing ? `Edit ${title}` : `Tambah ${title}`} onCancel={reset} onSave={save}>
          <TextField label="Aspek Penilaian" onChange={(aspect) => setDraft((current) => ({ ...current, aspect }))} value={draft.aspect} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextArea label="Baik Sekali" onChange={(excellent) => setDraft((current) => ({ ...current, excellent }))} value={draft.excellent} />
            <TextArea label="Baik" onChange={(good) => setDraft((current) => ({ ...current, good }))} value={draft.good} />
            <TextArea label="Cukup" onChange={(fair) => setDraft((current) => ({ ...current, fair }))} value={draft.fair} />
            <TextArea
              label="Perlu Perbaikan"
              onChange={(needsImprovement) => setDraft((current) => ({ ...current, needsImprovement }))}
              value={draft.needsImprovement}
            />
          </div>
        </AssessmentFormModal>
      )}
    </section>
  )
}

function AssessmentFormModal({
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6" onMouseDown={onCancel}>
      <section
        aria-labelledby="assessment-form-title"
        aria-modal="true"
        className="max-h-full w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h4 className="text-lg font-semibold text-slate-900" id="assessment-form-title">
            {title}
          </h4>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onCancel} type="button">
              Batal
            </button>
            <button className="btn-primary" onClick={onSave} type="button">
              Simpan
            </button>
          </div>
        </div>
        <div className="grid gap-5">{children}</div>
      </section>
    </div>
  )
}
