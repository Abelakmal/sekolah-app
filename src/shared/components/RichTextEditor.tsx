import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Bold, ImagePlus, Italic, Link, List, ListOrdered, Video } from 'lucide-react'
import { maxAttachmentBytes, readAttachment } from '../../core/utils'

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

  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.innerHTML !== toEditorHtml(value)) editor.innerHTML = toEditorHtml(value)
  }, [value])

  function emitChange() {
    onChange(editorRef.current?.innerHTML ?? '')
  }

  function command(name: string, commandValue?: string) {
    editorRef.current?.focus()
    document.execCommand(name, false, commandValue)
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
    const attachment = await readAttachment(file)
    command('insertImage', attachment.dataUrl)
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <EditorButton label="Tebal" onClick={() => command('bold')}><Bold size={15} /></EditorButton>
          <EditorButton label="Miring" onClick={() => command('italic')}><Italic size={15} /></EditorButton>
          <EditorButton label="Subjudul" onClick={() => command('formatBlock', 'h3')}>H</EditorButton>
          <EditorButton label="Daftar poin" onClick={() => command('insertUnorderedList')}><List size={15} /></EditorButton>
          <EditorButton label="Daftar nomor" onClick={() => command('insertOrderedList')}><ListOrdered size={15} /></EditorButton>
          <EditorButton label="Tautan" onClick={addLink}><Link size={15} /></EditorButton>
          <EditorButton label="Video YouTube" onClick={addVideo}><Video size={15} /></EditorButton>
          <EditorButton label="Sisipkan gambar" onClick={() => imageInputRef.current?.click()}><ImagePlus size={15} /></EditorButton>
          <input accept="image/*" className="hidden" onChange={(event) => void addImage(event.target.files?.[0])} ref={imageInputRef} type="file" />
        </div>
        <div
          className="min-h-48 px-4 py-3 text-sm leading-6 text-slate-900 [&_a]:text-blue-700 [&_a]:underline [&_h3]:my-3 [&_h3]:font-bold [&_img]:my-3 [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded [&_li]:ml-5 [&_ol]:my-2 [&_ul]:my-2"
          contentEditable
          data-placeholder="Tulis kegiatan, daftar langkah, sisipkan gambar atau video..."
          onInput={emitChange}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
      <p className="mt-1 text-xs text-slate-500">Gambar maksimal 2 MB. Gunakan Enter untuk paragraf baru atau toolbar untuk daftar.</p>
    </div>
  )
}

function EditorButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return <button className="icon-button size-8" onClick={onClick} title={label} type="button">{children}</button>
}
