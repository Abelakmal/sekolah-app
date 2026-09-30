import { useEffect, useRef, useState } from 'react'
import type { AppState, LearningTopic } from '../../core/types'
import type { BuilderSelection } from './documentExport'
import { buildAdministrationDocumentDocxBlob } from './documentExportDocx'

export function DocxDocumentPreview({ state, topic, selected, onPrepared }: { state: AppState; topic: LearningTopic; selected: BuilderSelection; onPrepared: (blob: Blob | undefined) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const container = containerRef.current
    if (!container) return
    const renderTarget = document.createElement('div')
    container.replaceChildren(renderTarget)
    onPrepared(undefined)
    setLoading(true)
    setError('')
    void buildAdministrationDocumentDocxBlob({ state, topic, selected }).then(async (blob) => {
      const { renderAsync } = await import('docx-preview')
      if (active) {
        await renderAsync(blob, renderTarget, undefined, { inWrapper: true, renderHeaders: true, renderFooters: true })
        if (active) onPrepared(blob)
      }
    }).catch((failure: unknown) => {
      if (active) setError(failure instanceof Error ? failure.message : 'Preview gagal dibuat.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [state, topic, selected, onPrepared])
  return <div className="min-w-0">
    {loading && <p role="status" className="mb-3 text-sm text-slate-500">Menyiapkan dokumen dan gambar...</p>}
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    <div className="max-h-[75vh] min-w-0 max-w-full overflow-auto rounded-md border border-slate-200 bg-slate-100">
      <div className="docx-native-preview min-w-[794px]" ref={containerRef} />
    </div>
  </div>
}
