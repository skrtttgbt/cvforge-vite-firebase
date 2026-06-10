import React, { createContext, useContext, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { auth, firebaseReady, googleProvider, microsoftProvider } from './services/firebase'
import { createTokenRecord, getTokenRecord, saveUserProfile } from './services/firestoreService'
import { generateAIContent } from './services/aiService'
import { sampleUser, skills, projects, certifications, platforms, interviewQuestions } from './data/sampleData'
import {
  Bell, BriefcaseBusiness, Calendar, Camera, Check, ChevronDown, ClipboardList, Copy, Download, Eye, FileText, Github, Globe, Home, Link2, Lock,
  LogIn, LogOut, Mail, Monitor, PlusCircle, RefreshCw, Save, Send, Settings, Shield, Sparkles, Star, Trash2, User, Users, Wand2, XCircle
} from 'lucide-react'
import './styles/styles.css'

const AppContext = createContext(null)
const useApp = () => useContext(AppContext)

function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(sampleUser)
  const [resume, setResume] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [interview, setInterview] = useState(null)
  const [tokens, setTokens] = useState([
    { token: 'a7f9-3c2d-8b1e-4f5a-9d62-7e3b1c9d8e21', candidate: 'Juan Dela Cruz', accessType: 'Resume & Portfolio', expires: 'May 20, 2026', views: '0 / Unlimited', status: 'Active' },
    { token: 'b1e4-7d9a-3c2b-64fa', candidate: 'Maria Santos', accessType: 'Resume Only', expires: 'May 16, 2026', views: '2 / 5', status: 'Active' },
    { token: 'c3b2-9f8e-1a4d', candidate: 'Alvin Reyes', accessType: 'Resume & Portfolio', expires: 'May 12, 2026', views: '1 / 3', status: 'Expired' }
  ])
  const value = useMemo(() => ({ currentUser, setCurrentUser, profile, setProfile, resume, setResume, portfolio, setPortfolio, interview, setInterview, tokens, setTokens }), [currentUser, profile, resume, portfolio, interview, tokens])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function Logo() {
  return <div className="logo"><div className="logo-mark">C</div><span>CVForge</span></div>
}

function Avatar({ large = false }) {
  return <div className={large ? 'avatar avatar-lg' : 'avatar'}><div className="face"><span /></div></div>
}

function AuthShell({ mode }) {
  const navigate = useNavigate()
  const { setCurrentUser } = useApp()
  const isSignup = mode === 'signup'
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', role: 'jobseeker' })
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      let user = { uid: 'demo-user', email: form.email || 'juan.delacruz@email.com', displayName: form.fullName || 'Juan Dela Cruz', role: form.role }
      if (firebaseReady) {
        const cred = isSignup
          ? await createUserWithEmailAndPassword(auth, form.email, form.password)
          : await signInWithEmailAndPassword(auth, form.email, form.password)
        user = { uid: cred.user.uid, email: cred.user.email, displayName: form.fullName || cred.user.displayName || 'Juan Dela Cruz', role: form.role }
        if (isSignup) await saveUserProfile(cred.user.uid, { ...sampleUser, fullName: user.displayName, email: user.email })
      }
      setCurrentUser(user)
      navigate(form.role === 'employer' ? '/employer/tokens' : '/app/profile')
    } catch (err) {
      setError(err.message || 'Authentication failed. Check your Firebase setup or credentials.')
    }
  }

  async function social(provider) {
    try {
      let user = { uid: 'demo-social', email: 'juan.delacruz@email.com', displayName: 'Juan Dela Cruz', role: 'jobseeker' }
      if (firebaseReady) {
        const cred = await signInWithPopup(auth, provider)
        user = { uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName, role: 'jobseeker' }
      }
      setCurrentUser(user)
      navigate('/app/profile')
    } catch (err) { setError(err.message) }
  }

  return <div className="auth-page">
    <header className="auth-top"><Logo /><div>{isSignup ? 'Already have an account?' : "Don't have an account?"} <button className="small-outline" onClick={() => navigate(isSignup ? '/login' : '/signup')}>{isSignup ? 'Sign In' : 'Sign Up'}</button></div></header>
    <main className="auth-grid">
      <section className="auth-copy">
        <Logo />
        <h1>{isSignup ? 'Create. Showcase. Get Hired.' : <>Build Your Future.<br /><span>We’ve Got the Tools.</span></>}</h1>
        <p>Create professional resumes, stunning portfolios, and prepare for interviews with AI-powered tools.</p>
        <Feature icon={<FileText />} title="AI-Assisted Resume Builder" text="Create a professional resume that stands out." />
        <Feature icon={<Globe />} title="Web Portfolio Generator" text="Showcase your projects with a beautiful portfolio." />
        <Feature icon={<Sparkles />} title="Interview Preparation" text="Prepare smarter with DeepSeek AI." />
        <Feature icon={<Shield />} title="Secure & Private" text="Your data is secure and you’re in control." />
        <div className="trust-box"><Shield size={26}/> Trusted by thousands of ICT students and professionals.</div>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <h2>{isSignup ? 'Create Your Account' : 'Welcome Back!'}</h2>
        <p>{isSignup ? 'Sign up to get started with CVForge' : 'Login to your CVForge account'}</p>
        {isSignup && <Input icon={<User />} label="Full Name" placeholder="Enter your full name" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />}
        <Input icon={<Mail />} label="Email Address" placeholder="Enter your email address" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <Input icon={<Lock />} type="password" label="Password" placeholder={isSignup ? 'Create a password' : 'Enter your password'} value={form.password} onChange={v => setForm({ ...form, password: v })} />
        {isSignup && <Input icon={<Lock />} type="password" label="Confirm Password" placeholder="Confirm your password" value={form.confirm} onChange={v => setForm({ ...form, confirm: v })} />}
        <label className="label">Account Type</label>
        <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="jobseeker">ICT Job Seeker</option><option value="employer">Employer / HR</option></select>
        {!isSignup && <div className="auth-row"><label><input type="checkbox" defaultChecked /> Remember me</label><a>Forgot Password?</a></div>}
        {isSignup && <label className="checkline"><input type="checkbox" required /> I agree to the <a>Terms of Service</a> and <a>Privacy Policy</a></label>}
        {error && <div className="error-box">{error}</div>}
        <button className="primary wide" type="submit">{isSignup ? <User /> : <LogIn />} {isSignup ? 'Create Account' : 'Login'}</button>
        <div className="divider">or continue with</div>
        <div className="social-row"><button type="button" onClick={() => social(googleProvider)}>G Continue with Google</button><button type="button" onClick={() => social(microsoftProvider)}>▦ Continue with Microsoft</button></div>
        <small>By {isSignup ? 'creating an account' : 'logging in'}, you agree to our <a>Terms of Service</a> and <a>Privacy Policy</a>.</small>
      </form>
    </main>
  </div>
}

function Feature({ icon, title, text }) { return <div className="feature"><div>{icon}</div><span><b>{title}</b><small>{text}</small></span></div> }
function Input({ icon, label, value, onChange, placeholder, type = 'text' }) { return <label className="field"><span>{label}</span><div className="input-wrap">{icon}<input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div></label> }

const jobLinks = [
  ['Dashboard', Home, '/app/dashboard'], ['Profile Management', User, '/app/profile'], ['Profile Sources', Link2, '/app/sources'], ['AI Resume Builder', Wand2, '/app/resume'], ['Web Portfolio', Monitor, '/app/portfolio'], ['Interview Preparation', Calendar, '/app/interview'], ['Token Management', Shield, '/app/tokens']
]
const employerLinks = [['Dashboard', Home, '/employer/dashboard'], ['Candidate View', User, '/shared/demo'], ['Evaluated Candidates', ClipboardList, '/employer/evaluated'], ['Shortlisted Candidates', Star, '/employer/shortlisted'], ['Token Management', Shield, '/employer/tokens'], ['Token History', FileText, '/employer/history'], ['Team Members', Users, '/employer/team']]

function Layout({ children, employer = false }) {
  const { profile, setCurrentUser } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const links = employer ? employerLinks : jobLinks
  return <div className="layout">
    <aside className="sidebar"><Logo /><nav>{links.map(([label, Icon, path]) => <button key={path} className={location.pathname === path ? 'active' : ''} onClick={() => navigate(path)}><Icon size={19}/>{label}</button>)}</nav><div className="side-bottom"><button><Settings size={19}/>Settings</button><button onClick={() => { setCurrentUser(null); navigate('/login') }}><LogOut size={19}/>Logout</button></div></aside>
    <section className="main"><Topbar profile={profile} employer={employer}/>{children}</section>
  </div>
}
function Topbar({ profile, employer }) { return <div className="topbar"><div></div><div className="top-actions"><Bell size={20}/><div className="top-user"><Avatar /><div><b>{employer ? 'HR Manager' : profile.fullName}</b><small>{employer ? 'Acme Solutions Inc.' : 'ICT Job Seeker'}</small></div><ChevronDown size={16}/></div></div></div> }
function PageHeader({ title, subtitle, badge }) { return <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{badge && <span className="ai-badge">{badge}</span>}</div> }
function Card({ children, className = '' }) { return <div className={`card ${className}`}>{children}</div> }
function Tabs({ items, active, onChange }) { return <div className="tabs">{items.map(x => <button key={x} className={active === x ? 'active' : ''} onClick={() => onChange(x)}>{x}</button>)}</div> }

function Dashboard() { return <Layout><PageHeader title="Dashboard" subtitle="Your CVForge workspace overview"/><div className="dashboard-grid"><Stat title="Profile Completion" value="86%"/><Stat title="Connected Sources" value="3 / 8"/><Stat title="Generated Drafts" value="12"/><Stat title="Active Tokens" value="2"/></div><div className="two-col"><Card><h3>Recent Activity</h3>{['Resume draft generated', 'LinkedIn source imported', 'Portfolio preview updated', 'Access token created'].map(x => <div className="activity" key={x}><Check size={18}/>{x}<small>Today</small></div>)}</Card><Card><h3>Quick Tips</h3><Tip text="Keep your profile updated."/><Tip text="Add complete information for better AI-generated results."/><Tip text="Upload a clear profile photo."/></Card></div></Layout> }
function Stat({ title, value }) { return <Card className="stat"><small>{title}</small><strong>{value}</strong></Card> }
function Tip({ text }) { return <p className="tip"><Check size={17}/>{text}</p> }

function ProfilePage() {
  const { profile, setProfile, currentUser } = useApp(); const [tab, setTab] = useState('Personal Information'); const [saved, setSaved] = useState(false)
  async function save() { await saveUserProfile(currentUser?.uid || 'demo-user', profile); setSaved(true); setTimeout(() => setSaved(false), 1400) }
  return <Layout><PageHeader title="Profile Management" subtitle="Manage and update your professional information"/><Card><Tabs items={['Personal Information','Education','Experience','Skills','Projects','Certifications','Links']} active={tab} onChange={setTab}/><div className="profile-grid"><div><h3>{tab}</h3>{tab === 'Personal Information' ? <>
    <FormRow label="Full Name" value={profile.fullName} onChange={v => setProfile({ ...profile, fullName: v })}/><FormRow label="Email Address" value={profile.email} onChange={v => setProfile({ ...profile, email: v })}/><FormRow label="Phone Number" value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })}/><FormRow label="Location" value={profile.location} onChange={v => setProfile({ ...profile, location: v })}/><FormRow label="Target ICT Role" value={profile.targetRole} onChange={v => setProfile({ ...profile, targetRole: v })}/><label className="form-row"><span>Professional Summary</span><textarea value={profile.summary} onChange={e => setProfile({ ...profile, summary: e.target.value })}/></label>
  </> : <SectionEditor title={tab}/>}<button className="primary" onClick={save}><Save size={16}/> {saved ? 'Saved!' : 'Save Changes'}</button></div><aside><Card className="photo-card"><h3>Profile Photo</h3><Avatar large/><button className="outline"><Camera size={16}/>Change Photo</button><small>JPG, PNG (Max. 2MB)</small></Card><Card><h3>Quick Tips</h3><Tip text="Keep your profile updated."/><Tip text="Add complete information for better AI-generated results."/><Tip text="Upload a clear profile photo."/></Card></aside></div></Card></Layout>
}
function SectionEditor({ title }) { return <div className="placeholder-editor"><p>Add and manage your {title.toLowerCase()} records here. This prototype keeps the UI ready for Firestore CRUD.</p><button className="outline"><PlusCircle size={16}/> Add {title}</button></div> }
function FormRow({ label, value, onChange }) { return <label className="form-row"><span>{label}</span><input value={value} onChange={e => onChange(e.target.value)} /></label> }

function SourcesPage() { const [notes, setNotes] = useState(''); return <Layout><PageHeader title="Profile Source Input" subtitle="Add and manage your external professional sources"/><div className="source-grid">{platforms.map(p => <Card className="source-card" key={p.name}><div className="source-head"><div className="platform-icon" style={{'--p': p.color}}>{p.name[0]}</div><b>{p.name}</b><span className={p.connected ? 'status connected' : 'status'}>{p.connected ? 'Connected' : 'Not Connected'}</span></div><label>Profile URL</label><input defaultValue={p.url}/><button className={p.connected ? 'primary wide' : 'outline wide'}>{p.connected ? <Download size={15}/> : <Link2 size={15}/>} {p.connected ? 'Import' : 'Connect'}</button></Card>)}</div><Card><label className="full-text"><span>Additional Notes / Imported Content (Optional)</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add any additional notes, context, or paste imported content here..."/><small>{notes.length} / 2000</small></label><button className="primary"><Save size={16}/>Save Sources</button></Card></Layout> }

function ResumePage() { const { profile, resume, setResume } = useApp(); const [loading, setLoading] = useState(false); async function gen(){ setLoading(true); setResume(await generateAIContent('resume',{profile})); setLoading(false)} return <Layout><PageHeader title="AI-Assisted Resume Builder" subtitle="Generate an employer-ready resume using your approved profile data" badge="Powered by DeepSeek AI"/><div className="workspace"><Card><h3>Resume Configuration</h3>{['Target ICT Role','Experience Level','Resume Tone','Resume Length','Preferred Template','Source Content'].map((x,i)=><label className="form-row" key={x}><span>{x}</span><select><option>{i===0?profile.targetRole:i===1?profile.experienceLevel:i===2?'Professional':i===3?'1 Page':i===4?'Modern Blue (Recommended)':'All Connected Sources'}</option></select></label>)}<h4>Include in Resume</h4><div className="check-grid">{['Professional Summary','Technical Skills','Work Experience','Projects','Certifications','Education','Portfolio Links'].map(x=><label key={x}><input type="checkbox" defaultChecked/> {x}</label>)}</div><textarea placeholder="Add any specific instructions, focus areas, or keywords..."/><button className="primary wide" onClick={gen} disabled={loading}>{loading?<RefreshCw className="spin"/>:<Wand2/>}{loading?'Generating...':'Generate Resume'}</button><button className="outline wide"><RefreshCw/>Regenerate</button><div className="info-box">AI-generated content is based on your profile data. Review before submitting.</div></Card><ResumePreview resume={resume} profile={profile}/></div></Layout> }
function ResumePreview({ resume, profile }) { const generated = resume || { summary: profile.summary, bullets: ['Built full-stack applications using React, Node.js, and databases.', 'Implemented authentication, APIs, and responsive interfaces.', 'Designed RESTful APIs and optimized database queries.'] }; return <Card className="preview"><div className="preview-head"><h3>Resume Preview <span className="green-tag">AI Generated Draft</span></h3><div><button className="icon-btn"><Eye size={16}/></button><button className="icon-btn"><Download size={16}/></button></div></div><div className="resume-paper"><h2>{profile.fullName.toUpperCase()}</h2><b>{profile.targetRole}</b><p className="resume-contact">{profile.email} • {profile.phone} • {profile.location} • jdelacruz.dev</p><h4>PROFESSIONAL SUMMARY</h4><p>{generated.summary}</p><h4>PROJECTS</h4>{projects.slice(0,2).map(p=><div key={p.title}><b>{p.title}</b><small> | {p.stack}</small><ul><li>{p.desc}</li></ul></div>)}<h4>TECHNICAL SKILLS</h4><div className="skill-cloud">{skills.slice(0,14).map(s=><span key={s}>{s}</span>)}</div><h4>CERTIFICATIONS</h4><ul>{certifications.map(c=><li key={c}>{c}</li>)}</ul></div><div className="preview-actions"><button className="outline"><Save/>Save Draft</button><button className="outline"><RefreshCw/>Regenerate</button><button className="primary"><Download/>Download PDF</button></div></Card> }

function PortfolioPage() { const { profile, portfolio, setPortfolio } = useApp(); const [loading, setLoading] = useState(false); async function gen(){ setLoading(true); setPortfolio(await generateAIContent('portfolio',{profile})); setLoading(false)} const data = portfolio || { headline: `${profile.fullName} — ${profile.targetRole}`, bio: profile.summary }; return <Layout><PageHeader title="Web Portfolio Generator" subtitle="Create and customize your professional online portfolio"/><div className="workspace"><Card><h3>Portfolio Configuration</h3><FormRow label="Portfolio Title" value={`${profile.fullName} — ${profile.targetRole}`} onChange={()=>{}}/><FormRow label="Portfolio Slug / URL" value="cvforge.app/juandelacruz" onChange={()=>{}}/><label className="form-row"><span>Theme Style</span><select><option>Modern Blue</option></select></label><label className="form-row"><span>Visibility</span><select><option>Private / Token-share ready</option></select></label><h4>Include in Portfolio</h4><div className="check-grid">{['About Me','Technical Skills','Featured Projects','Resume Download','Certifications','Work Experience','Contact Links'].map(x=><label key={x}><input type="checkbox" defaultChecked/> {x}</label>)}</div><textarea defaultValue={profile.summary}/><button className="primary wide" onClick={gen}>{loading?<RefreshCw className="spin"/>:<Sparkles/>}{loading?'Generating...':'Generate Portfolio'}</button><button className="outline wide"><Eye/>Preview Live</button><div className="info-box">AI-enhanced content is based on your profile and sources.</div></Card><Card className="portfolio-preview"><div className="preview-head"><h3>Portfolio Preview <span className="green-tag">AI Enhanced</span></h3><div><button className="icon-btn"><Monitor size={16}/></button><button className="icon-btn"><Eye size={16}/></button></div></div><div className="portfolio-frame"><nav><b>Juan Dela Cruz</b><span>About</span><span>Skills</span><span>Projects</span><span>Contact</span></nav><section className="hero"><div><small>Hello, I'm</small><h2>{profile.fullName}</h2><b>{profile.targetRole}</b><p>{data.bio}</p><button className="primary small">Download Resume</button><button className="outline small">Contact Me</button></div><Avatar large/></section><div className="portfolio-sections"><Panel title="About Me" text={profile.summary}/><Panel title="Technical Skills" tags={skills.slice(0,16)}/><Panel title="Featured Projects" projects={projects}/><Panel title="Certifications" list={certifications}/></div></div><div className="preview-actions"><button className="outline"><Save/>Save Draft</button><button className="outline"><RefreshCw/>Regenerate</button><button className="primary"><Send/>Publish Portfolio</button></div></Card></div></Layout> }
function Panel({ title, text, tags, projects: ps, list }) { return <div className="panel"><h4>{title}</h4>{text&&<p>{text}</p>}{tags&&<div className="skill-cloud">{tags.map(t=><span key={t}>{t}</span>)}</div>}{ps&&ps.map(p=><div className="mini-project" key={p.title}><b>{p.title}</b><small>{p.desc}</small><a>View Project ↗</a></div>)}{list&&<ul>{list.map(x=><li key={x}>{x}</li>)}</ul>}</div> }

function InterviewPage() { const { profile, interview, setInterview } = useApp(); const [loading,setLoading]=useState(false); async function analyze(){setLoading(true); setInterview(await generateAIContent('interview',{profile})); setLoading(false)} const fb = interview || { score:'Good', feedback:'You demonstrated solid technical knowledge and practical experience. Continue refining your depth and clarity.', strengths:['Clear communication and structured answers','Good use of real examples from projects','Strong understanding of modern web technologies'], improvements:['Provide more quantitative results and metrics','Explain trade-offs and alternative solutions','Expand on system design and scalability aspects'] }; return <Layout><PageHeader title="Interview Preparation" subtitle="Practice ICT job interviews with DeepSeek AI-generated questions and feedback" badge="Powered by DeepSeek AI"/><div className="interview-grid"><Card><h3>Interview Session Setup</h3>{['Target ICT Role','Interview Type','Experience Level','Difficulty'].map((x,i)=><label className="form-row" key={x}><span>{x}</span><select><option>{i===0?profile.targetRole:i===1?'Technical + HR':i===2?profile.experienceLevel:'Intermediate'}</option></select></label>)}<h4>Focus Areas</h4><div className="check-grid">{['JavaScript','React','APIs','Databases','Problem Solving','Communication'].map(x=><label key={x}><input type="checkbox" defaultChecked/> {x}</label>)}</div><textarea placeholder="Add any specific role context..."/><button className="primary wide">Start Mock Interview</button><button className="outline wide">Generate Questions</button></Card><Card className="chat-card"><h3>Mock Interview Workspace <span className="green-tag">Live Session</span></h3>{interviewQuestions.map((q,i)=><div className="qa" key={q}><b>{i+1}. DeepSeek AI</b><p>{q}</p><div className="answer"><b>You</b><p>{i===0?'I built a task management API using Node.js, Express, and MongoDB with authentication, CRUD operations, role-based access, and Swagger documentation.':'I use React.memo, useCallback, lazy loading, code splitting, and state management optimization to reduce unnecessary renders.'}</p></div><div className="score-row"><span>Relevance 4/5</span><span>Clarity 4/5</span><span>Technical Depth 4/5</span><span>Confidence 4/5</span></div></div>)}<button className="primary" onClick={analyze}>{loading?<RefreshCw className="spin"/>:<Sparkles/>}Analyze Response</button><button className="outline"><Save/>Save Session</button><button className="outline"><Download/>Export Feedback</button></Card><Card><h3>DeepSeek AI Feedback</h3><div className="overall">Overall Assessment <span>{fb.score}</span></div><p>{fb.feedback}</p><h4>Strengths</h4><ul>{fb.strengths.map(x=><li key={x}>{x}</li>)}</ul><h4>Areas to Improve</h4><ul>{fb.improvements.map(x=><li key={x}>{x}</li>)}</ul><h4>Suggested Keywords</h4><div className="skill-cloud">{['Scalability','Performance Tuning','System Design','Caching','JWT','CI/CD','Testing'].map(x=><span key={x}>{x}</span>)}</div></Card></div></Layout> }

function TokenPage({ employer=false }) { const { profile, tokens, setTokens } = useApp(); const [selected, setSelected] = useState('Resume & Portfolio'); const [expiry,setExpiry]=useState('7 Days'); const [generated,setGenerated]=useState(tokens[0]?.token || '')
  async function generate(){ const t = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; const short=t.slice(0,8)+'-'+t.slice(9,13)+'-'+t.slice(-8); const rec={ token:short, candidate: profile.fullName, accessType:selected, expires:'7 days from now', views:'0 / Unlimited', status:'Active' }; setGenerated(short); setTokens([rec,...tokens]); await createTokenRecord(short,{...rec, ownerId:'demo-user', profile, selected, expiry}) }
  return <Layout employer={employer}><PageHeader title="Generate Access Token" subtitle="Create a secure token to share a candidate’s resume or portfolio."/><Card><div className="steps"><span className="done">1 Select Candidate</span><span className="done">2 Set Access</span><span className="done">3 Generate Token</span><span>4 Share Token</span></div><div className="token-grid"><div><h3>1. Select Candidate</h3><select className="input"><option>{profile.fullName} — {profile.targetRole}</option></select><h3>2. Set Access & Permissions</h3><div className="option-row"><button className={selected==='Resume & Portfolio'?'selected':''} onClick={()=>setSelected('Resume & Portfolio')}><FileText/>Full Access<br/><small>Resume & Portfolio</small></button><button className={selected==='Resume Only'?'selected':''} onClick={()=>setSelected('Resume Only')}><FileText/>Resume Only</button></div><label className="form-row"><span>Token Expiration</span><select value={expiry} onChange={e=>setExpiry(e.target.value)}><option>7 Days</option><option>14 Days</option><option>30 Days</option></select></label><label><input type="checkbox" defaultChecked/> Allow download of resume</label><button className="primary wide" onClick={generate}><Lock/>Generate Token</button></div><div><h3>3. Generated Token</h3><div className="success"><Check/> Token generated successfully!</div><label>Access Token</label><div className="copy-field"><input value={generated} readOnly/><button><Copy size={16}/></button></div><label>Shareable Link</label><div className="copy-field"><input value={`${location.origin}/access?token=${generated}`} readOnly/><button><Copy size={16}/></button></div><button className="outline"><Link2/>Copy Link</button><button className="outline"><Mail/>Share via Email</button><button className="danger"><Trash2/>Revoke Token</button></div><div><h3>How Tokens Work</h3><Feature icon={<Shield/>} title="Secure Access" text="Tokens provide secure, time-bound access."/><Feature icon={<Calendar/>} title="Set Expiration" text="Choose when the token expires automatically."/><Feature icon={<Eye/>} title="Track Usage" text="Monitor who accessed the profile and when."/><Feature icon={<XCircle/>} title="Revoke Anytime" text="Cancel any token at any time."/></div></div><h3>Recent Tokens</h3><table><thead><tr><th>Candidate</th><th>Token</th><th>Access Type</th><th>Expires On</th><th>Views</th><th>Status</th><th>Action</th></tr></thead><tbody>{tokens.map(t=><tr key={t.token}><td>{t.candidate}</td><td><code>{t.token}</code></td><td>{t.accessType}</td><td>{t.expires}</td><td>{t.views}</td><td><span className={t.status==='Active'?'status connected':'status'}>{t.status}</span></td><td><button className="icon-btn"><Eye size={15}/></button></td></tr>)}</tbody></table></Card></Layout> }

function AccessPage() { const navigate = useNavigate(); const [token,setToken]=useState(''); return <div className="public-page"><header className="public-top"><Logo/><div><BriefcaseBusiness size={18}/> For ICT Job Seekers</div></header><main className="access-box"><h1>Access Shared Resume or Portfolio</h1><p>Enter the access token provided by the ICT job seeker to view their resume or portfolio.</p><Card><div className="access-grid"><div className="token-entry"><div className="big-icon"><Lock/></div><h2>Enter Access Token</h2><p>Please enter the access token below.</p><input value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter access token here..."/><button className="primary wide" onClick={()=>navigate(`/shared/${token || 'demo'}`)}><Lock/>Access Profile</button><div className="info-box">The token is a unique link or code shared by the ICT job seeker to allow you to view their professional information.</div></div><div className="how"><h2>How It Works</h2><Feature icon={<Link2/>} title="1. Receive Token" text="The ICT job seeker shares a token or link with you."/><Feature icon={<Shield/>} title="2. Enter Token" text="Paste the token and click Access Profile."/><Feature icon={<Eye/>} title="3. View Profile" text="You can view the shared resume or portfolio securely."/></div></div><div className="warning">Important: If the token is invalid, expired, or revoked, you will not be able to access the profile.</div></Card></main></div> }

function SharedViewer() { const { token } = useParams(); const { profile } = useApp(); return <div className="shared-layout"><aside className="shared-side"><Logo/><nav>{['Overview','Resume','Portfolio','Projects','Experience','Certifications','Contact'].map((x,i)=><button className={i===0?'active':''} key={x}>{x}</button>)}</nav><div className="secure-note"><Shield/> <b>Secure Access</b><small>You are viewing a shared profile. Information is provided by the ICT job seeker.</small></div></aside><main className="shared-main"><div className="shared-top"><span>Shared Profile Viewer (Employer / HR)</span><span>Token ID: {(token||'87fa').slice(0,4)}...b2c9</span><button className="outline"><Copy/>Copy Link</button></div><section className="candidate-hero"><Avatar large/><div><h1>{profile.fullName}</h1><h3>{profile.targetRole}</h3><p>{profile.summary}</p><div className="contact-row"><span>{profile.email}</span><span>{profile.phone}</span><span>{profile.location}</span></div><div className="contact-row"><Github/><Globe/><Link2/></div></div><Card><h3>Profile Information</h3><p><b>Target Role</b><span>{profile.targetRole}</span></p><p><b>Experience Level</b><span>Entry Level</span></p><p><b>Availability</b><span>Open to Opportunities</span></p><p><b>Last Updated</b><span>May 12, 2026</span></p></Card></section><Tabs items={['Overview','Resume','Portfolio','Projects','Experience','Certifications','Contact']} active="Overview" onChange={()=>{}}/><div className="viewer-grid"><Card><h3>Professional Summary</h3><p>{profile.summary}</p></Card><Card><h3>Skills</h3><div className="skill-cloud">{skills.slice(0,12).map(s=><span key={s}>{s}</span>)}</div></Card><Card><h3>Work Experience</h3><b>Web Developer Intern | ABC Solutions</b><ul><li>Developed and maintained applications using React and Node.js.</li><li>Collaborated with team in designing APIs and database structures.</li><li>Participated in debugging and improving system performance.</li></ul></Card><Card><h3>Top Projects</h3>{projects.slice(0,2).map(p=><div className="mini-project" key={p.title}><b>{p.title}</b><small>{p.desc}</small><a>View Project ↗</a></div>)}</Card><Card><h3>Education</h3><b>Bachelor of Science in Information and Communication Technology</b><p>Tarlac State University — 2020–2024</p></Card><Card><h3>Certifications</h3><ul>{certifications.map(c=><li key={c}>{c}</li>)}</ul></Card></div><div className="viewer-actions"><button className="primary"><Download/>Download Resume (PDF)</button><button className="outline">Print Profile</button></div></main></div> }

function EmployerDashboard() { return <Layout employer><PageHeader title="Employer / HR Dashboard" subtitle="Review shared candidates and token activity"/><div className="dashboard-grid"><Stat title="Active Tokens" value="8"/><Stat title="Candidates Viewed" value="24"/><Stat title="Shortlisted" value="6"/><Stat title="Expired Tokens" value="3"/></div><Card><h3>Recent Candidate Reviews</h3><table><tbody>{['Juan Dela Cruz','Maria Santos','Alvin Reyes'].map(x=><tr key={x}><td>{x}</td><td>Full Stack Developer</td><td><span className="status connected">Verified Profile</span></td><td><button className="outline small">Open</button></td></tr>)}</tbody></table></Card></Layout> }
function Placeholder({ employer=false, title='Coming Soon' }) { return <Layout employer={employer}><PageHeader title={title} subtitle="This page is ready for your next module implementation."/><Card><p>Connect this page to Firestore and your evaluation workflow when needed.</p></Card></Layout> }

function App() { return <BrowserRouter><AppProvider><Routes><Route path="/" element={<Navigate to="/login"/>}/><Route path="/login" element={<AuthShell mode="login"/>}/><Route path="/signup" element={<AuthShell mode="signup"/>}/><Route path="/access" element={<AccessPage/>}/><Route path="/shared/:token" element={<SharedViewer/>}/><Route path="/app/dashboard" element={<Dashboard/>}/><Route path="/app/profile" element={<ProfilePage/>}/><Route path="/app/sources" element={<SourcesPage/>}/><Route path="/app/resume" element={<ResumePage/>}/><Route path="/app/portfolio" element={<PortfolioPage/>}/><Route path="/app/interview" element={<InterviewPage/>}/><Route path="/app/tokens" element={<TokenPage/>}/><Route path="/employer/dashboard" element={<EmployerDashboard/>}/><Route path="/employer/tokens" element={<TokenPage employer/>}/><Route path="/employer/evaluated" element={<Placeholder employer title="Evaluated Candidates"/>}/><Route path="/employer/shortlisted" element={<Placeholder employer title="Shortlisted Candidates"/>}/><Route path="/employer/history" element={<Placeholder employer title="Token History"/>}/><Route path="/employer/team" element={<Placeholder employer title="Team Members"/>}/><Route path="*" element={<Navigate to="/login"/>}/></Routes></AppProvider></BrowserRouter> }

createRoot(document.getElementById('root')).render(<App />)
