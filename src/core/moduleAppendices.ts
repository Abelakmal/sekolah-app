import type { AppState, LearningTopic, ModuleAppendices } from './types'

export const fallbackModuleAppendices: ModuleAppendices = {
  readingMaterials: '',
  readingSections: [],
  customSections: [],
  learningMedia: '',
  assessmentInstruments: '',
  glossary: [],
  files: [],
}

export function getModuleAppendices(state: AppState, topic: LearningTopic): ModuleAppendices {
  return {
    ...fallbackModuleAppendices,
    ...state.moduleAppendices[topic.id],
    readingSections: state.moduleAppendices[topic.id]?.readingSections ?? [],
    customSections: state.moduleAppendices[topic.id]?.customSections ?? [],
    glossary: state.moduleAppendices[topic.id]?.glossary ?? [],
    files: state.moduleAppendices[topic.id]?.files ?? [],
  }
}

export function isModuleAppendicesComplete(appendices: ModuleAppendices) {
  return Boolean(
    (appendices.readingMaterials || appendices.readingSections.length > 0) &&
      appendices.learningMedia &&
      appendices.assessmentInstruments &&
      appendices.glossary.length > 0,
  )
}
