import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'

export function DocumentPreviewModal({
  html,
  docxBlob,
  onClose,
  onDownload,
  title,
}: {
  html: string
  docxBlob?: () => Promise<Blob>
  onClose: () => void
  onDownload: (blob?: Blob) => void
  title: string
}) {
  const docxPreviewRef = useRef<HTMLDivElement>(null)
  const preparedBlob = useRef<Blob | undefined>(undefined)
  const [previewError, setPreviewError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(docxBlob))

  useEffect(() => {
    if (!docxBlob || !docxPreviewRef.current) return
    let active = true
    const container = docxPreviewRef.current
    preparedBlob.current = undefined
    setPreviewError('')
    setIsLoading(true)
    container.replaceChildren()
    void docxBlob()
      .then(async (blob) => {
        if (!active) return
        preparedBlob.current = blob
        const { renderAsync } = await import('docx-preview')
        if (active) await renderAsync(blob, container, undefined, { inWrapper: true, renderHeaders: true, renderFooters: true })
      })
      .catch((error: unknown) => {
        if (active) setPreviewError(error instanceof Error ? error.message : 'Preview DOCX gagal dibuat.')
      })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [docxBlob])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-3 sm:px-4">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Preview dokumen A4</p>
            <h2 className="break-words text-xl font-semibold">{title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="btn-primary" disabled={isLoading || Boolean(docxBlob && previewError && !preparedBlob.current)} onClick={() => onDownload(preparedBlob.current)} type="button">
              <Download size={16} />
              Download DOCX
            </button>
            <button className="icon-button" onClick={onClose} title="Tutup" type="button">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="min-w-0 max-w-full overflow-auto bg-slate-100 p-3 sm:p-4">
          {isLoading && <p className="mb-3 text-sm text-slate-600">Menyiapkan dokumen dan gambar...</p>}
          {docxBlob ? <div className="docx-native-preview min-w-[794px]" ref={docxPreviewRef} /> : <div className="w-max min-w-[794px]"><iframe className="h-[72vh] w-[794px] rounded-md border border-slate-200 bg-white" srcDoc={html} title={`Preview ${title}`} /></div>}
          {previewError && <p className="mt-2 text-sm text-amber-700">{previewError}</p>}
        </div>
      </section>
    </div>
  )
}
