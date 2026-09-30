import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, ImageRun,
  LevelFormat, Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType,
  TableRow, TextRun, WidthType,
} from 'docx'
import type { IRunOptions, ParagraphChild } from 'docx'
import type { AppState, LearningTopic } from '../../core/types'
import { buildAdministrationDocumentHtml } from './documentExport'
import type { BuilderSelection } from './documentExport'

type ExportInput = { selected: BuilderSelection; state: AppState; topic: LearningTopic }
type Block = Paragraph | Table
const line = { style: BorderStyle.SINGLE, size: 6, color: '000000' }
const noLine = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const borders = { top: line, bottom: line, left: line, right: line }
const headingFills = new WeakMap<Paragraph, string>()

function color(value: string) {
  const named: Record<string, string> = { red: 'FF0000', white: 'FFFFFF', black: '000000', blue: '0000FF', green: '008000', yellow: 'FFFF00', gray: '808080', silver: 'C0C0C0', orange: 'FFA500', purple: '800080', navy: '000080' }
  if (named[value.toLowerCase()]) return named[value.toLowerCase()]
  const hex = value.match(/^#([\da-f]{6}|[\da-f]{3})$/i)?.[1]
  if (hex) return hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
  const rgb = value.match(/rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/)
  return rgb ? rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, '0')).join('') : undefined
}

function tableCellFill(cell: HTMLTableCellElement) {
  // Word paste can put the fill on a cell, row, row group or whole table.
  let element: HTMLElement | null = cell
  while (element) {
    const fill = color(element.style.backgroundColor || element.getAttribute('bgcolor') || '')
    if (fill) return fill
    if (element.tagName === 'TABLE') break
    element = element.parentElement
  }
  return cell.tagName === 'TH' ? 'F3F4F6' : undefined
}

async function imageRun(element: Element): Promise<ImageRun> {
  const url = element.getAttribute('src')
  if (!url) throw new Error('Ada gambar tanpa alamat sumber di dalam modul.')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Gambar tidak dapat dimuat (${response.status}): ${element.getAttribute('alt') || url}`)
  const bitmap = await createImageBitmap(await response.blob())
  const isLogo = element.classList.contains('cover-logo')
  const scale = Math.min((isLogo ? 280 : 620) / bitmap.width, (isLogo ? 280 : 435) / bitmap.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Browser tidak dapat menyiapkan gambar untuk Word.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!png) throw new Error('Gambar gagal dikonversi ke PNG untuk Word.')
  return new ImageRun({ type: 'png', data: new Uint8Array(await png.arrayBuffer()), transformation: { width: canvas.width, height: canvas.height } })
}

async function inline(node: Node, inherited: IRunOptions = {}): Promise<ParagraphChild[]> {
  if (node.nodeType === 3) return [new TextRun({ font: 'Times New Roman', size: 22, ...inherited, text: node.textContent || '' })]
  if (node.nodeType !== 1) return []
  const element = node as HTMLElement
  const tag = element.tagName.toLowerCase()
  if (['script', 'style'].includes(tag)) return []
  if (tag === 'img') return [await imageRun(element)]
  if (tag === 'br') return [new TextRun({ break: 1 })]
  const style = element.style
  const options: IRunOptions = {
    ...inherited,
    ...(tag === 'b' || tag === 'strong' || style.fontWeight === 'bold' ? { bold: true } : {}),
    ...(tag === 'i' || tag === 'em' || style.fontStyle === 'italic' ? { italics: true } : {}),
    ...(tag === 'u' ? { underline: {} } : {}),
    ...(color(style.color) ? { color: color(style.color) } : {}),
    ...(color(style.backgroundColor) ? { shading: { fill: color(style.backgroundColor) } } : {}),
  }
  const children = (await Promise.all(Array.from(element.childNodes).map((child) => inline(child, options)))).flat()
  if (tag === 'a' && /^https?:/i.test(element.getAttribute('href') || '')) return [new ExternalHyperlink({ link: element.getAttribute('href')!, children })]
  return children
}

async function paragraph(element: HTMLElement, list?: { ordered: boolean; level: number; reference: string }): Promise<Paragraph> {
  const heading = /^h[1-6]$/i.test(element.tagName)
  const title = element.classList.contains('sheet-title')
  const subtitle = element.classList.contains('sheet-subtitle')
  const cover = element.closest('.cover') !== null
  const pale = title
  const fill = title ? (element.classList.contains('competency') ? 'B1E3D4' : 'DFEBEB') : subtitle ? '001F5F' : undefined
  const align = element.style.textAlign || element.getAttribute('align') || (cover || element.classList.contains('center') ? 'center' : 'left')
  const alignment = align === 'center' ? AlignmentType.CENTER : align === 'right' ? AlignmentType.RIGHT : align === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT
  const runs = await inline(element, { bold: heading || title || subtitle || cover, color: fill ? (pale ? '000000' : 'FFFFFF') : undefined, size: cover ? 28 : 22 })
  const result = new Paragraph({
    children: runs, alignment,
    ...(list ? { style: 'ModuleList' } : {}),
    ...(fill ? { shading: { type: ShadingType.CLEAR, fill } } : {}),
    ...(list ? { numbering: { reference: list.ordered ? list.reference : 'module-bullets', level: list.level } } : {}),
    spacing: { before: heading ? 100 : 0, after: cover ? (element.querySelector('img') ? 800 : element.classList.contains('cover-material') || element.classList.contains('cover-author') ? 700 : 40) : 80 },
    keepNext: heading || title || subtitle,
    pageBreakBefore: element.classList.contains('page-break'),
  })
  if (fill) headingFills.set(result, fill)
  return result
}

async function blocks(nodes: Node[], numbering: string[], level = 0): Promise<Block[]> {
  const output: Block[] = []
  for (const node of nodes) {
    if (node.nodeType === 3) {
      if (node.textContent?.trim()) output.push(new Paragraph({ children: [new TextRun({ text: node.textContent, font: 'Times New Roman', size: 22 })] }))
      continue
    }
    if (node.nodeType !== 1) continue
    const element = node as HTMLElement
    const tag = element.tagName.toLowerCase()
    if (['script', 'style', 'colgroup', 'col'].includes(tag)) continue
    if (tag === 'table') {
      output.push(await table(element as HTMLTableElement, numbering))
    } else if (tag === 'ul' || tag === 'ol') {
      const reference = `list-${numbering.length}`
      if (tag === 'ol') numbering.push(reference)
      for (const item of Array.from(element.children)) {
        if (item.tagName !== 'LI') continue
        const copy = item.cloneNode(true) as HTMLElement
        copy.querySelectorAll('ul,ol').forEach((nested) => nested.remove())
        output.push(await paragraph(copy, { ordered: tag === 'ol', level: Math.min(level, 8), reference }))
        output.push(...await blocks(Array.from(item.children).filter((child) => ['UL', 'OL'].includes(child.tagName)), numbering, level + 1))
      }
    } else if (element.classList.contains('sheet-title') || element.classList.contains('sheet-subtitle') || ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption'].includes(tag)) {
      output.push(await paragraph(element))
    } else if (tag === 'img') {
      output.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [await imageRun(element)] }))
    } else if (tag === 'iframe') {
      const url = element.getAttribute('src') || ''
      output.push(new Paragraph({ children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: `Video pembelajaran: ${url}`, style: 'Hyperlink' })] })] }))
    } else {
      const hasBlocks = Array.from(element.children).some((child) => /^(DIV|P|H[1-6]|TABLE|UL|OL|SECTION|FIGURE)$/.test(child.tagName))
      if (hasBlocks || tag === 'section' || tag === 'figure') output.push(...await blocks(Array.from(element.childNodes), numbering, level))
      else output.push(await paragraph(element))
      if (element.classList.contains('cover')) output.push(new Paragraph({ pageBreakBefore: true }))
    }
  }
  return output
}

async function table(element: HTMLTableElement, numbering: string[]): Promise<Table> {
  const framed = element.classList.contains('module-sheet')
  if (framed) {
    const cell = element.rows[0]?.cells[0]
    const content = cell ? await blocks(Array.from(cell.childNodes), numbering) : [new Paragraph('')]
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows: content.map((block, index) => new TableRow({ children: [new TableCell({
      borders: { left: line, right: line, top: index === 0 ? line : noLine, bottom: index === content.length - 1 ? line : noLine },
      margins: { top: 0, bottom: 0, left: 100, right: 100 },
      ...(block instanceof Paragraph && headingFills.has(block) ? { shading: { type: ShadingType.CLEAR, fill: headingFills.get(block)! } } : {}),
      children: block instanceof Table ? [block, new Paragraph({ spacing: { after: 0 }, children: [] })] : [block],
    })] })) })
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders,
    rows: await Promise.all(Array.from(element.rows).map(async (row) => new TableRow({
      tableHeader: row.parentElement?.tagName === 'THEAD',
      children: await Promise.all(Array.from(row.cells).map(async (cell) => {
        const content = await blocks(Array.from(cell.childNodes), numbering)
        const fill = tableCellFill(cell)
        return new TableCell({ borders, columnSpan: cell.colSpan > 1 ? cell.colSpan : undefined, rowSpan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          ...(fill ? { shading: { type: ShadingType.CLEAR, fill } } : {}),
          children: [...content, ...(content.length === 0 || content[content.length - 1] instanceof Table ? [new Paragraph('')] : [])],
        })
      })),
    }))),
  })
}

export async function buildAdministrationDocumentDocxBlob(input: ExportInput) {
  const html = buildAdministrationDocumentHtml(input)
  const body = new DOMParser().parseFromString(html, 'text/html').body
  const numbering: string[] = []
  const children = await blocks(Array.from(body.childNodes), numbering)
  const document = new Document({
    styles: {
      default: { document: { run: { font: 'Times New Roman', size: 22, bold: false }, paragraph: { spacing: { after: 80 } } } },
      paragraphStyles: [{ id: 'ModuleList', name: 'Daftar Modul', basedOn: 'Normal', run: { font: 'Times New Roman', size: 22, bold: false }, paragraph: { spacing: { after: 80 } } }],
    },
    numbering: { config: [
      { reference: 'module-bullets', levels: Array.from({ length: 9 }, (_, level) => ({
        level, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { run: { font: 'Arial', size: 16, bold: false }, paragraph: { indent: { left: 360 * (level + 1), hanging: 180 } } },
      })) },
      ...numbering.map((reference) => ({ reference, levels: Array.from({ length: 9 }, (_, level) => ({ level, format: LevelFormat.DECIMAL, text: `%${level + 1}.`, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 * (level + 1), hanging: 180 } } } })) })),
    ] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 794, right: 794 } } }, children }],
  })
  return Packer.toBlob(document)
}

export async function downloadAdministrationDocumentDocx(input: ExportInput, preparedBlob?: Blob) {
  const blob = preparedBlob ?? await buildAdministrationDocumentDocxBlob(input)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `administrasi-${input.topic.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.docx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
