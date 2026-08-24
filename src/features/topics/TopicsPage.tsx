import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Plus } from 'lucide-react'
import type { AppState, ClassGrade, LearningTopic } from '../../core/types'
import { createId } from '../../core/utils'
import { EmptyState } from '../../shared/components/EmptyState'
import { FormPanel } from '../../shared/components/FormPanel'
import { SearchField, TextArea, TextField } from '../../shared/components/FormControls'
import { TopicRow } from '../../shared/components/TopicRow'
import { confirmDelete } from '../../shared/utils/confirmDelete'

const grades: ClassGrade[] = [1, 2, 3, 4, 5, 6]

export function TopicsPage({
  goToTopic,
  selectedGrade,
  setSelectedGrade,
  setState,
  state,
}: {
  goToTopic: (topic: LearningTopic) => void
  selectedGrade: ClassGrade
  setSelectedGrade: (grade: ClassGrade) => void
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<LearningTopic | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '' })
  const availableGrades = state.teacher.classes.length > 0 ? state.teacher.classes : grades
  const filtered = state.topics
    .filter((topic) => topic.teacherId === state.activeTeacherId && topic.classGrade === selectedGrade)
    .filter((topic) => `${topic.title} ${topic.description}`.toLowerCase().includes(query.toLowerCase()))

  function startEdit(topic?: LearningTopic) {
    setEditing(topic ?? null)
    setDraft(topic ? { title: topic.title, description: topic.description } : { title: '', description: '' })
  }

  function saveTopic() {
    if (!draft.title.trim()) return
    if (editing) {
      setState((current) => ({
        ...current,
        topics: current.topics.map((topic) =>
          topic.id === editing.id ? { ...topic, title: draft.title.trim(), description: draft.description.trim() } : topic,
        ),
      }))
    } else {
      const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500']
      setState((current) => ({
        ...current,
        topics: [
          {
            id: createId('topic'),
            teacherId: current.activeTeacherId,
            classGrade: selectedGrade,
            title: draft.title.trim(),
            description: draft.description.trim() || `Kelola komponen pembelajaran untuk ${draft.title.trim()}.`,
            color: colors[current.topics.length % colors.length],
          },
          ...current.topics,
        ],
      }))
    }
    setEditing(null)
    setDraft({ title: '', description: '' })
  }

  function deleteTopic(topicId: string) {
    if (!confirmDelete('Hapus Topik Pembelajaran dan seluruh komponen Modul Ajar di dalamnya?')) return
    setState((current) => ({
      ...current,
      moduleInfo: Object.fromEntries(Object.entries(current.moduleInfo).filter(([id]) => id !== topicId)),
      moduleCompetencies: Object.fromEntries(Object.entries(current.moduleCompetencies).filter(([id]) => id !== topicId)),
      moduleActivities: Object.fromEntries(Object.entries(current.moduleActivities).filter(([id]) => id !== topicId)),
      moduleAssessments: Object.fromEntries(Object.entries(current.moduleAssessments).filter(([id]) => id !== topicId)),
      moduleWorksheets: Object.fromEntries(Object.entries(current.moduleWorksheets).filter(([id]) => id !== topicId)),
      moduleAppendices: Object.fromEntries(Object.entries(current.moduleAppendices).filter(([id]) => id !== topicId)),
      topics: current.topics.filter((topic) => topic.id !== topicId),
      objectives: current.objectives.filter((item) => item.topicId !== topicId),
      materials: current.materials.filter((item) => item.topicId !== topicId),
      activities: current.activities.filter((item) => item.topicId !== topicId),
      assessments: current.assessments.filter((item) => item.topicId !== topicId),
      drafts: current.drafts.filter((draftItem) => draftItem.topicId !== topicId),
    }))
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Kelola Topik Pembelajaran</p>
            <h2 className="text-2xl font-semibold">Kelas {selectedGrade}</h2>
          </div>
          <button className="btn-primary" onClick={() => startEdit()} type="button">
            <Plus size={16} />
            Tambah Topik Pembelajaran
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
          <select
            className="input"
            onChange={(event) => setSelectedGrade(Number(event.target.value) as ClassGrade)}
            value={selectedGrade}
          >
            {availableGrades.map((grade) => (
              <option key={grade} value={grade}>
                Kelas {grade}
              </option>
            ))}
          </select>
          <SearchField onChange={setQuery} placeholder="Cari Topik Pembelajaran..." value={query} />
        </div>
        <div className="mt-5 grid gap-2">
          {filtered.map((topic) => (
            <TopicRow
              key={topic.id}
              onDelete={() => deleteTopic(topic.id)}
              onEdit={() => startEdit(topic)}
              onOpen={() => goToTopic(topic)}
              state={state}
              topic={topic}
            />
          ))}
          {filtered.length === 0 && <EmptyState text="Belum ada Topik Pembelajaran yang cocok dengan pencarian." title="Topik Pembelajaran kosong" />}
        </div>

        {(editing || draft.title || draft.description) && (
          <FormPanel
            title={editing ? 'Edit Topik Pembelajaran' : 'Tambah Topik Pembelajaran'}
            onCancel={() => {
              setEditing(null)
              setDraft({ title: '', description: '' })
            }}
            onSave={saveTopic}
          >
            <TextField label="Judul Topik Pembelajaran" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
            <TextArea label="Deskripsi" onChange={(description) => setDraft((current) => ({ ...current, description }))} value={draft.description} />
          </FormPanel>
        )}
      </section>
    </div>
  )
}
