export default function Card({ title, children, right, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-soft ${className}`}>
      {(title || right) && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold text-ink">{title}</h2>{right}</div>}
      {children}
    </section>
  )
}
