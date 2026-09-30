import type { AdministrationDraft, AppState } from '../../core/types'
import { createId } from '../../core/utils'

export function getArchiveEntries(state: AppState) {
  return state.drafts.filter((draft) => draft.teacherId === state.activeTeacherId).map((draft) => {
    const topic = draft.snapshot?.topic ?? state.topics.find((item) => item.id === draft.topicId)
    const year = (draft.snapshot ? draft.snapshot.moduleData.moduleInfo : state.moduleInfo[draft.topicId])?.academicYear || ''
    return { draft, topic, year }
  }).sort((a, b) => b.draft.createdAt.localeCompare(a.draft.createdAt))
}

export function filterArchiveEntries(entries: ReturnType<typeof getArchiveEntries>, filters: { query: string; grade: string; year: string }) {
  const query = filters.query.trim().toLocaleLowerCase('id-ID')
  return entries.filter(({ draft, topic, year }) =>
    (!filters.grade || String(topic?.classGrade) === filters.grade) &&
    (!filters.year || (year || 'unset') === filters.year) &&
    `${draft.title} ${topic?.title ?? ''} ${year}`.toLocaleLowerCase('id-ID').includes(query),
  )
}

export function copyArchiveDraft(draft: AdministrationDraft): AdministrationDraft {
  const now = new Date().toISOString()
  return {
    ...structuredClone(draft), storage: undefined, id: createId('draft'), title: `Salinan ${draft.title}`,
    status: 'Draft', version: 1, changeNotes: `Salinan arsip ${draft.title} versi ${draft.version}.`,
    createdAt: now, updatedAt: now, lastDownloadedAt: undefined,
  }
}
