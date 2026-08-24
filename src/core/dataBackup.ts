import { appBackupStorageKey, normalizeState } from './storage'
import type { AppState } from './types'

const backupAppId = 'administrasiGuru'
const backupVersion = 1

export type DataBackup = {
  app: typeof backupAppId
  exportedAt: string
  state: AppState
  version: typeof backupVersion
}

export type BackupMeta = {
  exportedAt: string
  topicCount: number
  draftCount: number
}

export type ImportResult =
  | {
      ok: true
      exportedAt?: string
      state: AppState
    }
  | {
      error: string
      ok: false
    }

export function createDataBackup(state: AppState): DataBackup {
  return {
    app: backupAppId,
    exportedAt: new Date().toISOString(),
    state,
    version: backupVersion,
  }
}

export function downloadDataBackup(state: AppState) {
  const backup = createDataBackup(state)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `backup-administrasi-guru-${toFileDate(backup.exportedAt)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function saveManualBackup(state: AppState): BackupMeta {
  const backup = createDataBackup(state)
  window.localStorage.setItem(appBackupStorageKey, JSON.stringify(backup))
  return getBackupMeta(backup)
}

export function loadManualBackupMeta(): BackupMeta | null {
  const stored = window.localStorage.getItem(appBackupStorageKey)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    const backup = parseBackupCandidate(parsed)
    return backup ? getBackupMeta(backup) : null
  } catch {
    return null
  }
}

export function restoreManualBackup(): ImportResult {
  const stored = window.localStorage.getItem(appBackupStorageKey)
  if (!stored) {
    return { error: 'Backup lokal belum tersedia.', ok: false }
  }

  return parseImportedBackup(stored)
}

export function parseImportedBackup(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text)
    const backup = parseBackupCandidate(parsed)

    if (backup) {
      return {
        exportedAt: backup.exportedAt,
        ok: true,
        state: normalizeState(backup.state),
      }
    }

    if (isAppStateLike(parsed)) {
      return {
        ok: true,
        state: normalizeState(parsed as Partial<AppState>),
      }
    }

    return { error: 'File JSON tidak cocok dengan struktur data Administrasi Guru.', ok: false }
  } catch {
    return { error: 'File tidak bisa dibaca sebagai JSON valid.', ok: false }
  }
}

function parseBackupCandidate(value: unknown): DataBackup | null {
  if (!isRecord(value)) return null
  if (value.app !== backupAppId || value.version !== backupVersion || typeof value.exportedAt !== 'string') return null
  if (!isAppStateLike(value.state)) return null
  return value as DataBackup
}

function isAppStateLike(value: unknown): value is Partial<AppState> {
  if (!isRecord(value)) return false

  return (
    isRecord(value.teacher) &&
    isRecord(value.school) &&
    Array.isArray(value.students) &&
    Array.isArray(value.topics) &&
    Array.isArray(value.objectives) &&
    Array.isArray(value.materials) &&
    Array.isArray(value.activities) &&
    Array.isArray(value.assessments) &&
    Array.isArray(value.drafts) &&
    isRecord(value.moduleInfo) &&
    isRecord(value.moduleCompetencies) &&
    isRecord(value.moduleActivities) &&
    isRecord(value.moduleAssessments) &&
    isRecord(value.moduleWorksheets) &&
    isRecord(value.moduleAppendices)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getBackupMeta(backup: DataBackup): BackupMeta {
  return {
    draftCount: backup.state.drafts.length,
    exportedAt: backup.exportedAt,
    topicCount: backup.state.topics.length,
  }
}

function toFileDate(value: string) {
  return value.replace(/[:.]/g, '-')
}
