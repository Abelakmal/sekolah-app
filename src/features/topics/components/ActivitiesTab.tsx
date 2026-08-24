import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Clock3, ListChecks } from 'lucide-react'
import { getModuleActivities } from '../../../core/moduleActivities'
import type { AppState, LearningActivity, LearningActivityPhase, LearningTopic, ModuleLearningActivities } from '../../../core/types'
import { createId } from '../../../core/utils'
import { NumberField, TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { CrudSection } from './CrudSection'

type ActivitiesTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

type PhaseKey = 'opening' | 'core' | 'closing'

const phaseLabels: Record<PhaseKey, string> = {
  opening: 'Pendahuluan',
  core: 'Inti',
  closing: 'Penutup',
}

export function ActivitiesTab({ query, setState, state, topic }: ActivitiesTabProps) {
  const moduleActivities = getModuleActivities(state, topic)

  function updateModuleActivities(patch: Partial<ModuleLearningActivities>) {
    setState((current) => ({
      ...current,
      moduleActivities: {
        ...current.moduleActivities,
        [topic.id]: {
          ...moduleActivities,
          ...patch,
        },
      },
    }))
  }

  function updatePhase(phase: PhaseKey, patch: Partial<LearningActivityPhase>) {
    updateModuleActivities({
      [phase]: {
        ...moduleActivities[phase],
        ...patch,
      },
    })
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-amber-50 text-amber-700">
            <ListChecks size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Urutan Kegiatan Pembelajaran</h3>
            <p className="text-sm text-slate-500">Susun alur kegiatan seperti format Modul Ajar: pendahuluan, inti, penutup.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {(Object.keys(phaseLabels) as PhaseKey[]).map((phase) => (
            <PhaseEditor
              key={phase}
              label={phaseLabels[phase]}
              onChange={(patch) => updatePhase(phase, patch)}
              value={moduleActivities[phase]}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Diferensiasi Pembelajaran</h3>
          <p className="text-sm text-slate-500">Bagian ini dipakai untuk menyesuaikan konten, proses, dan lingkungan belajar.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextArea
            label="Diferensiasi Konten"
            onChange={(contentDifferentiation) => updateModuleActivities({ contentDifferentiation })}
            value={moduleActivities.contentDifferentiation}
          />
          <TextArea
            label="Diferensiasi Proses"
            onChange={(processDifferentiation) => updateModuleActivities({ processDifferentiation })}
            value={moduleActivities.processDifferentiation}
          />
          <TextArea
            label="Diferensiasi Lingkungan"
            onChange={(environmentDifferentiation) => updateModuleActivities({ environmentDifferentiation })}
            value={moduleActivities.environmentDifferentiation}
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold">Refleksi</h3>
          <p className="text-sm text-slate-500">Catatan refleksi guru dan peserta didik untuk bagian akhir dokumen.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Refleksi Guru"
            onChange={(teacherReflection) => updateModuleActivities({ teacherReflection })}
            value={moduleActivities.teacherReflection}
          />
          <TextArea
            label="Refleksi Peserta Didik"
            onChange={(studentReflection) => updateModuleActivities({ studentReflection })}
            value={moduleActivities.studentReflection}
          />
        </div>
      </section>

      <AdditionalActivities query={query} setState={setState} state={state} topic={topic} />
    </div>
  )
}

function PhaseEditor({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (patch: Partial<LearningActivityPhase>) => void
  value: LearningActivityPhase
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="text-slate-500" size={16} />
        <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <TextField label="Judul Bagian" onChange={(title) => onChange({ title })} value={value.title} />
        <NumberField label="Durasi (menit)" onChange={(durationMinutes) => onChange({ durationMinutes })} value={value.durationMinutes} />
        <div className="md:col-span-2">
          <TextArea label="Langkah Pembelajaran" onChange={(steps) => onChange({ steps })} value={value.steps} />
        </div>
      </div>
    </div>
  )
}

function AdditionalActivities({ query, setState, state, topic }: ActivitiesTabProps) {
  const [editing, setEditing] = useState<LearningActivity | null>(null)
  const [draft, setDraft] = useState({ name: '', steps: '', durationMinutes: 35 })
  const items = state.activities
    .filter((item) => item.topicId === topic.id)
    .filter((item) => `${item.name} ${item.steps}`.toLowerCase().includes(query.toLowerCase()))

  function save() {
    if (!draft.name.trim() || !draft.steps.trim() || draft.durationMinutes <= 0) return
    if (editing) {
      setState((current) => ({
        ...current,
        activities: current.activities.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)),
      }))
    } else {
      setState((current) => ({
        ...current,
        activities: [{ id: createId('activity'), topicId: topic.id, ...draft }, ...current.activities],
      }))
    }
    setEditing(null)
    setDraft({ name: '', steps: '', durationMinutes: 35 })
  }

  return (
    <CrudSection
      empty="Belum ada aktivitas tambahan."
      items={items.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${item.durationMinutes} menit`,
        description: item.steps,
        onEdit: () => {
          setEditing(item)
          setDraft({ name: item.name, steps: item.steps, durationMinutes: item.durationMinutes })
        },
        onDelete: () => setState((current) => ({ ...current, activities: current.activities.filter((entry) => entry.id !== item.id) })),
      }))}
      onAdd={() => {
        setEditing(null)
        setDraft({ name: '', steps: '', durationMinutes: 35 })
      }}
      title="Aktivitas Tambahan"
    >
      {(editing || draft.name || draft.steps) && (
        <FormPanel
          title={editing ? 'Edit Aktivitas Tambahan' : 'Tambah Aktivitas Tambahan'}
          onCancel={() => {
            setEditing(null)
            setDraft({ name: '', steps: '', durationMinutes: 35 })
          }}
          onSave={save}
        >
          <TextField label="Nama Aktivitas" onChange={(name) => setDraft((current) => ({ ...current, name }))} value={draft.name} />
          <TextArea label="Langkah Pembelajaran" onChange={(steps) => setDraft((current) => ({ ...current, steps }))} value={draft.steps} />
          <NumberField label="Durasi (menit)" onChange={(durationMinutes) => setDraft((current) => ({ ...current, durationMinutes }))} value={draft.durationMinutes} />
        </FormPanel>
      )}
    </CrudSection>
  )
}
