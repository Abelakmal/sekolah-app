import { className } from '../../core/utils'
import type { AdministrationDraft, AppState, LearningTopic } from '../../core/types'

export function DraftSummary({
  compact,
  selected,
  state,
  topic,
}: {
  compact?: boolean
  selected: Pick<AdministrationDraft, 'objectiveIds' | 'materialIds' | 'activityIds' | 'assessmentIds'>
  state: AppState
  topic: LearningTopic
}) {
  const groups = [
    { label: 'Tujuan', values: state.objectives.filter((item) => selected.objectiveIds.includes(item.id)).map((item) => item.description) },
    { label: 'Materi', values: state.materials.filter((item) => selected.materialIds.includes(item.id)).map((item) => item.title) },
    { label: 'Aktivitas', values: state.activities.filter((item) => selected.activityIds.includes(item.id)).map((item) => item.name) },
    { label: 'Asesmen', values: state.assessments.filter((item) => selected.assessmentIds.includes(item.id)).map((item) => `${item.type}: ${item.description}`) },
  ]

  return (
    <div className={className('grid gap-3', compact ? 'mt-4' : '')}>
      {!compact && (
        <div className="rounded-md bg-blue-50 p-4">
          <p className="font-semibold">Administrasi {topic.title}</p>
          <p className="text-sm text-slate-600">Kelas {topic.classGrade} | PJOK</p>
        </div>
      )}
      {groups.map((group) => (
        <div className="rounded-md border border-slate-200 p-3" key={group.label}>
          <p className="text-sm font-semibold">{group.label}</p>
          <ul className="mt-2 grid gap-1 text-sm text-slate-600">
            {group.values.length > 0 ? group.values.map((value) => <li key={value}>- {value}</li>) : <li>Belum dipilih</li>}
          </ul>
        </div>
      ))}
    </div>
  )
}
