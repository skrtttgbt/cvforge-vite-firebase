import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { LockKeyhole, Link2, Eye, ShieldCheck } from 'lucide-react'

export default function AccessToken() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between bg-navy px-6 py-5 text-white"><Logo dark/><Link to="/login" className="text-sm font-bold">For ICT Job Seekers</Link></header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center"><h1 className="text-4xl font-extrabold text-ink">Access Shared Resume or Portfolio</h1><p className="mt-3 text-slate-600">Enter the access token provided by the ICT job seeker to view their resume or portfolio.</p></div>
        <Card className="mt-10"><div className="grid gap-8 lg:grid-cols-2"><section className="p-2 md:p-8"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-forge"><LockKeyhole/></div><h2 className="text-center text-2xl font-extrabold text-ink">Enter Access Token</h2><p className="mt-2 text-center text-slate-600">Please enter the access token below.</p><div className="mt-6"><FormField label="" placeholder="Enter access token here..."/></div><Link to="/shared-profile"><Button className="mt-4 w-full">Access Profile</Button></Link><div className="my-8 flex items-center gap-4 text-sm text-slate-400"><hr className="flex-1"/>OR<hr className="flex-1"/></div><div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">The token is a unique link or code shared by the ICT job seeker to allow you to view their professional information.</div></section><section className="rounded-xl bg-slate-50 p-6 md:p-8"><h2 className="mb-8 text-center text-2xl font-extrabold text-ink">How It Works</h2><Step icon={Link2} title="1. Receive Token" text="The ICT job seeker shares a token or link with you."/><Step icon={LockKeyhole} title="2. Enter Token" text="Paste the token and click Access Profile."/><Step icon={Eye} title="3. View Profile" text="You will be able to view the shared resume or portfolio securely."/><hr className="my-6"/><Step icon={ShieldCheck} title="Secure Access" text="Tokens are encrypted and may expire or be revoked by the owner."/></section></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><b>Important:</b> If the token is invalid, expired, or revoked, you will not be able to access the profile.</div></Card>
      </main>
    </div>
  )
}
function Step({ icon: Icon, title, text }) { return <div className="mb-6 flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-forge shadow-soft"><Icon size={20}/></div><div><h3 className="font-bold text-ink">{title}</h3><p className="text-sm text-slate-600">{text}</p></div></div> }
