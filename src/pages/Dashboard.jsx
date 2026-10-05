import { useEffect, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { FileText, Globe, MessageSquare, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { onAuthChange } from '../services/authservice'
import {
  getProfile,
  getProfileSources,
  getResumeDraft,
  getTokensByOwner,
} from '../services/firestoreService'
import { getIncompleteSections } from '../utils/profileValidation'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [dashboardStats, setDashboardStats] = useState({
    profileCompletion: '0%',
    sourcesConnected: '0 / 8',
    resumeDrafts: '0',
    activeTokens: '0',
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      try {
        if (!user) {
          setProfile(null)
          setDashboardStats({
            profileCompletion: '0%',
            sourcesConnected: '0 / 8',
            resumeDrafts: '0',
            activeTokens: '0',
          })
          setLoading(false)
          return
        }

        const [data, savedSources, savedDraft, savedTokens] = await Promise.all([
          getProfile(user.uid),
          getProfileSources(user.uid),
          getResumeDraft(user.uid),
          getTokensByOwner(user.uid),
        ])

        setProfile(data)
        setDashboardStats(buildDashboardStats(data, savedSources, savedDraft, savedTokens))
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const stats = [
    ['Profile Completion', dashboardStats.profileCompletion],
    ['Sources Connected', dashboardStats.sourcesConnected],
    ['Resume Drafts', dashboardStats.resumeDrafts],
    ['Active Tokens', dashboardStats.activeTokens],
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
            {profile?.fullName|| profile?.displayName || profile?.targetRole ? (
            <div>
              <h2 className="text-2xl font-extrabold text-ink">
                {profile?.fullName || profile?.displayName || 'No Name'}
              </h2>

              <p className="font-bold text-forge">
                {profile?.targetRole || 'No Target Role'}
              </p>

              <p className="mt-3 max-w-2xl text-slate-600">
                {profile?.summary || 'No summary available'}
              </p>
            </div>

            ):(
              <div>
                <p className="text-slate-500">  No profile information available. Please complete your profile to see a snapshot here.</p>
                <Button className="mt-3" variant="outline" onClick={() => navigate('/profile')}>
                  Complete Profile
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid gap-3">
            <Button onClick={() => navigate('/resume-builder')}>
              <FileText size={16} />
              Generate Resume
            </Button>

            <Button variant="outline" onClick={() => navigate('/web-portfolio')}>
              <Globe size={16} />
              Create Portfolio
            </Button>

            <Button variant="outline" onClick={() => navigate('/interview-preparation')}>
              <MessageSquare size={16} />
              Practice Interview
            </Button>

            <Button variant="outline" onClick={() => navigate('/token-management')}>
              <ShieldCheck size={16} />
              Generate Token
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

function buildDashboardStats(profile, savedSources, savedDraft, savedTokens) {
  const totalSections = 6
  const incompleteSections = getIncompleteSections(profile || {})
  const completedSections = Math.max(totalSections - incompleteSections.length, 0)
  const profileCompletion = `${Math.round((completedSections / totalSections) * 100)}%`

  const sources = Array.isArray(savedSources?.sources) ? savedSources.sources : []
  const connectedSources = sources.filter((source) =>
    ['Connected', 'Imported'].includes(source.status)
  ).length
  const totalSources = sources.length || 8

  const resumeDrafts = savedDraft?.draft || savedDraft?.resume ? '1' : '0'
  const activeTokens = (savedTokens || []).filter(isActiveToken).length.toString()

  return {
    profileCompletion,
    sourcesConnected: `${connectedSources} / ${totalSources}`,
    resumeDrafts,
    activeTokens,
  }
}

function isActiveToken(token) {
  if (!token || token.status === 'Revoked') return false

  const expiresAt = token.expiresAt?.toDate?.() || (token.expiresAt ? new Date(token.expiresAt) : null)

  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
    return false
  }

  if (token.maxViews && (token.views || 0) >= token.maxViews) {
    return false
  }

  return (token.status || 'Active') === 'Active'
}
