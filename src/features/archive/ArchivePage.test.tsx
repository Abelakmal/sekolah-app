import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { initialState } from '../../core/data/seed'
import { ArchivePage } from './ArchivePage'
import { ArchiveDetail } from './ArchiveDetail'

function setup() {
  const state = structuredClone(initialState)
  const topic = state.topics.find((item) => item.teacherId === state.activeTeacherId)!
  state.drafts = [{
    id: 'test-draft', teacherId: state.activeTeacherId, topicId: topic.id, title: 'Arsip uji',
    status: 'Draft', version: 1, changeNotes: '', storage: 'supabase',
    objectiveIds: [], materialIds: [], activityIds: [], assessmentIds: [],
    createdAt: '2026-09-30T00:00:00Z', updatedAt: '2026-09-30T00:00:00Z',
  }]
  return { state, topic, draft: state.drafts[0] }
}

test('archive list has filters and compact actions, not inline editor forms', () => {
  const { state } = setup()
  const html = renderToStaticMarkup(<ArchivePage state={state} setState={() => {}} setActiveView={() => {}} />)
  expect(html).toContain('Arsip Administrasi')
  expect(html).toContain('Buat Dokumen')
  expect(html).toContain('Filter tahun ajaran')
  expect(html).toContain('Filter kelas')
  expect(html).not.toContain('Filter status')
  expect(html).toContain('Salin Arsip')
  expect(html).not.toContain('Catatan Perubahan')
  expect(html).not.toContain('<textarea')
  expect(html).not.toContain('Impor Arsip Lokal')
})

test('archive detail contains preview, completeness and explicit metadata save', () => {
  const { state, topic, draft } = setup()
  const html = renderToStaticMarkup(<ArchiveDetail state={state} draft={draft} topic={topic} onBack={() => {}} onUpdate={() => {}} onDownload={() => {}} />)
  for (const text of ['Kembali ke Arsip', 'Preview Dokumen', 'Kelengkapan', 'Catatan Perubahan', 'Simpan Perubahan']) expect(html).toContain(text)
  expect(html).not.toContain('Status Dokumen')
})
