import type { AppState, LearningTopic, Worksheet } from './types'

export function getModuleWorksheets(state: AppState, topic: LearningTopic): Worksheet[] {
  return state.moduleWorksheets[topic.id] ?? []
}

export function isModuleWorksheetsComplete(worksheets: Worksheet[]) {
  return (
    worksheets.some((item) => item.type === 'Berkelompok' && item.title && item.questions) &&
    worksheets.some((item) => item.type === 'Individu' && item.title && item.questions)
  )
}
