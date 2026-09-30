import type { AdministrationDraft } from '../types'
import { supabase } from './client'

export type SupabaseAdministrationArchive = {
  id: string
  teacher_id: string
  topic_id: string
  title: string
  version: number
  change_notes: string
  objective_ids: string[]
  material_ids: string[]
  activity_ids: string[]
  assessment_ids: string[]
  snapshot: AdministrationDraft['snapshot'] | null
  created_at: string
  updated_at: string
  last_downloaded_at: string | null
}

export function archiveToRow(draft: AdministrationDraft): SupabaseAdministrationArchive {
  return {
    id: draft.id, teacher_id: draft.teacherId, topic_id: draft.topicId, title: draft.title,
    version: draft.version, change_notes: draft.changeNotes,
    objective_ids: draft.objectiveIds, material_ids: draft.materialIds,
    activity_ids: draft.activityIds, assessment_ids: draft.assessmentIds,
    snapshot: draft.snapshot ?? null, created_at: draft.createdAt, updated_at: draft.updatedAt,
    last_downloaded_at: draft.lastDownloadedAt ?? null,
  }
}

export function archiveFromRow(row: SupabaseAdministrationArchive): AdministrationDraft {
  return {
    id: row.id, teacherId: row.teacher_id, topicId: row.topic_id, title: row.title,
    status: 'Draft', version: row.version, changeNotes: row.change_notes,
    objectiveIds: row.objective_ids, materialIds: row.material_ids,
    activityIds: row.activity_ids, assessmentIds: row.assessment_ids,
    snapshot: row.snapshot ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at,
    lastDownloadedAt: row.last_downloaded_at ?? undefined, storage: 'supabase',
  }
}

function archiveError(error: { message: string; code?: string }) {
  if (['42P01', 'PGRST205'].includes(error.code ?? '')) return new Error('Tabel Arsip belum tersedia. Jalankan supabase/migrations/20260930_administration_archives.sql di SQL Editor Supabase, lalu muat ulang.')
  return new Error(`Arsip Supabase: ${error.message}`)
}

export async function loadAdministrationArchives(teacherId: string) {
  const { data, error } = await supabase.from('administration_archives').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }).returns<SupabaseAdministrationArchive[]>()
  if (error) throw archiveError(error)
  return (data ?? []).map(archiveFromRow)
}

export async function insertAdministrationArchive(draft: AdministrationDraft) {
  const { data, error } = await supabase.from('administration_archives').insert(archiveToRow(draft)).select('*').single<SupabaseAdministrationArchive>()
  if (error) throw archiveError(error)
  return archiveFromRow(data)
}

export async function updateAdministrationArchive(draft: AdministrationDraft, patch: Partial<Pick<AdministrationDraft, 'changeNotes' | 'lastDownloadedAt'>>) {
  const updatedAt = new Date().toISOString()
  // Existing snapshots are immutable: only metadata is updated.
  if (draft.storage !== 'supabase') throw new Error('Arsip ini belum berasal dari Supabase. Muat ulang daftar arsip.')
  const { data, error } = await supabase.from('administration_archives').update({
    updated_at: updatedAt,
    ...(patch.changeNotes !== undefined ? { change_notes: patch.changeNotes } : {}),
    ...(patch.lastDownloadedAt !== undefined ? { last_downloaded_at: patch.lastDownloadedAt } : {}),
  }).eq('id', draft.id).eq('teacher_id', draft.teacherId).select('*').single<SupabaseAdministrationArchive>()
  if (error) throw archiveError(error)
  return archiveFromRow(data)
}

export async function deleteAdministrationArchive(draft: AdministrationDraft) {
  const { data, error } = await supabase.from('administration_archives').delete().eq('id', draft.id).eq('teacher_id', draft.teacherId).select('id')
  if (error) throw archiveError(error)
  if (!data?.length && draft.storage === 'supabase') throw new Error('Arsip tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya. Muat ulang daftar.')
}

export function mergeAdministrationArchives(current: AdministrationDraft[], teacherId: string, remote: AdministrationDraft[]) {
  return [
    ...current.filter((draft) => draft.teacherId !== teacherId),
    ...remote,
  ]
}
