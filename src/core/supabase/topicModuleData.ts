import type {
  AppState,
  Assessment,
  LearningActivity,
  LearningMaterial,
  LearningObjective,
  ModuleAppendices,
  ModuleAssessments,
  ModuleCompetency,
  ModuleInfo,
  ModuleLearningActivities,
  Worksheet,
} from '../types'

export type TopicModuleData = {
  activities: LearningActivity[]
  assessments: Assessment[]
  materials: LearningMaterial[]
  moduleActivities: ModuleLearningActivities | null
  moduleAppendices: ModuleAppendices | null
  moduleAssessments: ModuleAssessments | null
  moduleCompetencies: ModuleCompetency | null
  moduleInfo: ModuleInfo | null
  moduleWorksheets: Worksheet[] | null
  objectives: LearningObjective[]
}

export type SupabaseTopicModuleData = {
  data: TopicModuleData
  topic_id: string
}

export function getTopicModuleData(state: AppState, topicId: string): TopicModuleData {
  return {
    activities: state.activities.filter((item) => item.topicId === topicId),
    assessments: state.assessments.filter((item) => item.topicId === topicId),
    materials: state.materials.filter((item) => item.topicId === topicId),
    moduleActivities: state.moduleActivities[topicId] ?? null,
    moduleAppendices: state.moduleAppendices[topicId] ?? null,
    moduleAssessments: state.moduleAssessments[topicId] ?? null,
    moduleCompetencies: state.moduleCompetencies[topicId] ?? null,
    moduleInfo: state.moduleInfo[topicId] ?? null,
    moduleWorksheets: state.moduleWorksheets[topicId] ?? null,
    objectives: state.objectives.filter((item) => item.topicId === topicId),
  }
}

export function applyTopicModuleData(
  state: AppState,
  topicId: string,
  data: TopicModuleData,
): AppState {
  return {
    ...state,
    activities: replaceTopicItems(state.activities, topicId, data.activities),
    assessments: replaceTopicItems(state.assessments, topicId, data.assessments),
    materials: replaceTopicItems(state.materials, topicId, data.materials),
    moduleActivities: replaceTopicRecord(state.moduleActivities, topicId, data.moduleActivities),
    moduleAppendices: replaceTopicRecord(state.moduleAppendices, topicId, data.moduleAppendices),
    moduleAssessments: replaceTopicRecord(state.moduleAssessments, topicId, data.moduleAssessments),
    moduleCompetencies: replaceTopicRecord(state.moduleCompetencies, topicId, data.moduleCompetencies),
    moduleInfo: replaceTopicRecord(state.moduleInfo, topicId, data.moduleInfo),
    moduleWorksheets: replaceTopicRecord(state.moduleWorksheets, topicId, data.moduleWorksheets),
    objectives: replaceTopicItems(state.objectives, topicId, data.objectives),
  }
}

function replaceTopicItems<T extends { topicId: string }>(
  current: T[],
  topicId: string,
  replacement: T[],
) {
  return [...current.filter((item) => item.topicId !== topicId), ...replacement]
}

function replaceTopicRecord<T>(
  current: Record<string, T>,
  topicId: string,
  replacement: T | null,
) {
  if (replacement === null) {
    return Object.fromEntries(
      Object.entries(current).filter(([id]) => id !== topicId),
    ) as Record<string, T>
  }

  return { ...current, [topicId]: replacement }
}
