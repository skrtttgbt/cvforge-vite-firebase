import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { profile } from '../data/sampleData'

export default function WebPortfolio() {
  return (
    <AppLayout title="Web Portfolio Generator" subtitle="Create and customize your professional online portfolio" badge="AI Enhanced">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <Card title="Portfolio Configuration">
          <div className="grid gap-4"><FormField label="Portfolio Title" defaultValue="Juan Dela Cruz – Full Stack Developer"/><FormField label="Portfolio Slug / URL" defaultValue="cvforge.app/juandelacruz"/><FormField label="Theme Style" as="select"><option>Modern Blue</option><option>Minimal White</option></FormField><FormField label="Visibility" as="select"><option>Private / Token-share ready</option><option>Public</option></FormField></div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="mb-3 font-bold text-ink">Include in Portfolio</h3><div className="grid grid-cols-2 gap-2 text-sm">{['About Me','Technical Skills','Featured Projects','Resume Download','Certifications','Work Experience','Contact Links'].map(x=><label key={x} className="flex gap-2"><input type="checkbox" defaultChecked/> {x}</label>)}</div></div>
          <Button className="mt-5 w-full">Generate Portfolio</Button>
        </Card>
        <Card title="Portfolio Preview">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b p-4 text-sm"><b className="text-forge">Juan Dela Cruz</b><div className="hidden gap-5 sm:flex"><span>About</span><span>Skills</span><span>Projects</span><span>Contact</span></div></div>
            <div className="grid gap-6 bg-blue-50 p-6 md:grid-cols-[1.2fr_0.8fr]"><div><p className="text-sm text-slate-500">Hello, I'm</p><h2 className="text-4xl font-extrabold text-ink">Juan Dela Cruz</h2><p className="mt-1 font-bold text-forge">Full Stack Developer</p><p className="mt-4 text-slate-600">I build scalable web applications and digital solutions that deliver impact.</p><div className="mt-5 flex gap-3"><Button>Download Resume</Button><Button variant="outline">Contact Me</Button></div></div><div className="grid place-items-center"><div className="grid h-40 w-40 place-items-center rounded-full bg-white text-7xl shadow-soft">👨‍💻</div></div></div>
            <div className="grid gap-4 p-5 md:grid-cols-2"><Mini title="About Me" text={profile.summary}/><Mini title="Technical Skills" text={profile.skills.slice(0,6).join(', ')}/><Mini title="Featured Projects" text={profile.projects.map(p=>p.name).join(', ')}/><Mini title="Contact / Links" text={profile.links.join(', ')}/></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><Button variant="outline">Save Draft</Button><Button variant="outline">Regenerate</Button><Button>Publish Portfolio</Button></div>
        </Card>
      </div>
    </AppLayout>
  )
}
function Mini({ title, text }) { return <div className="rounded-lg border border-slate-200 p-4"><h3 className="mb-2 font-bold text-ink">{title}</h3><p className="text-sm text-slate-600">{text}</p></div> }
