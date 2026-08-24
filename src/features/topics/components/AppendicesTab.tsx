import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { FileUp, Paperclip } from 'lucide-react'
import { getModuleAppendices } from '../../../core/moduleAppendices'
import type { AppState, AppendixFile, GlossaryTerm, LearningTopic, MaterialAttachment, ModuleAppendices, ReadingSection } from '../../../core/types'
import { createId, maxAttachmentBytes, readAttachment } from '../../../core/utils'
import { TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { confirmDelete } from '../../../shared/utils/confirmDelete'

type AppendicesTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

export function AppendicesTab({ query, setState, state, topic }: AppendicesTabProps) {
  const appendices = getModuleAppendices(state, topic)

  function updateAppendices(patch: Partial<ModuleAppendices>) {
    setState((current) => ({
      ...current,
      moduleAppendices: {
        ...current.moduleAppendices,
        [topic.id]: {
          ...appendices,
          ...patch,
        },
      },
    }))
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-700">
            <Paperclip size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Lampiran Modul</h3>
            <p className="text-sm text-slate-500">Isi bahan bacaan, media pembelajaran, dan instrumen penilaian.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <TextArea label="Bahan Bacaan" onChange={(readingMaterials) => updateAppendices({ readingMaterials })} value={appendices.readingMaterials} />
          <TextArea label="Media Pembelajaran" onChange={(learningMedia) => updateAppendices({ learningMedia })} value={appendices.learningMedia} />
          <TextArea
            label="Instrumen Penilaian"
            onChange={(assessmentInstruments) => updateAppendices({ assessmentInstruments })}
            value={appendices.assessmentInstruments}
          />
        </div>
      </section>

      <ReadingSectionEditor
        onChange={(readingSections) => updateAppendices({ readingSections })}
        query={query}
        values={appendices.readingSections}
      />
      <GlossaryEditor
        onChange={(glossary) => updateAppendices({ glossary })}
        query={query}
        values={appendices.glossary}
      />
      <AppendixFileEditor
        files={appendices.files}
        onChange={(files) => updateAppendices({ files })}
        query={query}
      />
    </div>
  )
}

function ReadingSectionEditor({
  onChange,
  query,
  values,
}: {
  onChange: (values: ReadingSection[]) => void
  query: string
  values: ReadingSection[]
}) {
  const [editing, setEditing] = useState<ReadingSection | null>(null)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const items = values.filter((item) => `${item.title} ${item.content}`.toLowerCase().includes(query.toLowerCase()))

  function reset() {
    setEditing(null)
    setDraft({ title: '', content: '' })
  }

  function save() {
    if (!draft.title.trim() || !draft.content.trim()) return
    if (editing) {
      onChange(values.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)))
    } else {
      onChange([...values, { id: createId('reading'), ...draft }])
    }
    reset()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Bahan Bacaan Bersubbagian</h3>
          <p className="text-sm text-slate-500">Gunakan ini untuk membuat Lampiran 1 seperti PDF: sejarah, pengertian, langkah gerak, dan submateri lain.</p>
        </div>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div className="rounded-md border border-slate-200 p-3" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  className="text-sm font-semibold text-blue-700"
                  onClick={() => {
                    setEditing(item)
                    setDraft({ title: item.title, content: item.content })
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-sm font-semibold text-red-700"
                  onClick={() => {
                    if (confirmDelete('Hapus subbagian bahan bacaan ini?')) onChange(values.filter((entry) => entry.id !== item.id))
                  }}
                  type="button"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada subbagian bahan bacaan.</div>}
      </div>
      {(editing || draft.title || draft.content) && (
        <FormPanel title={editing ? 'Edit Bahan Bacaan' : 'Tambah Bahan Bacaan'} onCancel={reset} onSave={save}>
          <TextField label="Judul Subbagian" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
          <TextArea label="Isi Bahan Bacaan" onChange={(content) => setDraft((current) => ({ ...current, content }))} value={draft.content} />
        </FormPanel>
      )}
    </section>
  )
}

function GlossaryEditor({
  onChange,
  query,
  values,
}: {
  onChange: (values: GlossaryTerm[]) => void
  query: string
  values: GlossaryTerm[]
}) {
  const [editing, setEditing] = useState<GlossaryTerm | null>(null)
  const [draft, setDraft] = useState({ term: '', definition: '' })
  const items = values.filter((item) => `${item.term} ${item.definition}`.toLowerCase().includes(query.toLowerCase()))

  function reset() {
    setEditing(null)
    setDraft({ term: '', definition: '' })
  }

  function save() {
    if (!draft.term.trim() || !draft.definition.trim()) return
    if (editing) {
      onChange(values.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)))
    } else {
      onChange([{ id: createId('glossary'), ...draft }, ...values])
    }
    reset()
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Glosarium</h3>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200 p-3" key={item.id}>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.term}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.definition}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(item)
                  setDraft({ term: item.term, definition: item.definition })
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete('Hapus istilah glosarium ini?')) onChange(values.filter((entry) => entry.id !== item.id))
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada glosarium.</div>}
      </div>
      {(editing || draft.term || draft.definition) && (
        <FormPanel title={editing ? 'Edit Glosarium' : 'Tambah Glosarium'} onCancel={reset} onSave={save}>
          <TextField label="Istilah" onChange={(term) => setDraft((current) => ({ ...current, term }))} value={draft.term} />
          <TextArea label="Definisi" onChange={(definition) => setDraft((current) => ({ ...current, definition }))} value={draft.definition} />
        </FormPanel>
      )}
    </section>
  )
}

function AppendixFileEditor({
  files,
  onChange,
  query,
}: {
  files: AppendixFile[]
  onChange: (files: AppendixFile[]) => void
  query: string
}) {
  const [editing, setEditing] = useState<AppendixFile | null>(null)
  const [draft, setDraft] = useState<{ title: string; description: string; attachment?: MaterialAttachment }>({ title: '', description: '' })
  const [fileError, setFileError] = useState('')
  const items = files.filter((item) => `${item.title} ${item.description} ${item.attachment?.name ?? ''}`.toLowerCase().includes(query.toLowerCase()))

  function reset() {
    setEditing(null)
    setDraft({ title: '', description: '' })
    setFileError('')
  }

  function save() {
    if (!draft.title.trim() || !draft.description.trim()) return
    if (editing) {
      onChange(files.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)))
    } else {
      onChange([{ id: createId('appendix-file'), ...draft }, ...files])
    }
    reset()
  }

  async function handleFile(file?: File) {
    setFileError('')
    if (!file) return
    if (file.size > maxAttachmentBytes) {
      setFileError('Ukuran file maksimal 2 MB.')
      return
    }
    const attachment = await readAttachment(file)
    setDraft((current) => ({ ...current, attachment }))
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">File Pendukung</h3>
          <p className="text-sm text-slate-500">Preview sederhana menampilkan nama, ukuran, dan tipe file.</p>
        </div>
        <button className="btn-primary" onClick={reset} type="button">
          Tambah
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div className="rounded-lg border border-slate-200 p-4" key={item.id}>
            <div className="mb-3 flex items-center gap-2 text-blue-700">
              <FileUp size={17} />
              <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
            </div>
            <p className="text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-3 rounded-md bg-slate-50 p-2 text-xs font-medium text-slate-500">
              {item.attachment ? `${item.attachment.name} | ${Math.round(item.attachment.size / 1024)} KB | ${item.attachment.type || 'file'}` : 'Tanpa file'}
            </p>
            <div className="mt-3 flex gap-3">
              <button
                className="text-sm font-semibold text-blue-700"
                onClick={() => {
                  setEditing(item)
                  setDraft({ title: item.title, description: item.description, attachment: item.attachment })
                }}
                type="button"
              >
                Edit
              </button>
              <button
                className="text-sm font-semibold text-red-700"
                onClick={() => {
                  if (confirmDelete('Hapus file pendukung ini?')) onChange(files.filter((entry) => entry.id !== item.id))
                }}
                type="button"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Belum ada file pendukung.</div>}
      </div>

      {(editing || draft.title || draft.description || draft.attachment) && (
        <FormPanel title={editing ? 'Edit File Pendukung' : 'Tambah File Pendukung'} onCancel={reset} onSave={save}>
          <TextField label="Judul" onChange={(title) => setDraft((current) => ({ ...current, title }))} value={draft.title} />
          <TextArea label="Deskripsi" onChange={(description) => setDraft((current) => ({ ...current, description }))} value={draft.description} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
            <input className="input" onChange={(event) => void handleFile(event.target.files?.[0])} type="file" />
            {draft.attachment && (
              <p className="mt-1 text-xs text-slate-500">
                {draft.attachment.name} ({Math.round(draft.attachment.size / 1024)} KB)
              </p>
            )}
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          </div>
        </FormPanel>
      )}
    </section>
  )
}
