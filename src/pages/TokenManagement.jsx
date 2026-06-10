import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { recentTokens } from '../data/sampleData'
import { makeToken } from '../utils/helpers'

export default function TokenManagement() {
  const token = 'a7f9-3c2d-8b1e-4f5a-9d62-7e3b1c9d8e21'
  return (
    <AppLayout title="Generate Access Token" subtitle="Create a secure token to share a candidate's resume or portfolio">
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.8fr]">
        <Card title="Set Access & Permissions"><div className="grid gap-4"><FormField label="Candidate" as="select"><option>Juan Dela Cruz - Full Stack Developer</option></FormField><FormField label="Access Type" as="select"><option>Full Access Resume & Portfolio</option><option>Resume Only</option></FormField><FormField label="Token Expiration" as="select"><option>7 Days</option><option>30 Days</option></FormField><FormField label="Access Limit" as="select"><option>Unlimited Views</option><option>5 Views</option></FormField></div><label className="mt-4 flex gap-2 text-sm"><input type="checkbox" defaultChecked/> Allow download of resume</label><Button className="mt-5 w-full">Generate Token</Button></Card>
        <Card title="Generated Token"><div className="rounded-xl bg-green-50 p-4 text-sm text-green-700"><b>Token generated successfully!</b><p>Use the token or share link below.</p></div><div className="mt-5"><FormField label="Access Token" defaultValue={token}/><FormField label="Shareable Link" defaultValue={`https://cvforge.app/access/${makeToken()}`}/></div><div className="mt-5 flex gap-3"><Button variant="outline">Copy Link</Button><Button variant="outline">Share via Email</Button></div><Button variant="danger" className="mt-4 w-full">Revoke Token</Button></Card>
        <Card title="How Tokens Work"><div className="space-y-5 text-sm text-slate-600"><p><b className="text-ink">Secure Access</b><br/>Tokens provide secure, time-bound access to candidate profiles.</p><p><b className="text-ink">Set Expiration</b><br/>Choose when the token expires automatically.</p><p><b className="text-ink">Track Usage</b><br/>Monitor who accessed the profile and when.</p><p><b className="text-ink">Revoke Anytime</b><br/>You can revoke any token at any time.</p></div></Card>
      </div>
      <Card title="Recent Tokens" className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3">Candidate</th><th>Token</th><th>Access Type</th><th>Expires On</th><th>Views</th><th>Status</th><th>Action</th></tr></thead><tbody>{recentTokens.map(r=><tr key={r.token} className="border-b last:border-0"><td className="py-3 font-bold">{r.candidate}</td><td>{r.token}</td><td>{r.type}</td><td>{r.expires}</td><td>{r.views}</td><td><StatusBadge status={r.status}/></td><td><Button variant="outline" className="px-3 py-1.5">View</Button></td></tr>)}</tbody></table></Card>
    </AppLayout>
  )
}
