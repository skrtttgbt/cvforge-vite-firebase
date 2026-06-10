import { profile } from '../data/sampleData'

export default function ResumePreview() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-forge uppercase">{profile.fullName}</h2>
        <p className="font-bold text-ink">{profile.targetRole}</p>
        <p className="mt-2 text-xs text-slate-500">{profile.email} • {profile.phone} • {profile.location} • juandelacruz.dev</p>
      </div>
      <Section title="Professional Summary"><p>{profile.summary} Skilled in building responsive applications and solving real-world problems.</p></Section>
      <Section title="Projects">{profile.projects.map(p => <p key={p.name} className="mb-2"><b>{p.name}</b> — {p.desc}</p>)}</Section>
      <Section title="Technical Skills"><div className="flex flex-wrap gap-2">{profile.skills.map(s => <span key={s} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">{s}</span>)}</div></Section>
      <Section title="Certifications"><ul className="list-inside list-disc">{profile.certs.map(c => <li key={c}>{c}</li>)}</ul></Section>
    </div>
  )
}
function Section({ title, children }) { return <div className="mt-4"><h3 className="mb-2 text-xs font-extrabold uppercase text-ink">{title}</h3>{children}</div> }
