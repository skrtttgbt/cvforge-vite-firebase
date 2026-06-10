import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { FileText, Globe, MessageSquare, ShieldCheck } from 'lucide-react'

import { onAuthChange } from '../services/authService'
import { getProfile } from '../services/firestoreService'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      try {
        if (!user) {
          setProfile(null)
          setLoading(false)
          return
        }

        const data = await getProfile(user.uid)

        setProfile(data)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const stats = [
    ['Profile Completion', profile?.completion || '0%'],
    ['Sources Connected', profile?.sourcesConnected || '0 / 8'],
    ['Resume Drafts', profile?.resumeDrafts || '0'],
    ['Active Tokens', profile?.activeTokens || '0'],
  ]

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <p>Loading...</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Overview of your CVForge workspace"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card
          title="Candidate Snapshot"
          className="xl:col-span-2"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-blue-100 text-5xl">
              👨‍💻
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-ink">
                {profile?.fullName || 'No Name'}
              </h2>

              <p className="font-bold text-forge">
                {profile?.targetRole || 'No Target Role'}
              </p>

              <p className="mt-3 max-w-2xl text-slate-600">
                {profile?.summary || 'No summary available'}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid gap-3">
            <Button>
              <FileText size={16} />
              Generate Resume
            </Button>

            <Button variant="outline">
              <Globe size={16} />
              Create Portfolio
            </Button>

            <Button variant="outline">
              <MessageSquare size={16} />
              Practice Interview
            </Button>

            <Button variant="outline">
              <ShieldCheck size={16} />
              Generate Token
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}