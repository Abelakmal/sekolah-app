import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Bold, Columns3, Highlighter, ImagePlus, Italic, Link, List, ListOrdered, Rows3, Table2, Trash2, Video } from 'lucide-react'
import { maxAttachmentBytes } from '../../core/utils'
import { supabase } from '../../core/supabase/client'

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function toEditorHtml(value: string) {
  if (/<[a-z][\s\S]*>/i.test(value)) return value
  if (!value.trim()) return ''

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

export function RichTextEditor({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef<Range | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.innerHTML !== toEditorHtml(value)) editor.innerHTML = toEditorHtml(value)
  }, [value])

  function emitChange() {
    onChange(editorRef.current?.innerHTML ?? '')
  }

  function rememberSelection() {
    const selection = window.getSelection()
    const editor = editorRef.current
    if (!selection?.rangeCount || !editor || !selection.anchorNode || !editor.contains(selection.anchorNode)) return
    selectionRef.current = selection.getRangeAt(0).cloneRange()
  }

  function focusEditor() {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    if (!selectionRef.current) return
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(selectionRef.current)
  }

  function command(name: string, commandValue?: string) {
    focusEditor()
    document.execCommand(name, false, commandValue)
    rememberSelection()
    emitChange()
  }

  function getCurrentCell() {
    focusEditor()
    const selection = window.getSelection()
    const node = selection?.anchorNode
    const element = node?.nodeType === Node.ELEMENT_NODE ? node as Element : node?.parentElement
    return element?.closest('td, th') as HTMLTableCellElement | null
  }

  function insertTable() {
    const rows = Number(window.prompt('Jumlah baris tabel', '3'))
    const columns = Number(window.prompt('Jumlah kolom tabel', '3'))
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1 || rows > 12 || columns > 8) return
    const header = Array.from({ length: columns }, (_, index) => `<th style="border:1px solid #94a3b8;padding:6px;background:#f1f5f9">Kolom ${index + 1}</th>`).join('')
    const body = Array.from({ length: Math.max(rows - 1, 0) }, () => `<tr>${Array.from({ length: columns }, () => '<td style="border:1px solid #94a3b8;padding:6px">&nbsp;</td>').join('')}</tr>`).join('')
    command('insertHTML', `<table style="border-collapse:collapse;width:100%"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><p><br></p>`)
  }

  function addTableRow() {
    const cell = getCurrentCell()
    const row = cell?.parentElement
    if (!cell || !row) return
    const nextRow = row.cloneNode(true) as HTMLTableRowElement
    nextRow.querySelectorAll('td, th').forEach((item) => { item.textContent = '' })
    row.insertAdjacentElement('afterend', nextRow)
    emitChange()
  }

  function addTableColumn() {
    const cell = getCurrentCell()
    const table = cell?.closest('table')
    if (!cell || !table) return
    const index = cell.cellIndex
    table.querySelectorAll('tr').forEach((row) => {
      const newCell = document.createElement(row.parentElement?.tagName === 'THEAD' ? 'th' : 'td')
      newCell.style.border = '1px solid #94a3b8'
      newCell.style.padding = '6px'
      newCell.innerHTML = '&nbsp;'
      row.insertBefore(newCell, row.children[index + 1] ?? null)
    })
    emitChange()
  }

  function deleteTableRow() {
    const cell = getCurrentCell()
    const row = cell?.parentElement
    const table = cell?.closest('table')
    if (!row || !table || table.querySelectorAll('tr').length <= 1) return
    row.remove()
    emitChange()
  }

  function deleteTableColumn() {
    const cell = getCurrentCell()
    const table = cell?.closest('table')
    if (!cell || !table || cell.parentElement?.children.length === 1) return
    const index = cell.cellIndex
    table.querySelectorAll('tr').forEach((row) => row.children[index]?.remove())
    emitChange()
  }

  function addLink() {
    const url = window.prompt('Masukkan tautan')
    if (url) command('createLink', url)
  }

  function addVideo() {
    const url = window.prompt('Masukkan tautan video YouTube')
    if (!url) return
    command('insertHTML', `<p><a href="${escapeHtml(url)}">Video pembelajaran: ${escapeHtml(url)}</a></p>`)
  }

  async function addImage(file?: File) {
    if (!file || !file.type.startsWith('image/') || file.size > maxAttachmentBytes) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      window.alert('Silakan masuk kembali sebelum mengunggah gambar.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/storage/images', {
      body: formData,
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'POST',
    })
    const payload = (await response.json()) as { error?: string; url?: string }
    if (!response.ok || !payload.url) {
      window.alert(payload.error ?? 'Gambar gagal diunggah.')
      return
    }

    command('insertImage', payload.url)
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <EditorButton label="Tebal" onClick={() => command('bold')}><Bold size={15} /></EditorButton>
          <EditorButton label="Miring" onClick={() => command('italic')}><Italic size={15} /></EditorButton>
          <EditorButton label="Subjudul" onClick={() => command('formatBlock', 'h3')}>H</EditorButton>
          <EditorButton label="Rata kiri" onClick={() => command('justifyLeft')}><AlignLeft size={15} /></EditorButton>
          <EditorButton label="Rata tengah" onClick={() => command('justifyCenter')}><AlignCenter size={15} /></EditorButton>
          <EditorButton label="Rata kanan" onClick={() => command('justifyRight')}><AlignRight size={15} /></EditorButton>
          <EditorButton label="Daftar poin" onClick={() => command('insertUnorderedList')}><List size={15} /></EditorButton>
          <EditorButton label="Daftar nomor" onClick={() => command('insertOrderedList')}><ListOrdered size={15} /></EditorButton>
          <ColorPicker icon={<Bold size={15} />} label="Warna teks" onChange={(color) => command('foreColor', color)} />
          <ColorPicker icon={<Highlighter size={15} />} label="Warna sorotan" onChange={(color) => command('hiliteColor', color)} />
          <EditorButton label="Sisipkan tabel" onClick={insertTable}><Table2 size={15} /></EditorButton>
          <EditorButton label="Tambah baris tabel" onClick={addTableRow}><Rows3 size={15} /></EditorButton>
          <EditorButton label="Tambah kolom tabel" onClick={addTableColumn}><Columns3 size={15} /></EditorButton>
          <EditorButton label="Hapus baris tabel" onClick={deleteTableRow}><Trash2 size={15} /></EditorButton>
          <EditorButton label="Hapus kolom tabel" onClick={deleteTableColumn}><Trash2 className="rotate-90" size={15} /></EditorButton>
          <EditorButton label="Tautan" onClick={addLink}><Link size={15} /></EditorButton>
          <EditorButton label="Video YouTube" onClick={addVideo}><Video size={15} /></EditorButton>
          <EditorButton label="Sisipkan gambar" onClick={() => imageInputRef.current?.click()}><ImagePlus size={15} /></EditorButton>
          <input accept="image/*" className="hidden" onChange={(event) => void addImage(event.target.files?.[0])} ref={imageInputRef} type="file" />
        </div>
        <div
          className="min-h-48 px-4 py-3 text-sm leading-6 text-slate-900 [&_a]:text-blue-700 [&_a]:underline [&_h3]:my-3 [&_h3]:font-bold [&_img]:my-3 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded [&_li]:ml-5 [&_ol]:my-2 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-400 [&_td]:p-2 [&_th]:border [&_th]:border-slate-400 [&_th]:bg-slate-100 [&_th]:p-2 [&_ul]:my-2"
          contentEditable
          data-placeholder="Tulis kegiatan, daftar langkah, sisipkan gambar atau video..."
          onInput={emitChange}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">Gambar maksimal 2 MB. Tabel dapat ditambah dari toolbar; letakkan kursor di dalam sel sebelum menambah atau menghapus baris/kolom.</p>
    </div>
  )
}

function EditorButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return <button className="icon-button size-8" onClick={onClick} onMouseDown={(event) => event.preventDefault()} title={label} type="button">{children}</button>
}

function ColorPicker({ icon, label, onChange }: { icon: ReactNode; label: string; onChange: (color: string) => void }) {
  return (
    <label className="relative grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700" title={label}>
      {icon}
      <select aria-label={label} className="absolute inset-0 cursor-pointer opacity-0" defaultValue="" onChange={(event) => { if (event.target.value) onChange(event.target.value); event.target.value = '' }} onMouseDown={(event) => event.stopPropagation()}>
        <option value="">{label}</option>
        <option value="#000000">Hitam</option>
        <option value="#001F5F">Biru tua</option>
        <option value="#00695C">Hijau tua</option>
        <option value="#991B1B">Merah marun</option>
        <option value="#FDE68A">Kuning muda</option>
        <option value="#BFDBFE">Biru muda</option>
      </select>
    </label>
  )
}
