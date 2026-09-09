import { useLayoutEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export function SearchField({
  className,
  onChange,
  placeholder,
  value,
}: {
  className?: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="relative block min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input className={className ?? 'input pl-9'} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
    </label>
  )
}

export function TextField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input className="input" onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  )
}

export function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input className="input" min={1} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} />
    </label>
  )
}

export function TextArea({
  className = '',
  label,
  onChange,
  value,
}: {
  className?: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        className={`input min-h-24 resize-none overflow-hidden py-2 ${className}`}
        onChange={(event) => onChange(event.target.value)}
        ref={textareaRef}
        value={value}
      />
    </label>
  )
}
