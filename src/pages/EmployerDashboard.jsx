import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'

export default function EmployerDashboard() {
  return <AppLayout title="Employer / HR Dashboard" subtitle="Review shared candidates through token-based access" employer><div className="grid gap-5 md:grid-cols-3"><Card><p className="text-sm text-slate-500">Candidates Viewed</p><p className="mt-2 text-3xl font-extrabold">12</p></Card><Card><p className="text-sm text-slate-500">Active Tokens</p><p className="mt-2 text-3xl font-extrabold">4</p></Card><Card><p className="text-sm text-slate-500">Shortlisted</p><p className="mt-2 text-3xl font-extrabold">3</p></Card></div></AppLayout>
}
