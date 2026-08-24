import { CheckCircle2, X } from 'lucide-react'

export function Toast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 text-sm shadow-xl">
      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
      <p className="min-w-0 flex-1 font-medium text-slate-700">{message}</p>
      <button className="text-slate-400 hover:text-slate-700" onClick={onClose} title="Tutup notifikasi" type="button">
        <X size={16} />
      </button>
    </div>
  )
}
