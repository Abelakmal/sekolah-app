import type { AppState, LearningTopic, ModuleAssessments } from './types'

export const fallbackModuleAssessments: ModuleAssessments = {
  diagnosticAssessment: '',
  formativeAssessment: '',
  summativeAssessment: '',
  individualRubricObjective: '',
  individualRubricTiming: '',
  individualScoreScale: '',
  practiceTask: '',
  practiceTotalScore: 0,
  practiceCriteria: '',
  groupRubric: [],
  individualRubric: [],
  attitudeScores: [],
  knowledgeScores: [],
  practiceScores: [],
}

export function getModuleAssessments(state: AppState, topic: LearningTopic): ModuleAssessments {
  return {
    ...fallbackModuleAssessments,
    ...state.moduleAssessments[topic.id],
    groupRubric: state.moduleAssessments[topic.id]?.groupRubric ?? [],
    individualRubric: state.moduleAssessments[topic.id]?.individualRubric ?? [],
    attitudeScores: state.moduleAssessments[topic.id]?.attitudeScores ?? [],
    knowledgeScores: state.moduleAssessments[topic.id]?.knowledgeScores ?? [],
    practiceScores: state.moduleAssessments[topic.id]?.practiceScores ?? [],
  }
}

export function isModuleAssessmentsComplete(assessments: ModuleAssessments) {
  return Boolean(
    assessments.diagnosticAssessment &&
      assessments.formativeAssessment &&
      assessments.summativeAssessment &&
      assessments.individualRubricObjective &&
      assessments.individualRubricTiming &&
      assessments.individualScoreScale &&
      assessments.practiceTask &&
      assessments.practiceTotalScore > 0 &&
      assessments.practiceCriteria &&
      assessments.groupRubric.length > 0 &&
      assessments.individualRubric.length > 0 &&
      assessments.attitudeScores.length > 0 &&
      assessments.knowledgeScores.length > 0 &&
      assessments.practiceScores.length > 0,
  )
}
