import { expect, test } from 'bun:test'
import { initialState } from './data/seed'
import type { AdministrationDraft } from './types'
import { createDocumentSnapshot, getDraftDocumentInput } from './documentSnapshot'

test('archived content stays unchanged after edits to topic, teacher and appendices', () => {
  const state = structuredClone(initialState)
  const topic = state.topics[0]
  state.moduleAppendices[topic.id].readingMaterials = 'Bacaan saat disimpan'
  const snapshot = createDocumentSnapshot(state, topic)
  const draft: AdministrationDraft = {
    id: 'test', teacherId: state.activeTeacherId, title: 'Arsip', topicId: topic.id,
    status: 'Draft', version: 1, changeNotes: '', createdAt: '', updatedAt: '',
    objectiveIds: [], materialIds: [], activityIds: [], assessmentIds: [], snapshot,
  }
  const originalName = state.teacher.name
  const originalTitle = topic.title
  state.teacher.name = 'Nama berubah'
  topic.title = 'Topik berubah'
  state.moduleAppendices[topic.id].readingMaterials = 'Bacaan sudah diedit'
  const input = getDraftDocumentInput(state, topic, draft)
  expect(input.state.teacher.name).toBe(originalName)
  expect(input.topic.title).toBe(originalTitle)
  expect(input.state.moduleAppendices[topic.id].readingMaterials).toBe('Bacaan saat disimpan')
  expect(state.moduleAppendices[topic.id].readingMaterials).toBe('Bacaan sudah diedit')
  const legacy = getDraftDocumentInput(state, topic, { ...draft, snapshot: undefined })
  expect(legacy.state).toBe(state)
  expect(legacy.topic).toBe(topic)
})
