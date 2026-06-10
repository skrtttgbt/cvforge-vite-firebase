import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { interviewItems } from '../data/sampleData'

export default function InterviewPreparation() {
  return (
    <AppLayout title="Interview Preparation" subtitle="Practice ICT job interviews with AI-generated questions and feedback" badge="Powered by DeepSeek AI">
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr_0.9fr]">
        <Card title="Interview Session Setup"><div className="grid gap-4"><FormField label="Target ICT Role" as="select"><option>Full Stack Developer</option></FormField><FormField label="Interview Type" as="select"><option>Technical + HR</option></FormField><FormField label="Experience Level" as="select"><option>Mid-Level</option></FormField><FormField label="Difficulty" as="select"><option>Intermediate</option></FormField></div><div className="mt-5 rounded-xl bg-slate-50 p-4"><h3 className="mb-3 font-bold text-ink">Focus Areas</h3><div className="grid grid-cols-2 gap-2 text-sm">{['JavaScript','React','APIs','Database','Problem Solving','Communication'].map(x=><label key={x} className="flex gap-2"><input type="checkbox" defaultChecked/> {x}</label>)}</div></div><Button className="mt-5 w-full">Start Mock Interview</Button></Card>
        <Card title="Mock Interview Workspace" right={<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Live Session</span>}><div className="space-y-4">{interviewItems.map((q,i)=><div key={q} className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-forge">DeepSeek AI</p><h3 className="mt-1 font-bold text-ink">{q}</h3><p className="mt-3 text-sm text-slate-600">Your answer: I used React, Node.js, and Firebase to build a secure and responsive feature...</p><div className="mt-3 grid grid-cols-4 gap-2 text-xs"><Score label="Relevance"/><Score label="Clarity"/><Score label="Depth"/><Score label="Confidence"/></div></div>)}</div><div className="mt-5 flex gap-3"><Button>Analyze Response</Button><Button variant="outline">Save Session</Button></div></Card>
        <Card title="DeepSeek AI Feedback"><div className="space-y-4 text-sm"><div className="rounded-xl bg-green-50 p-4"><b className="text-green-700">Overall Assessment: Good</b><p className="mt-2">You demonstrated solid technical knowledge and practical experience.</p></div><Feedback title="Strengths" items={['Clear communication','Good use of real examples','Strong understanding of web technologies']}/><Feedback title="Areas to Improve" items={['Provide more quantitative results','Explain trade-offs','Add more behavioral context']}/><Feedback title="Suggested Keywords" items={['Scalability','Performance Tuning','System Design','REST API']}/></div></Card>
      </div>
    </AppLayout>
  )
}
function Score({ label }) { return <div><p>{label}</p><div className="mt-1 h-2 rounded bg-slate-100"><div className="h-2 w-4/5 rounded bg-forge"></div></div></div> }
function Feedback({ title, items }) { return <div><h3 className="mb-2 font-bold text-ink">{title}</h3><ul className="list-inside list-disc space-y-1 text-slate-600">{items.map(i=><li key={i}>{i}</li>)}</ul></div> }
