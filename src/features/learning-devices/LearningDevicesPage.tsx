import { useEffect, useRef, useState } from 'react'
import { FilePenLine, FileText, FileUp, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../core/supabase/client'
import { confirmDelete } from '../../shared/utils/confirmDelete'

type LearningDevice = {
  created_at: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  file_url: string
  id: string
  teacher_id: string
  topic: string
  updated_at: string
}

const acceptedFiles = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function LearningDevicesPage({ teacherId }: { teacherId: string }) {
  const [devices, setDevices] = useState<LearningDevice[]>([])
  const [selected, setSelected] = useState<LearningDevice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<LearningDevice | null>(null)
  const [topic, setTopic] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadDevices()
  }, [teacherId])

  async function loadDevices() {
    setIsLoading(true)
    try {
      const response = await deviceRequest('/api/learning-devices')
      const payload = await response.json() as { devices?: LearningDevice[]; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Perangkat gagal dimuat.')
      setDevices(payload.devices ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Perangkat gagal dimuat.')
    }
    setIsLoading(false)
  }

  function openForm(device?: LearningDevice) {
    setEditing(device ?? null)
    setTopic(device?.topic ?? '')
    setFile(null)
    setError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditing(null)
    setTopic('')
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function upload(fileToUpload: File) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Silakan masuk kembali sebelum mengunggah file.')
    const formData = new FormData()
    formData.append('file', fileToUpload)
    const response = await fetch('/api/storage/documents', {
      body: formData,
      headers: { Authorization: `Bearer ${session.access_token}` },
      method: 'POST',
    })
    const payload = await response.json() as { error?: string; path?: string; url?: string }
    if (!response.ok || !payload.path || !payload.url) throw new Error(payload.error ?? 'File gagal diunggah.')
    return payload as { path: string; url: string }
  }

  async function removeStoredFile(path: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/storage/documents', {
      body: JSON.stringify({ path }),
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      method: 'DELETE',
    })
  }

  async function save() {
    const normalizedTopic = topic.trim()
    if (!normalizedTopic || (!editing && !file) || isSaving) return
    if (file && (!isAllowedFile(file) || file.size > 10 * 1024 * 1024)) {
      setError('Gunakan PDF, DOC, atau DOCX dengan ukuran maksimal 10 MB.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const uploaded = file ? await upload(file) : null
      const values = uploaded
        ? { topic: normalizedTopic, file_name: file!.name, file_path: uploaded.path, file_url: uploaded.url, file_type: file!.type, file_size: file!.size, updated_at: new Date().toISOString() }
        : { topic: normalizedTopic, updated_at: new Date().toISOString() }
      if (editing) {
        const response = await deviceRequest('/api/learning-devices', { body: JSON.stringify({ id: editing.id, ...values }), method: 'PATCH' })
        const payload = await response.json() as { device?: LearningDevice; error?: string }
        if (!response.ok || !payload.device) throw new Error(payload.error ?? 'Perangkat tidak ditemukan.')
        const data = payload.device
        if (uploaded) await removeStoredFile(editing.file_path)
        setDevices((current) => current.map((item) => item.id === data.id ? data : item))
        setSelected((current) => current?.id === data.id ? data : current)
      } else {
        const response = await deviceRequest('/api/learning-devices', { body: JSON.stringify(values), method: 'POST' })
        const payload = await response.json() as { device?: LearningDevice; error?: string }
        if (!response.ok || !payload.device) {
          if (uploaded) await removeStoredFile(uploaded.path)
          throw new Error(payload.error ?? 'Perangkat gagal disimpan.')
        }
        const data = payload.device
        setDevices((current) => [data, ...current])
      }
      closeForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Perangkat gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function remove(device: LearningDevice) {
    if (!confirmDelete(`Hapus perangkat “${device.topic}”? File di penyimpanan juga akan dihapus.`)) return
    setError('')
    const response = await deviceRequest('/api/learning-devices', { body: JSON.stringify({ id: device.id }), method: 'DELETE' })
    const payload = await response.json() as { error?: string }
    if (!response.ok) {
      setError(`Perangkat gagal dihapus: ${payload.error ?? 'terjadi kesalahan'}`)
      return
    }
    await removeStoredFile(device.file_path)
    setDevices((current) => current.filter((item) => item.id !== device.id))
    setSelected((current) => current?.id === device.id ? null : current)
  }

  if (selected) return <DeviceDetail device={selected} onBack={() => setSelected(null)} onDelete={() => void remove(selected)} onEdit={() => openForm(selected)} />

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0"><p className="text-sm text-slate-500">Dokumen pendukung guru</p><h2 className="break-words text-2xl font-semibold">Perangkat Pembelajaran</h2><p className="mt-1 break-words text-sm text-slate-500">Simpan PDF, DOC, atau DOCX berdasarkan topik pembelajaran.</p></div>
          <button className="btn-primary w-full md:w-auto" onClick={() => openForm()} type="button"><Plus size={16} /> Tambah Perangkat</button>
        </div>
        {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mt-5 grid gap-3">
          {isLoading && <p className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={17} /> Memuat perangkat...</p>}
          {!isLoading && devices.length === 0 && <p className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">Belum ada perangkat pembelajaran.</p>}
          {devices.map((device) => <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between" key={device.id}><button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelected(device)} type="button"><div className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700"><FileText size={19} /></div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{device.topic}</p><p className="truncate text-sm text-slate-500">{device.file_name} · {formatBytes(device.file_size)}</p></div></button><div className="flex shrink-0 gap-1 self-end md:self-auto"><button className="icon-button" onClick={() => openForm(device)} title="Edit" type="button"><Pencil size={15} /></button><button className="icon-button text-red-600" onClick={() => void remove(device)} title="Hapus" type="button"><Trash2 size={15} /></button></div></article>)}
        </div>
      </section>
      {isFormOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"><section aria-modal="true" className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl" role="dialog"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">Perangkat Pembelajaran</p><h3 className="text-xl font-semibold">{editing ? 'Edit Perangkat' : 'Tambah Perangkat'}</h3></div><button className="icon-button" onClick={closeForm} type="button"><X size={17} /></button></div><div className="mt-5 grid gap-5"><label><span className="mb-2 block text-sm font-semibold text-slate-700">Nama Topik</span><input className="input" onChange={(event) => setTopic(event.target.value)} placeholder="Contoh: Passing bawah bola voli" value={topic} /></label><label><span className="mb-2 block text-sm font-semibold text-slate-700">File PDF atau Word {editing && '(kosongkan bila tidak diganti)'}</span><input accept={acceptedFiles} className="input" onChange={(event) => setFile(event.target.files?.[0] ?? null)} ref={inputRef} type="file" /><span className="mt-1 block text-xs text-slate-500">Maksimal 10 MB. {file?.name ?? (editing ? `File saat ini: ${editing.file_name}` : '')}</span></label></div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={closeForm} type="button">Batal</button><button className="btn-primary" disabled={isSaving || !topic.trim() || (!editing && !file)} onClick={() => void save()} type="button">{isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <FileUp size={16} />} Simpan</button></div></section></div>}
    </div>
  )
}

async function deviceRequest(path: string, init?: { body?: string; method?: 'POST' | 'PATCH' | 'DELETE' }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Silakan masuk kembali.')
  return fetch(path, {
    body: init?.body,
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    method: init?.method,
  })
}

function DeviceDetail({ device, onBack, onDelete, onEdit }: { device: LearningDevice; onBack: () => void; onDelete: () => void; onEdit: () => void }) {
  const isPdf = device.file_type === 'application/pdf'
  return <div className="grid min-w-0 gap-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><button className="text-sm font-semibold text-blue-700" onClick={onBack} type="button">← Kembali ke daftar</button><h2 className="mt-2 break-words text-2xl font-semibold">{device.topic}</h2><p className="truncate text-sm text-slate-500">{device.file_name} · {formatBytes(device.file_size)}</p></div><div className="flex flex-wrap gap-2"><a className="btn-secondary" href={device.file_url} rel="noreferrer" target="_blank">Buka / Unduh</a><button className="btn-secondary" onClick={onEdit} type="button"><FilePenLine size={16} /> Edit</button><button className="btn-secondary text-red-700" onClick={onDelete} type="button"><Trash2 size={16} /> Hapus</button></div></div><section className="h-[calc(100dvh-12rem)] min-h-[32rem] overflow-auto rounded-lg border border-slate-200 bg-white">{isPdf ? <iframe className="block h-full min-h-[32rem] w-full touch-pan-y" scrolling="yes" src={`${device.file_url}#view=FitH`} title={`Pratinjau ${device.topic}`} /> : <div className="grid min-h-full place-items-center p-5 text-center sm:p-8"><div><FileText className="mx-auto text-blue-600" size={42} /><h3 className="mt-4 text-lg font-semibold">Pratinjau Word belum tersedia di browser</h3><p className="mt-2 max-w-md text-sm text-slate-500">Buka atau unduh file untuk melihat dokumen DOC/DOCX dengan aplikasi Microsoft Word atau LibreOffice.</p><a className="btn-primary mt-5" href={device.file_url} rel="noreferrer" target="_blank">Buka / Unduh Dokumen</a></div></div>}</section></div>
}

function isAllowedFile(file: File) { return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) }
function formatBytes(size: number) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB` }
