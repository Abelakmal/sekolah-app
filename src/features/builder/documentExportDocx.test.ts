import { afterAll, beforeAll, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import JSZip from 'jszip'
import { initialState } from '../../core/data/seed'
import { buildAdministrationDocumentDocxBlob } from './documentExportDocx'

const browser = new Window()
const originalParser = globalThis.DOMParser
const originalDocument = globalThis.document
const originalBitmap = globalThis.createImageBitmap
const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhU8AAAAASUVORK5CYII='), (char) => char.charCodeAt(0))

beforeAll(() => {
  Object.defineProperty(globalThis, 'DOMParser', { configurable: true, value: browser.DOMParser })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: browser.document })
  Object.defineProperty(globalThis, 'createImageBitmap', { configurable: true, value: async () => ({ width: 120, height: 80, close() {} }) })
  Object.defineProperty(browser.HTMLCanvasElement.prototype, 'getContext', { configurable: true, value: () => ({ drawImage() {} }) })
  Object.defineProperty(browser.HTMLCanvasElement.prototype, 'toBlob', { configurable: true, value: (callback: (blob: Blob) => void) => callback(new Blob([png], { type: 'image/png' })) })
})

afterAll(() => {
  Object.defineProperty(globalThis, 'DOMParser', { configurable: true, value: originalParser })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument })
  Object.defineProperty(globalThis, 'createImageBitmap', { configurable: true, value: originalBitmap })
})

test('DOCX includes rich images, tables, lists, rubric data and every template section', async () => {
  const state = structuredClone(initialState)
  const topic = state.topics[0]
  const imageUrl = `data:image/png;base64,${btoa(String.fromCharCode(...png))}`
  state.moduleActivities[topic.id].core = { title: 'Inti', durationMinutes: 50, steps: `<h3>Heading kegiatan uji</h3><ul><li>Langkah pertama uji</li><li><b>Langkah kedua uji</b></li></ul><table><tr><td>Sel tabel kegiatan uji</td></tr></table><p><img src="${imageUrl}" /></p>` }
  state.moduleAppendices[topic.id].learningMedia = `<p><img src="${imageUrl}" /></p>`
  state.moduleAppendices[topic.id].assessmentInstruments = '<table><tr style="background-color:#ff0000"><td>Merah dari baris</td><td style="background:rgb(0, 255, 0)">Hijau dari sel</td></tr><tr><td bgcolor="#0000ff">Biru dari Word</td></tr></table>'
  state.moduleAppendices[topic.id].readingMaterials = `<h3>Sejarah Singkat Bola Voli uji</h3><p>Isi bahan bacaan panjang harus tetap diekspor.</p><p><img src="${imageUrl}" /></p>`
  state.moduleAppendices[topic.id].readingSections = [{ id: 'reading-extra-test', title: 'Pengertian pjok tambahan', content: 'Isi subbagian bacaan tambahan uji.' }]
  state.moduleAssessments[topic.id].groupRubric = [{ id: 'test', aspect: 'Rubrik kelompok uji', excellent: 'Unggul uji', good: 'Baik uji', fair: 'Cukup uji', needsImprovement: 'Latihan uji' }]
  const selected = { objectiveIds: state.objectives.filter((item) => item.topicId === topic.id).map((item) => item.id), materialIds: [], activityIds: [], assessmentIds: [] }
  const blob = await buildAdministrationDocumentDocxBlob({ selected, state, topic })
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const xml = await zip.file('word/document.xml')!.async('string')
  for (const value of ['Heading kegiatan uji', 'Langkah pertama uji', 'Sel tabel kegiatan uji', 'Rubrik kelompok uji', 'Unggul uji', 'Asesmen Diagnostik Non-Kognitif', 'Persiapan Pembelajaran', 'Skala Nilai Rubrik Individu', 'Refleksi Diri Siswa', 'Media Pembelajaran', 'Mengetahui / Mengesahkan', 'Sejarah Singkat Bola Voli uji', 'Isi bahan bacaan panjang harus tetap diekspor.', 'Pengertian pjok tambahan', 'Isi subbagian bacaan tambahan uji.']) expect(xml).toContain(value)
  expect(xml).toContain('<w:drawing>')
  expect(xml).toContain('<w:numPr>')
  // Header backgrounds belong to the whole cell, including its side margins.
  const shadedCells = xml.match(/<w:tcPr>.*?<\/w:tcPr>/g)!
  expect(shadedCells.some((cell) => cell.includes('w:fill="DFEBEB"'))).toBe(true)
  expect(shadedCells.some((cell) => cell.includes('w:fill="001F5F"'))).toBe(true)
  for (const fill of ['ff0000', '00ff00', '0000ff']) {
    expect(shadedCells.some((cell) => cell.toLowerCase().includes(`w:fill="${fill}"`))).toBe(true)
  }
  const numberingXml = await zip.file('word/numbering.xml')!.async('string')
  const bulletLevels = numberingXml.match(/<w:lvl\b[^>]*>.*?<\/w:lvl>/g)!.filter((level) => level.includes('<w:lvlText w:val="•"'))
  expect(bulletLevels).toHaveLength(9)
  for (const level of bulletLevels) {
    expect(level).toContain('w:ascii="Arial"')
    expect(level).toContain('<w:sz w:val="16"')
    expect(level).toContain('<w:b w:val="false"')
  }
  expect(Object.keys(zip.files).filter((name) => name.startsWith('word/media/') && !zip.files[name].dir).length).toBeGreaterThan(0)
  expect(xml.match(/<w:tbl>/g)!.length).toBeGreaterThan(12)
})
