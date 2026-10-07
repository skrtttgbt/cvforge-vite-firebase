import Logo from '../components/Logo'
import { Link } from 'react-router-dom'
import { FileText, Globe, Sparkles, ShieldCheck } from 'lucide-react'

export default function AuthLayout({ type, children }) {
  const isLogin = type === 'login'
  const isRegister = type === 'register'
  const headerText = isLogin ? "Don't have an account?" : "Already have an account?"
  const headerLink = isLogin ? '/register' : '/login'
  const headerAction = isLogin ? 'Sign Up' : 'Sign In'
  const headline = isLogin ? 'Build Your Future.' : isRegister ? 'Create. Showcase. Get Hired.' : 'Recover Your Account.'
  const accent = isLogin ? "We've Got the Tools." : isRegister ? 'With CVForge.' : 'Get Back to Building.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <header className="flex items-center justify-between bg-navy px-6 py-4 text-white md:px-10" id="header-authlayout">
        <Logo dark />
        <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:gap-0">
          <span>{headerText}</span>

          <Link
            className="rounded-lg border border-white/40 px-4 py-2 font-bold sm:ml-3"
            to={headerLink}
          >
            {headerAction}
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl grid-cols-1 gap-14 px-5 py-10 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-14">
        {/* Left */}
        <section className="flex flex-col justify-center lg:sticky lg:top-10 lg:h-fit">
          
          <div className="origin-left scale-150">
            <Logo />
          </div>

          <h1 className="mt-10 max-w-xl text-4xl font-extrabold leading-tight text-ink md:text-5xl xl:text-6xl">
            {isLogin ? "Build Your Future." : "Create. Showcase. Get Hired."}
            <span className="mt-2 block text-forge">
              {isLogin ? "We've Got the Tools." : "With CVForge."}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            Create professional resumes, build beautiful online portfolios,
            prepare for interviews, and share your professional profile securely
            with AI-powered tools.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <Feature
              icon={FileText}
              title="AI Resume Builder"
              text="Create ATS-friendly resumes in minutes."
            />

            <Feature
              icon={Globe}
              title="Portfolio Generator"
              text="Launch your own professional portfolio website."
            />

            <Feature
              icon={Sparkles}
              title="Interview Practice"
              text="Generate AI-powered interview questions."
            />

            <Feature
              icon={ShieldCheck}
              title="Private Sharing"
              text="Securely share resumes with token-based access."
            />
          </div>
        </section>

        {/* Right */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 md:p-10">
            {children}
          </div>
        </section>
      </main>
    </div>
  )
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-forge">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-bold text-ink">{title}</h3>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
    </div>
  )
}
