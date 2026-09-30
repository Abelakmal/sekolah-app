import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { initialState } from '../../core/data/seed'
import { BuilderPage } from './BuilderPage'

test('document builder immediately shows full preview and editing shortcuts without wizard steps', () => {
  const state = structuredClone(initialState)
  const topic = state.topics.find((item) => item.teacherId === state.activeTeacherId)!
  const html = renderToStaticMarkup(<BuilderPage selectedTopic={topic} state={state} setState={() => {}} onEditSection={() => {}} />)
  for (const text of ['Buat Dokumen', 'Preview Dokumen Lengkap', 'Kelengkapan Dokumen', 'Simpan ke Arsip', 'Download Word']) expect(html).toContain(text)
  expect(html.match(/Edit bagian<\/button>/g)).toHaveLength(5)
  expect(html).not.toContain('Selanjutnya')
  expect(html).not.toContain('Sebelumnya')
})
