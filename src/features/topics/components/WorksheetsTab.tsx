import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ClipboardList } from 'lucide-react'
import { getModuleWorksheets } from '../../../core/moduleWorksheets'
import type { AppState, LearningTopic, Worksheet, WorksheetType } from '../../../core/types'
import { createId } from '../../../core/utils'
import { TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { CrudSection } from './CrudSection'

type WorksheetsTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

export function WorksheetsTab({ query, setState, state, topic }: WorksheetsTabProps) {
  const worksheets = getModuleWorksheets(state, topic)
  const [editing, setEditing] = useState<Worksheet | null>(null)
  const [draft, setDraft] = useState<Omit<Worksheet, 'id'>>({
    type: 'Berkelompok',
    title: '',
    instructions: '',
    questions: '',
    answerArea: '',
    answerKey: '',
  })
  const items = worksheets.filter((item) =>
    `${item.type} ${item.title} ${item.instructions} ${item.questions} ${item.answerKey}`.toLowerCase().includes(query.toLowerCase()),
  )

  function setWorksheets(nextWorksheets: Worksheet[]) {
    setState((current) => ({
      ...current,
      moduleWorksheets: {
        ...current.moduleWorksheets,
        [topic.id]: nextWorksheets,
      },
    }))
  }

  function reset(type: WorksheetType = 'Berkelompok') {
    setEditing(null)
    setDraft({
      type,
      title: '',
      instructions: '',
      questions: '',
      answerArea: '',
      answerKey: '',
    })
  }

  function save() {
    if (!draft.title.trim() || !draft.questions.trim()) return
    if (editing) {
      setWorksheets(worksheets.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)))
    } else {
      setWorksheets([{ id: createId('worksheet'), ...draft }, ...worksheets])
    }
    reset()
  }

  return (
    <CrudSection
      empty="Belum ada LKPD."
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        meta: `LKPD ${item.type}`,
        description: item.questions,
        onEdit: () => {
          setEditing(item)
          setDraft({
            type: item.type,
            title: item.title,
            instructions: item.instructions,
            questions: item.questions,
            answerArea: item.answerArea,
            answerKey: item.answerKey,
          })
        },
        onDelete: () => setWorksheets(worksheets.filter((entry) => entry.id !== item.id)),
      }))}
      onAdd={() => reset('Berkelompok')}
      title="LKPD"
    >
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <QuickAddButton onClick={() => reset('Berkelompok')} text="Tambah LKPD Berkelompok" />
        <QuickAddButton onClick={() => reset('Individu')} text="Tambah LKPD Individu" />
      </div>

      {(editing || draft.title || draft.instructions || draft.questions || draft.answerArea || draft.answerKey) && (
        <FormPanel title={editing ? 'Edit LKPD' : 'Tambah LKPD'} onCancel={() => reset()} onSave={save}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis LKPD</label>
            <select className="input" onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as WorksheetType }))} value={draft.type}>
              <option>Berkelompok</option>
              <option>Individu</option>
            </select>
          </div>
          <TextField label="Judul LKPD" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
          <TextArea label="Petunjuk" onChange={(instructions) => setDraft((current) => ({ ...current, instructions }))} value={draft.instructions} />
          <TextArea label="Soal" onChange={(questions) => setDraft((current) => ({ ...current, questions }))} value={draft.questions} />
          <TextArea label="Area Jawaban" onChange={(answerArea) => setDraft((current) => ({ ...current, answerArea }))} value={draft.answerArea} />
          <TextArea label="Kunci Jawaban" onChange={(answerKey) => setDraft((current) => ({ ...current, answerKey }))} value={draft.answerKey} />
        </FormPanel>
      )}
    </CrudSection>
  )
}

function QuickAddButton({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button className="flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50" onClick={onClick} type="button">
      <ClipboardList size={16} />
      {text}
    </button>
  )
}
