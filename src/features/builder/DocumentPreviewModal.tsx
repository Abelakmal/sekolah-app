import { Download, X } from 'lucide-react'

export function DocumentPreviewModal({
  html,
  onClose,
  onDownload,
  title,
}: {
  html: string
  onClose: () => void
  onDownload: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Preview dokumen A4</p>
            <h2 className="break-words text-xl font-semibold">{title}</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="btn-primary" onClick={onDownload} type="button">
              <Download size={16} />
              Download Word
            </button>
            <button className="icon-button" onClick={onClose} title="Tutup" type="button">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-auto bg-slate-100 p-3 sm:p-4">
          <iframe className="h-[72vh] min-w-[320px] w-full rounded-md border border-slate-200 bg-white" srcDoc={html} title={`Preview ${title}`} />
        </div>
      </section>
    </div>
  )
}
