import type { AppState } from './types'

export function getCurrentAcademicYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric' }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')!.value)
  const month = Number(parts.find((part) => part.type === 'month')!.value)
  const start = month >= 7 ? year : year - 1
  return `${start}/${start + 1}`
}

export function isAcademicYear(value?: string) {
  if (!value || !/^\d{4}\/\d{4}$/.test(value)) return false
  const [start, end] = value.split('/').map(Number)
  return end === start + 1
}

export function getActiveAcademicYear(state: AppState, date = new Date()) {
  const preference = state.academicYearPreferences?.[state.activeTeacherId]
  return isAcademicYear(preference) ? preference! : getCurrentAcademicYear(date)
}

export function getAcademicYearOptions(state: AppState, date = new Date()) {
  const start = Number(getCurrentAcademicYear(date).split('/')[0])
  const options = new Set(Array.from({ length: 11 }, (_, index) => `${start - 5 + index}/${start - 4 + index}`))
  options.add(getActiveAcademicYear(state, date))
  for (const topic of state.topics.filter((item) => item.teacherId === state.activeTeacherId)) {
    const year = state.moduleInfo[topic.id]?.academicYear
    if (isAcademicYear(year)) options.add(year)
  }
  return [...options].sort().reverse()
}
