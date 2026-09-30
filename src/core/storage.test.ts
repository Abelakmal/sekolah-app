import { expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import { initialState } from './data/seed'
import { appStorageKey, loadState, normalizeState, saveState } from './storage'

test('archive records are excluded from browser storage and old local backups are removed', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const browser = new Window()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser })
  try {
    const state = structuredClone(initialState)
    state.academicYearPreferences = { [state.activeTeacherId]: '2026/2027' }
    state.drafts = [{
      id: 'local-archive', teacherId: state.activeTeacherId, title: 'Local', topicId: state.topics[0].id,
      status: 'Draft', version: 1, changeNotes: '', objectiveIds: [], materialIds: [], activityIds: [], assessmentIds: [], createdAt: '', updatedAt: '',
    }]
    browser.localStorage.setItem(appStorageKey, JSON.stringify(state))
    browser.localStorage.setItem('administrasiGuru.manualBackup.v1', JSON.stringify({ state }))
    const loaded = loadState()
    expect(loaded.drafts).toEqual([])
    expect(JSON.parse(browser.localStorage.getItem(appStorageKey)!)).not.toHaveProperty('drafts')
    expect(browser.localStorage.getItem('administrasiGuru.manualBackup.v1')).toBeNull()
    expect(loaded.academicYearPreferences).toEqual(state.academicYearPreferences)
    saveState(state)
    expect(JSON.parse(browser.localStorage.getItem(appStorageKey)!)).not.toHaveProperty('drafts')
    expect(normalizeState(state).drafts).toEqual([])
    expect(state.drafts).toHaveLength(1)
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
