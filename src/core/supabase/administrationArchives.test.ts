import { expect, test } from 'bun:test'
import { initialState } from '../data/seed'
import type { AdministrationDraft } from '../types'
import { createDocumentSnapshot } from '../documentSnapshot'
import { archiveFromRow, archiveToRow, deleteAdministrationArchive, insertAdministrationArchive, loadAdministrationArchives, mergeAdministrationArchives, updateAdministrationArchive } from './administrationArchives'

function fixture(): AdministrationDraft {
  const state = structuredClone(initialState)
  const topic = state.topics[0]
  return {
    id: 'legacy-draft-id', teacherId: 'teacher-test', topicId: topic.id, title: 'Arsip uji',
    status: 'Draft', version: 1, changeNotes: 'Catatan', objectiveIds: ['obj'],
    materialIds: [], activityIds: [], assessmentIds: [],
    createdAt: '2026-09-30T00:00:00Z', updatedAt: '2026-09-30T00:00:00Z',
    snapshot: createDocumentSnapshot(state, topic),
  }
}

async function withFakeFetch(run: (requests: Array<{ url: URL; method: string; body?: Record<string, unknown>; headers: Headers }>) => Promise<void>, reply: (index: number) => { data: unknown; status?: number }) {
  const original = globalThis.fetch
  const requests: Array<{ url: URL; method: string; body?: Record<string, unknown>; headers: Headers }> = []
  const fake = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = new URL(String(input))
    if (!url.pathname.startsWith('/rest/v1/administration_archives')) throw new Error('Unexpected network request in test')
    requests.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined, headers: new Headers(init?.headers) })
    const response = reply(requests.length - 1)
    return new Response(JSON.stringify(response.data), { status: response.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  }
  globalThis.fetch = fake as typeof fetch
  try { await run(requests) } finally { globalThis.fetch = original }
}

test('row mapping preserves snapshot and legacy ID, without a status column', () => {
  const draft = fixture()
  const row = archiveToRow(draft)
  expect(row.snapshot).toEqual(draft.snapshot)
  expect(row.id).toBe(draft.id)
  expect(row).not.toHaveProperty('status')
  const restored = archiveFromRow(row)
  expect(restored.snapshot).toEqual(draft.snapshot)
  expect(restored.storage).toBe('supabase')
})

test('remote load is teacher-scoped and insert saves the full snapshot', async () => {
  const draft = fixture()
  const row = archiveToRow(draft)
  await withFakeFetch(async (requests) => {
    expect(await loadAdministrationArchives(draft.teacherId)).toHaveLength(1)
    expect(requests[0].url.searchParams.get('teacher_id')).toBe('eq.teacher-test')
    const saved = await insertAdministrationArchive(draft)
    expect(saved.storage).toBe('supabase')
    expect(requests[1].method).toBe('POST')
    expect(requests[1].body?.snapshot).toEqual(draft.snapshot)
  }, (index) => ({ data: index === 0 ? [row] : row }))
})

test('metadata update and deletion are scoped and do not rewrite snapshot', async () => {
  const draft = { ...fixture(), storage: 'supabase' as const }
  await withFakeFetch(async (requests) => {
    await updateAdministrationArchive(draft, { changeNotes: 'Baru' })
    expect(requests[0].method).toBe('PATCH')
    expect(requests[0].url.searchParams.get('teacher_id')).toBe('eq.teacher-test')
    expect(requests[0].body).not.toHaveProperty('snapshot')
    expect(requests[0].body?.change_notes).toBe('Baru')
    await deleteAdministrationArchive(draft)
    expect(requests[1].method).toBe('DELETE')
    expect(requests[1].url.searchParams.get('id')).toBe('eq.legacy-draft-id')
  }, (index) => ({ data: index === 0 ? archiveToRow(draft) : [{ id: draft.id }] }))
})

test('local-only archives cannot be updated through a fallback insert', async () => {
  await expect(updateAdministrationArchive(fixture(), { changeNotes: 'Baru' })).rejects.toThrow('belum berasal dari Supabase')
})

test('RLS and missing-table errors fail explicitly rather than reporting local success', async () => {
  await withFakeFetch(async () => {
    await expect(insertAdministrationArchive(fixture())).rejects.toThrow('row-level security')
  }, () => ({ data: { code: '42501', message: 'new row violates row-level security policy' }, status: 403 }))
  await withFakeFetch(async () => {
    await expect(loadAdministrationArchives('teacher-test')).rejects.toThrow('20260930_administration_archives.sql')
  }, () => ({ data: { code: 'PGRST205', message: 'missing table' }, status: 404 }))
})

test('remote list replaces current teacher memory and discards local-only records', () => {
  const draft = fixture()
  const remote = { ...draft, storage: 'supabase' as const, changeNotes: 'Remote terbaru' }
  const deleted = { ...remote, id: 'deleted-on-other-device' }
  const pending = { ...draft, id: 'local-only' }
  const other = { ...draft, id: 'other', teacherId: 'another-teacher' }
  const result = mergeAdministrationArchives([draft, deleted, pending, other], draft.teacherId, [remote])
  expect(result.map((item) => item.id).sort()).toEqual([draft.id, other.id].sort())
  expect(result.find((item) => item.id === draft.id)?.changeNotes).toBe('Remote terbaru')
})
