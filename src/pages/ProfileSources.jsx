import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import FormField from '../components/FormField'
import StatusBadge from '../components/StatusBadge'
import { sourceCards } from '../data/sampleData'
import { Upload, Link2 } from 'lucide-react'

export default function ProfileSources() {
  return (
    <AppLayout title="Profile Source Input" subtitle="Add and manage your external professional sources">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sourceCards.map(([name, status, url, mark]) => <Card key={name}><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 font-extrabold text-forge">{mark}</div><h3 className="font-extrabold text-ink">{name}</h3></div><StatusBadge status={status}/></div><FormField label="Profile URL" defaultValue={url}/><Button className="mt-4 w-full" variant={status === 'Connected' ? 'primary' : 'outline'}>{status === 'Connected' ? <Upload size={16}/> : <Link2 size={16}/>} {status === 'Connected' ? 'Import' : 'Connect'}</Button></Card>)}
      </div>
      <Card className="mt-5" title="Additional Notes / Imported Content"><FormField label="" as="textarea" placeholder="Add any additional notes, context, or paste imported content here..."/><div className="mt-4"><Button>Save Sources</Button></div></Card>
    </AppLayout>
  )
}
