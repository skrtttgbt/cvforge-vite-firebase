import { NavLink } from 'react-router-dom'
import { Home, User, Link2, FilePenLine, Monitor, Clock, ShieldCheck } from 'lucide-react'

const links = [
  ['/dashboard', Home], ['/profile', User], ['/profile-sources', Link2], ['/resume-builder', FilePenLine], ['/web-portfolio', Monitor], ['/interview-preparation', Clock], ['/token-management', ShieldCheck]
]

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-7 border-t border-slate-200 bg-white lg:hidden">
      {links.map(([to, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `grid place-items-center py-3 ${isActive ? 'text-forge' : 'text-slate-500'}`}><Icon size={20} /></NavLink>)}
    </nav>
  )
}
