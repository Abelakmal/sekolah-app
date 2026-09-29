import { useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { ArrowDown, ArrowUp, Clock3, FileText, ImagePlus, ListChecks, Plus, Quote, Trash2, Video } from 'lucide-react'
import { getModuleActivities, mergeLegacyDifferentiationIntoCore } from '../../../core/moduleActivities'
import type { ActivityBlock, ActivityBlockType, AppState, LearningActivity, LearningActivityPhase, LearningTopic, ModuleLearningActivities } from '../../../core/types'
import { createId, maxAttachmentBytes, readAttachment } from '../../../core/utils'
import { NumberField, TextArea, TextField } from '../../../shared/components/FormControls'
import { FormPanel } from '../../../shared/components/FormPanel'
import { RichTextEditor } from '../../../shared/components/RichTextEditor'
import { AutoSavedNotice, BankSection } from './BankSection'
import { CrudSection } from './CrudSection'

type ActivitiesTabProps = {
  query: string
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
  topic: LearningTopic
}

type PhaseKey = 'opening' | 'core' | 'closing'

type ActivityPhaseDraft = LearningActivityPhase & {
  blocks: ActivityBlock[]
}

const phaseLabels: Record<PhaseKey, string> = {
  opening: 'Pendahuluan',
  core: 'Inti',
  closing: 'Penutup',
}

export function ActivitiesTab({ setState, state, topic }: ActivitiesTabProps) {
  const moduleActivities = getModuleActivities(state, topic)
  const [_editorPhases, setEditorPhases] = useState(() => createEditorPhases(moduleActivities))
  const reflectionComplete = Boolean(moduleActivities.teacherReflection && moduleActivities.studentReflection)

  useEffect(() => {
    setEditorPhases(createEditorPhases(moduleActivities))
    // Hanya ganti draft ketika pengguna membuka topik lain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id])

  useEffect(() => {
    if (!moduleActivities.contentDifferentiation && !moduleActivities.processDifferentiation && !moduleActivities.environmentDifferentiation) return

    const coreSteps = mergeLegacyDifferentiationIntoCore(moduleActivities)
    setState((current) => ({
      ...current,
      moduleActivities: {
        ...current.moduleActivities,
        [topic.id]: {
          ...moduleActivities,
          core: { ...moduleActivities.core, steps: coreSteps, blocks: undefined },
          contentDifferentiation: '',
          processDifferentiation: '',
          environmentDifferentiation: '',
        },
      },
    }))
  }, [moduleActivities, setState, topic.id])

  function updateModuleActivities(patch: Partial<ModuleLearningActivities>) {
    setState((current) => ({
      ...current,
      moduleActivities: {
        ...current.moduleActivities,
        [topic.id]: {
          ...moduleActivities,
          ...patch,
        },
      },
    }))
  }

  function _updatePhase(phase: PhaseKey, nextPhase: ActivityPhaseDraft) {
    setEditorPhases((current) => ({ ...current, [phase]: nextPhase }))
    updateModuleActivities({
      [phase]: {
        title: nextPhase.title,
        durationMinutes: nextPhase.durationMinutes,
        steps: blocksToPlainText(nextPhase.blocks),
        blocks: nextPhase.blocks,
      },
    })
  }

  function updateRichPhase(phase: PhaseKey, patch: Partial<LearningActivityPhase>) {
    updateModuleActivities({ [phase]: { ...moduleActivities[phase], ...patch } })
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-amber-50 text-amber-700">
            <ListChecks size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Urutan Kegiatan Pembelajaran</h3>
            <p className="text-sm text-slate-500">Susun alur kegiatan seperti format Modul Ajar: pendahuluan, inti, penutup.</p>
          </div>
          </div>
          <AutoSavedNotice />
        </div>
        <div className="grid gap-3">
          {(Object.keys(phaseLabels) as PhaseKey[]).map((phase) => (
            <RichActivityPhaseEditor
              anchorId={`activities-${phase}`}
              key={phase}
              label={phaseLabels[phase]}
              onChange={(patch) => updateRichPhase(phase, patch)}
              value={moduleActivities[phase]}
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <BankSection id="activities-reflection" isComplete={reflectionComplete} title="Refleksi">
          <div className="mb-4 flex justify-end">
            <AutoSavedNotice />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <TextArea
              label="Refleksi Guru"
              onChange={(teacherReflection) => updateModuleActivities({ teacherReflection })}
              value={moduleActivities.teacherReflection}
            />
            <TextArea
              label="Refleksi Peserta Didik"
              onChange={(studentReflection) => updateModuleActivities({ studentReflection })}
              value={moduleActivities.studentReflection}
            />
          </div>
        </BankSection>
      </section>

    </div>
  )
}

function RichActivityPhaseEditor({
  anchorId,
  label,
  onChange,
  value,
}: {
  anchorId: string
  label: string
  onChange: (patch: Partial<LearningActivityPhase>) => void
  value: LearningActivityPhase
}) {
  return (
    <BankSection defaultOpen id={anchorId} isComplete={Boolean(value.steps && value.durationMinutes > 0)} title={label}>
      <div className="grid gap-6 md:grid-cols-[1fr_160px]">
        <TextField label="Judul Bagian" onChange={(title) => onChange({ title })} value={value.title} />
        <NumberField label="Durasi (menit)" onChange={(durationMinutes) => onChange({ durationMinutes })} value={value.durationMinutes} />
      </div>
      <div className="mt-5">
        <RichTextEditor label={`Isi kegiatan ${label}`} onChange={(steps) => onChange({ steps, blocks: undefined })} value={value.steps} />
      </div>
    </BankSection>
  )
}

function _ActivityBlockEditor({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: ActivityPhaseDraft) => void
  value: ActivityPhaseDraft
}) {
  function updateBlock(blockId: string, patch: Partial<ActivityBlock>) {
    onChange({ ...value, blocks: value.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)) })
  }

  function addBlock(type: ActivityBlockType) {
    onChange({
      ...value,
      blocks: [
        ...value.blocks,
        {
          id: createId('activity-block'),
          type,
          content: type === 'heading' ? 'Subjudul kegiatan' : type === 'callout' ? 'Sintaks diferensiasi: ' : '',
        },
      ],
    })
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const destination = index + direction
    if (destination < 0 || destination >= value.blocks.length) return
    const blocks = [...value.blocks]
    ;[blocks[index], blocks[destination]] = [blocks[destination], blocks[index]]
    onChange({ ...value, blocks })
  }

  function removeBlock(block: ActivityBlock) {
    onChange({ ...value, blocks: value.blocks.filter((item) => item.id !== block.id) })
  }

  return (
    <BankSection defaultOpen isComplete={Boolean(value.blocks.length && value.durationMinutes > 0)} title={label}>
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="text-slate-500" size={16} />
        <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_160px]">
        <TextField label="Judul Bagian" onChange={(title) => onChange({ ...value, title })} value={value.title} />
        <NumberField label="Durasi (menit)" onChange={(durationMinutes) => onChange({ ...value, durationMinutes })} value={value.durationMinutes} />
      </div>

      <div className="mt-4 grid gap-3">
        {value.blocks.map((block, index) => (
          <ActivityBlockCard
            block={block}
            index={index}
            key={block.id}
            onChange={(patch) => updateBlock(block.id, patch)}
            onMove={(direction) => moveBlock(index, direction)}
            onRemove={() => removeBlock(block)}
            total={value.blocks.length}
          />
        ))}
        {value.blocks.length === 0 && <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">Belum ada blok kegiatan. Tambahkan teks, media, atau catatan diferensiasi.</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        <AddBlockButton icon={<FileText size={15} />} label="Teks / daftar" onClick={() => addBlock('text')} />
        <AddBlockButton icon={<ListChecks size={15} />} label="Subjudul" onClick={() => addBlock('heading')} />
        <AddBlockButton icon={<Quote size={15} />} label="Diferensiasi" onClick={() => addBlock('callout')} />
        <AddBlockButton icon={<ImagePlus size={15} />} label="Gambar" onClick={() => addBlock('image')} />
        <AddBlockButton icon={<Video size={15} />} label="Video YouTube" onClick={() => addBlock('video')} />
      </div>
    </BankSection>
  )
}

function ActivityBlockCard({
  block,
  index,
  onChange,
  onMove,
  onRemove,
  total,
}: {
  block: ActivityBlock
  index: number
  onChange: (patch: Partial<ActivityBlock>) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
  total: number
}) {
  const labels: Record<ActivityBlockType, string> = {
    text: 'Teks / daftar kegiatan',
    heading: 'Subjudul kegiatan',
    callout: 'Catatan diferensiasi',
    image: 'Gambar pendukung',
    video: 'Video pembelajaran',
  }
  const isImage = block.type === 'image'
  const isVideo = block.type === 'video'
  const validatedVideoUrl = getYouTubeUrl(block.videoUrl)

  async function selectImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > maxAttachmentBytes) return
    const attachment = await readAttachment(file)
    onChange({ imageName: attachment.name, imageUrl: attachment.dataUrl })
  }

  return (
    <article className={block.type === 'callout' ? 'rounded-lg border border-violet-200 bg-violet-50 p-4' : 'rounded-lg border border-slate-200 bg-slate-50 p-4'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{index + 1}. {labels[block.type]}</p>
        <div className="flex items-center gap-1">
          <button className="icon-button size-8" disabled={index === 0} onClick={() => onMove(-1)} title="Pindahkan ke atas" type="button"><ArrowUp size={15} /></button>
          <button className="icon-button size-8" disabled={index === total - 1} onClick={() => onMove(1)} title="Pindahkan ke bawah" type="button"><ArrowDown size={15} /></button>
          <button className="icon-button size-8 text-red-600" onClick={onRemove} title="Hapus blok" type="button"><Trash2 size={15} /></button>
        </div>
      </div>

      {isImage ? (
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Pilih gambar</span>
            <input accept="image/*" className="input" onChange={(event) => void selectImage(event.target.files?.[0])} type="file" />
          </label>
          {block.imageUrl && <img alt={block.content || block.imageName || 'Gambar kegiatan pembelajaran'} className="max-h-64 w-full rounded-md border border-slate-200 object-contain bg-white" src={block.imageUrl} />}
          <TextField label="Caption gambar (opsional)" onChange={(content) => onChange({ content })} value={block.content} />
        </div>
      ) : isVideo ? (
        <div className="grid gap-3">
          <TextField label="Tautan YouTube" onChange={(videoUrl) => onChange({ videoUrl })} value={block.videoUrl ?? ''} />
          <TextField label="Keterangan video (opsional)" onChange={(content) => onChange({ content })} value={block.content} />
          {block.videoUrl && !validatedVideoUrl && <p className="text-sm text-amber-700">Masukkan tautan dari youtube.com atau youtu.be.</p>}
          {validatedVideoUrl && <a className="inline-flex w-fit items-center gap-2 text-sm font-medium text-blue-700 underline" href={validatedVideoUrl} rel="noreferrer" target="_blank"><Video size={15} />Buka video untuk pratinjau</a>}
        </div>
      ) : block.type === 'heading' ? (
        <TextField label="Subjudul" onChange={(content) => onChange({ content })} value={block.content} />
      ) : (
        <TextArea className="min-h-28" label={block.type === 'callout' ? 'Isi catatan diferensiasi' : 'Isi kegiatan (satu baris dapat menjadi satu langkah)'} onChange={(content) => onChange({ content })} value={block.content} />
      )}
    </article>
  )
}

function AddBlockButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="btn-secondary h-9 px-3 text-sm" onClick={onClick} type="button"><Plus size={15} />{icon}{label}</button>
}

function createEditorPhases(activities: ModuleLearningActivities): Record<PhaseKey, ActivityPhaseDraft> {
  return Object.fromEntries(
    (Object.keys(phaseLabels) as PhaseKey[]).map((phase) => {
      const value = activities[phase]
      return [
        phase,
        {
          ...value,
          blocks: value.blocks?.length ? value.blocks : value.steps ? [{ id: createId('activity-block'), type: 'text', content: value.steps }] : [],
        },
      ]
    }),
  ) as Record<PhaseKey, ActivityPhaseDraft>
}

function blocksToPlainText(blocks: ActivityBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'heading') return block.content
      if (block.type === 'callout') return `Sintaks Diferensiasi: ${block.content}`
      if (block.type === 'image') return block.content ? `Gambar: ${block.content}` : ''
      if (block.type === 'video') return [block.content, block.videoUrl].filter(Boolean).join('\n')
      return block.content
    })
    .filter(Boolean)
    .join('\n\n')
}

function getYouTubeUrl(value?: string) {
  if (!value) return ''

  try {
    const url = new URL(value)
    const isYouTube = url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com') || url.hostname === 'youtu.be'
    return isYouTube && ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

function AdditionalActivities({ query, setState, state, topic }: ActivitiesTabProps) {
  const [editing, setEditing] = useState<LearningActivity | null>(null)
  const [draft, setDraft] = useState({ name: '', steps: '', durationMinutes: 35 })
  const items = state.activities
    .filter((item) => item.topicId === topic.id)
    .filter((item) => `${item.name} ${item.steps}`.toLowerCase().includes(query.toLowerCase()))

  function save() {
    if (!draft.name.trim() || !draft.steps.trim() || draft.durationMinutes <= 0) return
    if (editing) {
      setState((current) => ({
        ...current,
        activities: current.activities.map((item) => (item.id === editing.id ? { ...item, ...draft } : item)),
      }))
    } else {
      setState((current) => ({
        ...current,
        activities: [{ id: createId('activity'), topicId: topic.id, ...draft }, ...current.activities],
      }))
    }
    setEditing(null)
    setDraft({ name: '', steps: '', durationMinutes: 35 })
  }

  return (
    <CrudSection
      empty="Belum ada aktivitas tambahan."
      items={items.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${item.durationMinutes} menit`,
        description: item.steps,
        onEdit: () => {
          setEditing(item)
          setDraft({ name: item.name, steps: item.steps, durationMinutes: item.durationMinutes })
        },
        onDelete: () => setState((current) => ({ ...current, activities: current.activities.filter((entry) => entry.id !== item.id) })),
      }))}
      onAdd={() => {
        setEditing(null)
        setDraft({ name: '', steps: '', durationMinutes: 35 })
      }}
      title="Aktivitas Tambahan"
    >
      {(editing || draft.name || draft.steps) && (
        <FormPanel
          title={editing ? 'Edit Aktivitas Tambahan' : 'Tambah Aktivitas Tambahan'}
          onCancel={() => {
            setEditing(null)
            setDraft({ name: '', steps: '', durationMinutes: 35 })
          }}
          onSave={save}
        >
          <TextField label="Nama Aktivitas" onChange={(name) => setDraft((current) => ({ ...current, name }))} value={draft.name} />
          <TextArea label="Langkah Pembelajaran" onChange={(steps) => setDraft((current) => ({ ...current, steps }))} value={draft.steps} />
          <NumberField label="Durasi (menit)" onChange={(durationMinutes) => setDraft((current) => ({ ...current, durationMinutes }))} value={draft.durationMinutes} />
        </FormPanel>
      )}
    </CrudSection>
  )
}
