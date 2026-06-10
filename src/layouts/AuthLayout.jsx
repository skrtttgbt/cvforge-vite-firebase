import Logo from '../components/Logo'
import { Link } from 'react-router-dom'
import { FileText, Globe, Sparkles, ShieldCheck } from 'lucide-react'

export default function AuthLayout({ type, children }) {
  const isLogin = type === 'login'
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <header className="flex items-center justify-between bg-navy px-6 py-4 text-white md:px-10">
        <Logo dark />
        <div className="text-sm">{isLogin ? "Don't have an account?" : 'Already have an account?'} <Link className="ml-3 rounded-lg border border-white/40 px-4 py-2 font-bold" to={isLogin ? '/register' : '/login'}>{isLogin ? 'Sign Up' : 'Sign In'}</Link></div>
      </header>
      <main className="grid min-h-[calc(100vh-72px)] grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2 lg:px-16">
        <section className="flex flex-col justify-center">
          <Logo />
          <h1 className="mt-8 text-4xl font-extrabold leading-tight text-ink md:text-5xl">{isLogin ? 'Build Your Future.' : 'Create. Showcase. Get Hired.'}<br /><span className="text-forge">{isLogin ? "We’ve Got the Tools." : 'With CVForge.'}</span></h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">Create professional resumes, stunning portfolios, and prepare for interviews with AI-powered tools.</p>
          <div className="mt-8 grid max-w-lg gap-5">
            <Feature icon={FileText} title="AI-Assisted Resume Builder" text="Create a professional resume that stands out." />
            <Feature icon={Globe} title="Web Portfolio Generator" text="Showcase your projects with a beautiful portfolio." />
            <Feature icon={Sparkles} title="Interview Preparation" text="Practice smarter with AI generated questions." />
            <Feature icon={ShieldCheck} title="Secure & Private" text="Share outputs using token-based access." />
          </div>
        </section>
        <section className="flex items-center justify-center"><div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-10">{children}</div></section>
      </main>
    </div>
  )
}
function Feature({ icon: Icon, title, text }) { return <div className="flex gap-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-forge"><Icon size={22}/></div><div><h3 className="font-bold text-ink">{title}</h3><p className="text-sm text-slate-600">{text}</p></div></div> }
