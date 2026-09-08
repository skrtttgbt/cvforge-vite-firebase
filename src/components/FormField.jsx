import { useId } from 'react'

export default function FormField({ error, label, type = 'text', as = 'input', children, ...props }) {
  const errorId = useId()
  const accessibility = { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined }
  const common = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-forge focus:ring-4 focus:ring-blue-100'
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {as === 'textarea' ? <textarea className={common} rows={4} {...props} {...accessibility} /> : as === 'select' ? <select className={common} {...props} {...accessibility}>{children}</select> : <input type={type} className={common} {...props} {...accessibility} />}
      {error && <span id={errorId} role="alert" className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}
