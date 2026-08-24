import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ClipboardCheck, Table2 } from 'lucide-react'
import { getModuleAssessments } from '../../../core/moduleAssessments'
import type { AppState, Assessment, AssessmentType, LearningTopic, ModuleAssessments, RubricRow, ScoreRow } from '../../../core/types'
import { createId } from '../../../core/utils'
import { NumberField, TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { confirmDelete } from '../../../shared/utils/confirmDelete'
import { CrudSection } from './CrudSection'

type AssessmentsTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

export function AssessmentsTab({ query, setState, state, topic }: AssessmentsTabProps) {
  const moduleAssessments = getModuleAssessments(state, topic)

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
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-rose-50 text-rose-700">
            <ClipboardCheck size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Asesmen Pembelajaran</h3>
            <p className="text-sm text-slate-500">Pisahkan asesmen diagnostik, formatif, dan sumatif sesuai format Modul Ajar.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextArea
            label="Asesmen Diagnostik"
            onChange={(diagnosticAssessment) => updateModuleAssessments({ diagnosticAssessment })}
            value={moduleAssessments.diagnosticAssessment}
          />
          <TextArea
            label="Asesmen Formatif"
            onChange={(formativeAssessment) => updateModuleAssessments({ formativeAssessment })}
            value={moduleAssessments.formativeAssessment}
          />
          <TextArea
            label="Asesmen Sumatif"
            onChange={(summativeAssessment) => updateModuleAssessments({ summativeAssessment })}
            value={moduleAssessments.summativeAssessment}
          />
        </div>
      </section>

      <RubricEditor
        onChange={(groupRubric) => updateModuleAssessments({ groupRubric })}
        rows={moduleAssessments.groupRubric}
        title="Rubrik Kelompok"
      />
      <RubricEditor
        onChange={(individualRubric) => updateModuleAssessments({ individualRubric })}
        rows={moduleAssessments.individualRubric}
        title="Rubrik Individu"
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Format Penilaian Individu dan Praktik</h3>
          <p className="text-sm text-slate-500">Data ini dipakai untuk membuat format penilaian siswa seperti lampiran PDF.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Tujuan Rubrik Individu"
            onChange={(individualRubricObjective) => updateModuleAssessments({ individualRubricObjective })}
            value={moduleAssessments.individualRubricObjective}
          />
          <TextArea
            label="Waktu Pelaksanaan Rubrik Individu"
            onChange={(individualRubricTiming) => updateModuleAssessments({ individualRubricTiming })}
            value={moduleAssessments.individualRubricTiming}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Skala Nilai Rubrik Individu"
              onChange={(individualScoreScale) => updateModuleAssessments({ individualScoreScale })}
              value={moduleAssessments.individualScoreScale}
            />
          </div>
          <TextArea label="Tugas Praktik" onChange={(practiceTask) => updateModuleAssessments({ practiceTask })} value={moduleAssessments.practiceTask} />
          <NumberField
            label="Total Skor Praktik"
            onChange={(practiceTotalScore) => updateModuleAssessments({ practiceTotalScore })}
            value={moduleAssessments.practiceTotalScore}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Kriteria Penilaian Praktik"
              onChange={(practiceCriteria) => updateModuleAssessments({ practiceCriteria })}
              value={moduleAssessments.practiceCriteria}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <ScoreEditor
          onChange={(attitudeScores) => updateModuleAssessments({ attitudeScores })}
          rows={moduleAssessments.attitudeScores}
          title="Penilaian Sikap"
        />
        <ScoreEditor
          onChange={(knowledgeScores) => updateModuleAssessments({ knowledgeScores })}
          rows={moduleAssessments.knowledgeScores}
          title="Penilaian Pengetahuan"
        />
        <ScoreEditor
          onChange={(practiceScores) => updateModuleAssessments({ practiceScores })}
          rows={moduleAssessments.practiceScores}
          title="Penilaian Praktik"
        />
      </div>

      <LegacyAssessments query={query} setState={setState} state={state} topic={topic} />
    </div>
  )
}

function RubricEditor({
  onChange,
  rows,
  title,
}: {
  onChange: (rows: RubricRow[]) => void
  rows: RubricRow[]
  title: string
}) {
  const [editing, setEditing] = useState<RubricRow | null>(null)
  const [draft, setDraft] = useState({
    aspect: '',
    excellent: '',
    good: '',
    fair: '',
    needsImprovement: '',
  })

  function reset() {
    setEditing(null)
    setDraft({ aspect: '', excellent: '', good: '', fair: '', needsImprovement: '' })
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
    <section className="rounded-lg border border-slate-200 bg-white p-5">
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
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500">
              <th className="border border-slate-200 p-3">Aspek</th>
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
                <td className="border border-slate-200 p-3 font-medium">{row.aspect}</td>
                <td className="border border-slate-200 p-3 text-slate-600">{row.excellent}</td>
                <td className="border border-slate-200 p-3 text-slate-600">{row.good}</td>
                <td className="border border-slate-200 p-3 text-slate-600">{row.fair}</td>
                <td className="border border-slate-200 p-3 text-slate-600">{row.needsImprovement}</td>
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

      {(editing || draft.aspect || draft.excellent || draft.good || draft.fair || draft.needsImprovement) && (
        <FormPanel title={editing ? `Edit ${title}` : `Tambah ${title}`} onCancel={reset} onSave={save}>
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
        </FormPanel>
      )}
    </section>
  )
}

function ScoreEditor({
  onChange,
  rows,
  title,
}: {
  onChange: (rows: ScoreRow[]) => void
  rows: ScoreRow[]
  title: string
}) {
  const [editing, setEditing] = useState<ScoreRow | null>(null)
  const [draft, setDraft] = useState({ aspect: '', maxScore: 4 })

  function reset() {
    setEditing(null)
    setDraft({ aspect: '', maxScore: 4 })
  }

  function save() {
    if (!draft.aspect.trim() || draft.maxScore <= 0) return
    if (editing) {
      onChange(rows.map((row) => (row.id === editing.id ? { ...row, ...draft } : row)))
    } else {
      onChange([{ id: createId('score'), ...draft }, ...rows])
    }
    reset()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {rows.map((row) => (
          <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3" key={row.id}>
            <div className="min-w-0">
              <p className="text-sm font-medium">{row.aspect}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Skor maksimum {row.maxScore}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(row)
                  setDraft({ aspect: row.aspect, maxScore: row.maxScore })
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete('Hapus format nilai ini?')) onChange(rows.filter((item) => item.id !== row.id))
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada format nilai.</div>}
      </div>

      {(editing || draft.aspect) && (
        <FormPanel title={editing ? `Edit ${title}` : `Tambah ${title}`} onCancel={reset} onSave={save}>
          <TextField label="Aspek" onChange={(aspect) => setDraft((current) => ({ ...current, aspect }))} value={draft.aspect} />
          <NumberField label="Skor Maksimum" onChange={(maxScore) => setDraft((current) => ({ ...current, maxScore }))} value={draft.maxScore} />
        </FormPanel>
      )}
    </section>
  )
}

function LegacyAssessments({ query, setState, state, topic }: AssessmentsTabProps) {
  const [editing, setEditing] = useState<Assessment | null>(null)
  const [draft, setDraft] = useState<{ type: AssessmentType; description: string }>({ type: 'Formatif', description: '' })
  const items = state.assessments
    .filter((item) => item.topicId === topic.id)
    .filter((item) => `${item.type} ${item.description}`.toLowerCase().includes(query.toLowerCase()))

  function save() {
    if (!draft.description.trim()) return
    if (editing) {
      setState((current) => ({
        ...current,
        assessments: current.assessments.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)),
      }))
    } else {
      setState((current) => ({
        ...current,
        assessments: [{ id: createId('assessment'), topicId: topic.id, ...draft }, ...current.assessments],
      }))
    }
    setEditing(null)
    setDraft({ type: 'Formatif', description: '' })
  }

  return (
    <CrudSection
      empty="Belum ada asesmen umum."
      items={items.map((item) => ({
        id: item.id,
        title: item.description,
        meta: item.type,
        onEdit: () => {
          setEditing(item)
          setDraft({ type: item.type, description: item.description })
        },
        onDelete: () => setState((current) => ({ ...current, assessments: current.assessments.filter((entry) => entry.id !== item.id) })),
      }))}
      onAdd={() => {
        setEditing(null)
        setDraft({ type: 'Formatif', description: '' })
      }}
      title="Asesmen Umum"
    >
      {(editing || draft.description) && (
        <FormPanel
          title={editing ? 'Edit Asesmen Umum' : 'Tambah Asesmen Umum'}
          onCancel={() => {
            setEditing(null)
            setDraft({ type: 'Formatif', description: '' })
          }}
          onSave={save}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis Asesmen</label>
            <select className="input" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as AssessmentType }))} value={draft.type}>
              <option>Diagnostik</option>
              <option>Formatif</option>
              <option>Sumatif</option>
            </select>
          </div>
          <TextArea label="Deskripsi" onChange={(description) => setDraft((current) => ({ ...current, description }))} value={draft.description} />
        </FormPanel>
      )}
    </CrudSection>
  )
}
