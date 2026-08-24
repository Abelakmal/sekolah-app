import type { AppState, MaterialAttachment } from './types'

export const maxAttachmentBytes = 2 * 1024 * 1024

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function className(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function componentCount(state: AppState, topicId: string) {
  return (
    state.objectives.filter((item) => item.topicId === topicId).length +
    state.materials.filter((item) => item.topicId === topicId).length +
    (state.moduleActivities[topicId] ? 1 : 0) +
    state.activities.filter((item) => item.topicId === topicId).length +
    (state.moduleAssessments[topicId] ? 1 : 0) +
    state.assessments.filter((item) => item.topicId === topicId).length +
    (state.moduleWorksheets[topicId]?.length ?? 0) +
    (state.moduleAppendices[topicId] ? 1 : 0)
  )
}

export function readAttachment(file: File): Promise<MaterialAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: String(reader.result),
      })
    }
    reader.onerror = () => reject(new Error('Gagal membaca file lampiran.'))
    reader.readAsDataURL(file)
  })
}
