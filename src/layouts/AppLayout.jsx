import Sidebar from '../components/Sidebar'
import MobileNav from '../components/MobileNav'
import TopBar from '../components/TopBar'

export default function AppLayout({ title, subtitle, badge, children, employer = false }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar employer={employer} />
      <main className="lg:pl-60">
        <TopBar
          title={title}
          subtitle={subtitle}
          badge={badge}
          employer={employer}
        />
        <div className="mx-auto max-w-7xl px-4 py-5 pb-24 md:px-7 lg:pb-8">{children}</div>
      </main>
      {!employer && <MobileNav />}
    </div>
  )
}
