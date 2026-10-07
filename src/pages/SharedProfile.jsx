import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { findToken } from "../services/firestoreService";
import ResumePreview from "../components/ResumePreview";
import { PortfolioPreview } from "./WebPortfolio";
import Button from '../components/Button';
import Card from '../components/Card';
import AppLayout from '../layouts/AppLayout';
import { safeUrl } from '../utils/grounding';
import { Globe, FileText, Link2, Download, ShieldCheck } from 'lucide-react';
import { normalizeResume } from '../utils/resumeContent';
import ProfileAvatar from '../components/ProfileAvatar';
export default function SharedProfile() {
  const { tokenValue } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const redemption = useRef(null);
  const resumeRef = useRef(null);
  const [view,setView] = useState('dashboard');
  const [showContact,setShowContact] = useState(false);
  const [downloading,setDownloading] = useState(false);
  const [downloadError,setDownloadError] = useState('');
  const outputWindows=useRef(new Map());
  useEffect(()=>{
    const receive=event=>{
      const request=outputWindows.current.get(event.data?.nonce);
      if(event.origin!==window.location.origin || !request || request.window!==event.source || event.data?.type!=='cvforge-output-ready' || event.data.tokenValue!==tokenValue || event.data.outputType!==request.type) return;
      event.source.postMessage({type:'cvforge-output',nonce:event.data.nonce,output:request.output},window.location.origin);
      outputWindows.current.delete(event.data.nonce);
    };
    window.addEventListener('message',receive);
    return ()=>{window.removeEventListener('message',receive);outputWindows.current.clear();};
  },[tokenValue]);
  function openOutput(type) {
    const draft=type==='portfolio'?token?.sharedPortfolio:token?.sharedResume;
    if(!draft) return;
    const nonce=crypto.randomUUID();
    const child=window.open(`/employer-view/${encodeURIComponent(tokenValue)}/${type}?request=${nonce}`,'_blank');
    if(!child){setDownloadError('Your browser blocked the new tab. Allow popups for CVForge and try again.');return;}
    outputWindows.current.set(nonce,{window:child,type,output:{draft,sources:type==='portfolio'?sources:[]}});
  }
  useEffect(() => {
    let active = true;
    setToken(null);
    setError("");
    setView('dashboard');
    setShowContact(false);
    // StrictMode repeats effects in development; consume one view per page load.
    if (redemption.current?.id !== tokenValue) {
      redemption.current = { id: tokenValue, promise: location.state?.sharedToken
        ? Promise.resolve(location.state.sharedToken) : findToken(tokenValue) };
      // Use the already-redeemed response once. Reloading must revalidate
      // expiry, revocation and remaining views instead of replaying history.
      if (location.state?.sharedToken) navigate(location.pathname, {replace:true,state:null});
    }
    const load = async () => {
      try {
        const data = await redemption.current.promise;
        if (active) {
          if (!data) setError("Invalid, expired, revoked, or exhausted token.");
          else setToken(data);
        }
      } catch {
        if (active)
          setError("Access denied. This token is no longer available.");
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tokenValue]);
  async function downloadResume() {
    if (!token?.sharedResume || !token.allowDownload || downloading || !resumeRef.current) return;
    setDownloading(true);setDownloadError('');
    try {
      const {default:html2pdf}=await import('html2pdf.js');
      const name=(token.sharedResume.resume?.fullName || 'candidate').replace(/[^a-z0-9_-]+/gi,'-');
      await html2pdf().set({filename:`${name}-resume.pdf`,margin:0.35,html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'in',format:'letter',orientation:'portrait'}}).from(resumeRef.current).save();
    } catch {setDownloadError('Unable to download the resume. Please try again.');}
    finally {setDownloading(false);}
  }
  const candidate=token?.sharedPortfolio?.resume || token?.sharedResume?.resume || {};
  const sources=(token?.sharedSources || []).filter(source=>safeUrl(source.url));
  const resume=normalizeResume(token?.sharedResume?.resume),portfolio=normalizeResume(token?.sharedPortfolio?.resume);
  const sectionRows=Object.fromEntries(['projects','certifications','education'].map(key=>[key,portfolio[key].length?portfolio[key]:resume[key]]));
  const sectionTitles={projects:'Projects',certifications:'Certificates',education:'Educational Background'};
  return (
    <AppLayout employer title="Employer / HR Dashboard" subtitle="Review shared candidates through token-based access" onEmployerDashboard={()=>setView('dashboard')} employerSections={Object.fromEntries(Object.entries(sectionRows).map(([key,rows])=>[key,Boolean(token && rows.length)]))} onEmployerSection={setView} employerSection={view}>
      <p className="mb-4 text-slate-600">View the candidate information authorized by this token.</p>
      {error && <p role="alert">{error}</p>}
      {!token && !error && <p>Loading authorized content…</p>}
      {token && view === 'dashboard' && <>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[[ 'Web Portfolios', Number(Boolean(token.sharedPortfolio)), Globe ],['Authorized Outputs',Number(Boolean(token.sharedResume))+Number(Boolean(token.sharedPortfolio)),ShieldCheck],['Profile Sources',sources.length,Link2]].map(([label,count,Icon])=><Card key={label}><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold">{count}</p></div><div className="rounded-xl bg-blue-50 p-3 text-forge"><Icon size={22}/></div></div></Card>)}
        </div>
        <Card title="Candidate Access" className="mt-5">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4"><ProfileAvatar src={candidate.imgUrl || token.sharedResume?.resume?.imgUrl} alt={`${candidate.fullName || 'Candidate'} profile photo`} className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover"/><div><h2 className="text-xl font-extrabold text-ink">{candidate.fullName || 'Shared candidate'}</h2>{candidate.targetRole && <p className="font-bold text-forge">{candidate.targetRole}</p>}<p className="mt-2 text-sm text-slate-500">{token.sharedResume && token.sharedPortfolio ? 'Resume & Portfolio' : token.sharedResume ? 'Resume Only' : 'Portfolio Only'} · Token-authorized access</p></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4"><h3 className="mb-3 flex items-center gap-2 font-bold"><Link2 size={16}/>Profile Sources</h3>
              {sources.length ? <div className="grid gap-2 sm:grid-cols-2">{sources.map((source,index)=><a key={index} className="rounded-lg border px-3 py-2 text-sm font-bold text-forge hover:bg-blue-50" href={safeUrl(source.url)} target="_blank" rel="noreferrer">{source.name || 'Profile link'}</a>)}</div> : <p className="text-sm text-slate-500">No profile sources shared with this token.</p>}
            </div>
            <div className="rounded-lg border bg-white p-4"><h3 className="mb-3 font-bold">Actions</h3><div className="grid gap-2">
            {token.sharedPortfolio && <Button variant="outline" onClick={()=>openOutput('portfolio')}><Globe size={16}/>View Portfolio</Button>}
            {token.sharedResume && <Button variant="outline" onClick={()=>openOutput('resume')}><FileText size={16}/>View Resume</Button>}
            {token.sharedResume && token.allowDownload && <Button disabled={downloading} onClick={downloadResume}><Download size={16}/>{downloading?'Downloading…':'Download Resume'}</Button>}
            {view !== 'dashboard' && <Button variant="outline" onClick={()=>setView('dashboard')}>Back to Dashboard</Button>}
            </div></div>
          </div>
          {token.sharedResume && !token.allowDownload && <p className="mt-3 text-sm text-slate-500">The candidate has not enabled resume downloads for this token.</p>}
          {downloadError && <p role="alert">{downloadError}</p>}
          </section>
        </Card>
      </>}
      {token && sectionTitles[view] && <Card title={sectionTitles[view]} className="mt-5"><ResumePreview profile={{}} draft={{resume:{fullName:candidate.fullName,targetRole:candidate.targetRole,professionalSummary:'',contact:{},technicalSkills:[],workExperience:[],projects:[],certifications:[],education:[],[view]:sectionRows[view]}}}/></Card>}
      {view === 'resume' && token?.sharedResume && <div className="mt-6"><ResumePreview profile={{}} draft={token.sharedResume} /></div>}
      {view === 'portfolio' && token?.sharedPortfolio && (
        <div className="mt-6">
        <PortfolioPreview
          profile={{}}
          draft={token.sharedPortfolio}
          profileSources={token.sharedSources || []}
          hasResume={Boolean(token.sharedResume && token.allowDownload)}
          showContact={showContact}
          onToggleContact={() => setShowContact(value=>!value)}
          onDownloadResume={downloadResume}
          downloading={downloading}
        />
        </div>
      )}
      {token?.sharedResume && token.allowDownload && <div aria-hidden="true" style={{position:'absolute',left:'-10000px',top:0,width:'794px',pointerEvents:'none'}}><div ref={resumeRef}><ResumePreview profile={{}} draft={token.sharedResume}/></div></div>}
    </AppLayout>
  );
}
