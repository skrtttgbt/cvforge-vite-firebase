import { NavLink } from 'react-router-dom'
import { Home, User, Link2, FilePenLine, Monitor, Clock, ShieldCheck, Settings, LogOut, LockKeyhole, Users } from 'lucide-react'
import Logo from './Logo'

const seekerLinks = [
  ['Dashboard', '/dashboard', Home],
  ['Profile Management', '/profile', User],
  ['Profile Sources', '/profile-sources', Link2],
  ['AI Resume Builder', '/resume-builder', FilePenLine],
  ['Web Portfolio', '/web-portfolio', Monitor],
  ['Interview Preparation', '/interview-preparation', Clock],
  ['Token Management', '/token-management', ShieldCheck]
]

const employerLinks = [
  ['Dashboard', '/employer', Home],
  ['Candidate View', '/shared-profile', Users],
  ['Token Management', '/token-management', LockKeyhole]
]

export default function Sidebar({ employer = false }) {
  const links = employer ? employerLinks : seekerLinks
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-gradient-to-b from-navy to-navy2 text-white lg:flex">
      <div className="px-7 py-6"><Logo dark /></div>
      <nav className="flex-1 space-y-1 px-4">
        {links.map(([label, to, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-forge text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-4 py-5">
        <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100"><Settings size={18} /> Settings</a>
        <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100"><LogOut size={18} /> Logout</a>
      </div>
    </aside>
  )
}
