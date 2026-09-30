import { expect, test } from 'bun:test'
import { initialState } from '../../core/data/seed'
import { createDocumentSnapshot } from '../../core/documentSnapshot'
import type { AdministrationDraft } from '../../core/types'
import { copyArchiveDraft, filterArchiveEntries, getArchiveEntries } from './archiveData'

function setup() {
  const state = structuredClone(initialState)
  const topic = state.topics.find((item) => item.teacherId === state.activeTeacherId)!
  state.moduleInfo[topic.id].academicYear = '2025/2026'
  const draft: AdministrationDraft = {
    id: 'archive-test', teacherId: state.activeTeacherId, topicId: topic.id,
    title: 'Modul bola voli', status: 'Final', version: 3, changeNotes: 'Catatan asli',
    objectiveIds: ['objective-test'], materialIds: [], activityIds: [], assessmentIds: [],
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    snapshot: createDocumentSnapshot(state, topic),
  }
  state.drafts = [draft, { ...draft, id: 'other-teacher', teacherId: 'another-teacher' }]
  return { state, topic, draft }
}

test('archive search and combined filters use archived year and only current teacher documents', () => {
  const { state, topic } = setup()
  state.moduleInfo[topic.id].academicYear = '2028/2029'
  const entries = getArchiveEntries(state)
  expect(entries).toHaveLength(1)
  expect(entries[0].year).toBe('2025/2026')
  expect(filterArchiveEntries(entries, { query: ' BOLA VOLI ', grade: String(topic.classGrade), year: '2025/2026' })).toHaveLength(1)
  expect(filterArchiveEntries(entries, { query: '', grade: '', year: '2028/2029' })).toHaveLength(0)
  expect(filterArchiveEntries(entries, { query: '', grade: '99', year: '' })).toHaveLength(0)
  state.topics = []
  expect(getArchiveEntries(state)[0].topic?.id).toBe(topic.id)
})

test('copy creates independent archive version one without mutating original', () => {
  const { draft } = setup()
  const copy = copyArchiveDraft(draft)
  expect(copy.id).not.toBe(draft.id)
  expect(copy.version).toBe(1)
  expect(copy.status).toBe('Draft')
  expect(copy.title).toBe('Salinan Modul bola voli')
  copy.objectiveIds.push('new-objective')
  copy.snapshot!.moduleData.moduleInfo!.academicYear = '2030/2031'
  expect(draft.objectiveIds).toEqual(['objective-test'])
  expect(draft.snapshot!.moduleData.moduleInfo!.academicYear).toBe('2025/2026')
  expect(draft.version).toBe(3)
})
