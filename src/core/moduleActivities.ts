import type { AppState, LearningTopic, ModuleLearningActivities } from './types'

export const fallbackModuleActivities: ModuleLearningActivities = {
  opening: {
    title: 'Pendahuluan',
    steps: '',
    durationMinutes: 10,
  },
  core: {
    title: 'Inti',
    steps: '',
    durationMinutes: 50,
  },
  closing: {
    title: 'Penutup',
    steps: '',
    durationMinutes: 10,
  },
  contentDifferentiation: '',
  processDifferentiation: '',
  environmentDifferentiation: '',
  teacherReflection: '',
  studentReflection: '',
}

export function getModuleActivities(state: AppState, topic: LearningTopic): ModuleLearningActivities {
  return {
    ...fallbackModuleActivities,
    ...state.moduleActivities[topic.id],
    opening: {
      ...fallbackModuleActivities.opening,
      ...state.moduleActivities[topic.id]?.opening,
    },
    core: {
      ...fallbackModuleActivities.core,
      ...state.moduleActivities[topic.id]?.core,
    },
    closing: {
      ...fallbackModuleActivities.closing,
      ...state.moduleActivities[topic.id]?.closing,
    },
  }
}

export function isModuleActivitiesComplete(activities: ModuleLearningActivities) {
  return Boolean(
      activities.opening.steps &&
      activities.opening.durationMinutes > 0 &&
      activities.core.steps &&
      activities.core.durationMinutes > 0 &&
      activities.closing.steps &&
      activities.closing.durationMinutes > 0,
  )
}

export function mergeLegacyDifferentiationIntoCore(activities: ModuleLearningActivities) {
  const additions = [
    ['Diferensiasi Konten', activities.contentDifferentiation],
    ['Diferensiasi Proses', activities.processDifferentiation],
    ['Diferensiasi Lingkungan', activities.environmentDifferentiation],
  ].filter(([, content]) => Boolean(content))

  if (additions.length === 0) return activities.core.steps

  const format = (content: string) => {
    if (/<[a-z][\s\S]*>/i.test(content)) return content
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${line}</p>`)
      .join('')
  }

  return `${activities.core.steps}${additions.map(([title, content]) => `<h3>${title}</h3>${format(content)}`).join('')}`
}
