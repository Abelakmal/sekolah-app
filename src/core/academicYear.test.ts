import { expect, test } from 'bun:test'
import { initialState } from './data/seed'
import { getActiveAcademicYear, getAcademicYearOptions, getCurrentAcademicYear, isAcademicYear } from './academicYear'
import { createModuleInfo } from './moduleInfo'
import { createDocumentSnapshot } from './documentSnapshot'

test('automatic year rolls over in July using Indonesian time, not January', () => {
  expect(getCurrentAcademicYear(new Date('2026-01-01T00:00:00Z'))).toBe('2025/2026')
  expect(getCurrentAcademicYear(new Date('2026-06-30T16:59:59Z'))).toBe('2025/2026')
  expect(getCurrentAcademicYear(new Date('2026-06-30T17:00:00Z'))).toBe('2026/2027')
  expect(getCurrentAcademicYear(new Date('2026-09-30T00:00:00Z'))).toBe('2026/2027')
})

test('teacher preference applies to new modules without changing old modules or archives', () => {
  const state = structuredClone(initialState)
  const topic = state.topics[0]
  const originalYear = state.moduleInfo[topic.id].academicYear
  const snapshot = createDocumentSnapshot(state, topic)
  state.academicYearPreferences = { [state.activeTeacherId]: '2028/2029' }
  expect(getActiveAcademicYear(state)).toBe('2028/2029')
  expect(createModuleInfo(topic, getActiveAcademicYear(state)).academicYear).toBe('2028/2029')
  expect(state.moduleInfo[topic.id].academicYear).toBe(originalYear)
  expect(snapshot.moduleData.moduleInfo?.academicYear).toBe(originalYear)
  expect(getAcademicYearOptions(state)).toContain('2028/2029')
  state.activeTeacherId = 'another-teacher'
  expect(getActiveAcademicYear(state, new Date('2026-09-30T00:00:00Z'))).toBe('2026/2027')
})

test('invalid saved year falls back to automatic default', () => {
  expect(isAcademicYear('2026/2026')).toBe(false)
  expect(isAcademicYear('2026/2028')).toBe(false)
  expect(isAcademicYear('2026/2027')).toBe(true)
  const state = { ...initialState, academicYearPreferences: { [initialState.activeTeacherId]: 'bad-year' } }
  expect(getActiveAcademicYear(state, new Date('2026-09-30T00:00:00Z'))).toBe('2026/2027')
})
