import type { AdministrationDraft, AppState, LearningTopic } from './types'
import { applyTopicModuleData, getTopicModuleData } from './supabase/topicModuleData'

export function createDocumentSnapshot(state: AppState, topic: LearningTopic) {
  return structuredClone({ topic, teacher: state.teacher, school: state.school, moduleData: getTopicModuleData(state, topic.id) })
}

export function getDraftDocumentInput(state: AppState, topic: LearningTopic, draft: AdministrationDraft) {
  const snapshot = draft.snapshot
  if (!snapshot) return { state, topic, selected: draft }
  const restored = applyTopicModuleData(state, snapshot.topic.id, snapshot.moduleData)
  return {
    state: { ...restored, teacher: snapshot.teacher, school: snapshot.school },
    topic: snapshot.topic,
    selected: draft,
  }
}
