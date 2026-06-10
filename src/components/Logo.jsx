export default function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-forge text-white shadow-soft">C</div>
      <span className={dark ? 'text-white' : 'text-ink'}>CVForge</span>
    </div>
  )
}
