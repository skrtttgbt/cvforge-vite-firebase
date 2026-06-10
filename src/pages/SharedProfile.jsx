import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { profile } from '../data/sampleData'

export default function SharedProfile() {
  return (
    <AppLayout title="Shared Profile Viewer" subtitle="Employer / HR secure candidate view" employer>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <Card><div className="flex flex-col gap-6 md:flex-row"><div className="grid h-32 w-32 place-items-center rounded-full bg-blue-100 text-6xl">👨‍💻</div><div className="flex-1"><h1 className="text-3xl font-extrabold text-ink">{profile.fullName}</h1><p className="font-bold text-forge">{profile.targetRole}</p><p className="mt-3 max-w-2xl text-slate-600">{profile.summary}</p><div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><span>{profile.email}</span><span>{profile.phone}</span><span>{profile.location}</span></div></div></div></Card>
        <Card title="Profile Information"><div className="grid gap-3 text-sm"><Info label="Target Role" value={profile.targetRole}/><Info label="Experience Level" value="Entry Level"/><Info label="Availability" value="Open to Opportunities"/><Info label="Last Updated" value="May 12, 2025"/></div></Card>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]"><div className="grid gap-5"><Card title="Professional Summary"><p className="text-slate-600">{profile.summary} Skilled in building responsive and user-friendly web applications.</p></Card><Card title="Work Experience"><p className="font-bold text-ink">Web Developer Intern | ABC Solutions</p><ul className="mt-3 list-inside list-disc text-sm text-slate-600"><li>Developed and maintained web applications using React and Node.js.</li><li>Collaborated with the team in designing APIs and database structures.</li><li>Participated in debugging and improving system performance.</li></ul></Card><Card title="Education"><div className="flex justify-between gap-4"><p><b>Bachelor of Science in Information and Communication Technology</b><br/>Tarlac State University</p><span>2020 – 2024</span></div></Card></div><div className="grid gap-5"><Card title="Skills"><div className="flex flex-wrap gap-2">{profile.skills.map(s=><span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{s}</span>)}</div></Card><Card title="Top Projects">{profile.projects.map(p=><div key={p.name} className="border-b py-3 last:border-0"><h3 className="font-bold text-ink">{p.name}</h3><p className="text-sm text-slate-600">{p.desc}</p><a className="text-sm font-bold text-forge">View Project ↗</a></div>)}</Card><Card title="Certifications"><ul className="list-inside list-disc text-sm text-slate-600">{profile.certs.map(c=><li key={c}>{c}</li>)}</ul></Card></div></div>
      <div className="mt-5 flex justify-end gap-3"><Button>Download Resume PDF</Button><Button variant="outline">Print Profile</Button></div>
    </AppLayout>
  )
}
function Info({ label, value }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><b className="text-right text-ink">{value}</b></div> }
