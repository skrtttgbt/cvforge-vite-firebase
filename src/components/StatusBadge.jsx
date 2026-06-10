export default function StatusBadge({ status }) {
  const active = status === 'Connected' || status === 'Active'
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${active ? 'bg-green-100 text-green-700' : status === 'Expired' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{status}</span>
}
