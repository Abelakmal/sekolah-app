import { BookOpenCheck, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { getModuleCompletion } from '../../core/moduleCompletion'
import { className, componentCount } from '../../core/utils'
import type { AppState, LearningTopic } from '../../core/types'

export function TopicRow({
  onDelete,
  onEdit,
  onOpen,
  selected,
  state,
  topic,
}: {
  onDelete?: () => void
  onEdit?: () => void
  onOpen: () => void
  selected?: boolean
  state: AppState
  topic: LearningTopic
}) {
  const completion = getModuleCompletion(state, topic)

  return (
    <div
      className={className(
        'flex items-center gap-3 rounded-md border bg-white p-3',
        selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200',
      )}
    >
      <span className={className('grid size-8 shrink-0 place-items-center rounded-full text-white', topic.color)}>
        <BookOpenCheck size={16} />
      </span>
      <button className="min-w-0 flex-1 text-left" onClick={onOpen} type="button">
        <p className="break-words text-sm font-semibold">{topic.title}</p>
        <p className="text-xs text-slate-500">Kelas {topic.classGrade}</p>
      </button>
      <div className="hidden text-right sm:block">
        <p className="text-sm text-slate-500">{componentCount(state, topic.id)} Komponen</p>
        <p className={className('text-xs font-semibold', completion.progress === 100 ? 'text-emerald-700' : 'text-amber-700')}>
          {completion.progress}% Modul Ajar
        </p>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-1">
          {onEdit && (
            <button className="icon-button" onClick={onEdit} title="Edit" type="button">
              <Pencil size={15} />
            </button>
          )}
          {onDelete && (
            <button className="icon-button text-red-600" onClick={onDelete} title="Hapus" type="button">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      )}
      {!onEdit && <MoreVertical size={18} className="text-slate-400" />}
    </div>
  )
}
