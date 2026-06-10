import { useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import ResumePreview from '../components/ResumePreview'
import { generateAIContent } from '../services/aiService'
import { WandSparkles } from 'lucide-react'

export default function ResumeBuilder() {
  const [draft, setDraft] = useState(null)
  async function generate() { setDraft(await generateAIContent('Resume Draft', { targetRole: 'Full Stack Developer' })) }
  return (
    <AppLayout title="AI-Assisted Resume Builder" subtitle="Generate an employer-ready resume using approved profile data" badge="Powered by DeepSeek AI">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <Card title="Resume Configuration"><div className="grid gap-4"><FormField label="Target ICT Role" as="select"><option>Full Stack Developer</option></FormField><FormField label="Experience Level" as="select"><option>Mid-Level (2–5 years)</option></FormField><FormField label="Resume Tone" as="select"><option>Professional</option></FormField><FormField label="Resume Length" as="select"><option>1 Page</option></FormField></div><div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="mb-3 font-bold text-ink">Include in Resume</h3><div className="grid grid-cols-2 gap-2 text-sm">{['Professional Summary','Technical Skills','Work Experience','Projects','Certifications','Education','Portfolio Links'].map(x=><label key={x} className="flex gap-2"><input type="checkbox" defaultChecked/> {x}</label>)}</div></div><Button onClick={generate} className="mt-5 w-full"><WandSparkles size={16}/> Generate Resume</Button></Card>
        <Card title="Resume Preview" right={<span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">AI Generated Draft</span>}><ResumePreview />{draft && <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><b>{draft.title}</b><p>{draft.content}</p></div>}<div className="mt-5 flex flex-wrap gap-3"><Button variant="outline">Save Draft</Button><Button variant="outline" onClick={generate}>Regenerate</Button><Button>Download PDF</Button></div></Card>
      </div>
    </AppLayout>
  )
}
