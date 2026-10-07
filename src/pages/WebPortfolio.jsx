import DraftEditor from "../components/DraftEditor";
import PortfolioImprovements from '../components/PortfolioImprovements';
import { getPortfolioSuggestions } from '../services/portfolioSuggestionsService';
import { applyPortfolioSuggestions } from '../utils/portfolioSuggestions';
import ProfileAvatar from '../components/ProfileAvatar';
import { profilePhoto } from '../utils/profilePhoto';
import { useAuth } from '../contexts/AuthContext';
import { portfolioAvailability, portfolioContactAvailability } from '../utils/portfolioSections';
import { safeUrl } from "../utils/grounding";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { sharedDraft } from "../utils/grounding";
import { useEffect, useRef, useState } from "react";

import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import ResumePreview from "../components/ResumePreview";
import Swal from "sweetalert2";
import { onAuthChange } from "../services/authservice";
import {
  publishPortfolio,
  getProfile,
  getProfileSources,
  getResumeDraft,
  getWebPortfolioDraft,
  saveWebPortfolioDraft,
} from "../services/firestoreService";
import { generateAIContent } from "../services/aiService";
import {
  Download,
  Mail,
  Save,
  RefreshCw,
  Globe,
  ExternalLink,
} from "lucide-react";

const includeOptions = [
  "About Me",
  "Technical Skills",
  "Education",
  "Featured Projects",
  "Resume Download",
  "Certifications",
  "Work Experience",
  "Contact Links",
];

const defaultConfig = {
  portfolioTitle: "",
  slug: "",
  themeStyle: "Modern Blue",
  visibility: "private",
  showEmail: false,
  showPhone: false,
  showAddress: false,
  showLinks: false,
  includeSections: includeOptions,
};

export default function WebPortfolio() {
  const authState = useAuth();
  const resumeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [improvements, setImprovements] = useState(null);

  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileSources, setProfileSources] = useState([]);
  const [resumeDraft, setResumeDraft] = useState(null);

  const [config, setConfig] = useState(defaultConfig);
  const [portfolioDraft, setPortfolioDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [error, setError] = useState("");
  const availableSections = portfolioAvailability(profile, resumeDraft, profileSources);
  const availableContacts = portfolioContactAvailability(profile, profileSources);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedProfile = await getProfile(user.uid);
        const savedSources = await getProfileSources(user.uid);
        const savedResumeDraft = await getResumeDraft(user.uid);
        const savedPortfolioDraft = await getWebPortfolioDraft(user.uid);

        setProfile(savedProfile || null);
        setProfileSources(savedSources?.sources || []);
        setResumeDraft(savedResumeDraft?.draft || null);

        const fullName = savedProfile?.fullName || "Your Name";
        const targetRole = savedProfile?.targetRole || "Target ICT Role";

        const initialConfig = {
          ...defaultConfig,
          portfolioTitle:
            savedPortfolioDraft?.config?.portfolioTitle ||
            `${fullName} – ${targetRole}`,
          slug: savedPortfolioDraft?.publicSlug || crypto.randomUUID(),
          themeStyle:
            savedPortfolioDraft?.config?.themeStyle || defaultConfig.themeStyle,
          visibility:
            savedPortfolioDraft?.visibility === "public" ? "public" : "private",
          includeSections:
            savedPortfolioDraft?.config?.includeSections ||
            defaultConfig.includeSections,
        };

        const available = portfolioAvailability(savedProfile, savedResumeDraft?.draft, savedSources?.sources || []);
        initialConfig.includeSections = initialConfig.includeSections.filter(section => available[section]);
        setConfig({
          ...initialConfig,
          showEmail: savedPortfolioDraft?.config?.showEmail === true,
          showPhone: savedPortfolioDraft?.config?.showPhone === true,
          showAddress: savedPortfolioDraft?.config?.showAddress === true,
          showLinks: savedPortfolioDraft?.config?.showLinks === true,
        });
        setPortfolioDraft(savedPortfolioDraft?.draft || null);
      } catch (error) {
        console.error("Error loading portfolio data:", error);
        setError("Failed to load portfolio data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === 'checkbox' && (!config.includeSections.includes('Contact Links') || !availableContacts[name])) return;
    const nextConfig = { ...config, [name]: type === 'checkbox' ? checked : value };
    setPortfolioDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, status: "draft" };
      saveWebPortfolioDraft(userId, { config: nextConfig, draft }).catch((error) =>
        setError(error.message),
      );
      return draft;
    });

    setConfig(nextConfig);
  };

  const handleSectionToggle = (section) => {
    if (!availableSections[section]) return;
    const nextConfig = { ...config, includeSections: config.includeSections.includes(section) ? config.includeSections.filter(item => item !== section) : [...config.includeSections, section] };
    setPortfolioDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, status: "draft" };
      saveWebPortfolioDraft(userId, { config: nextConfig, draft }).catch((error) =>
        setError(error.message),
      );
      return draft;
    });
    setConfig(nextConfig);
  };

  const generatePortfolio = async () => {
    if (!profile) {
      Swal.fire({
        icon: "warning",
        title: "Missing Profile",
        text: "Please complete your profile first.",
      });
      return;
    }

    if (generating) return;

    setGenerating(true);
    setError('');
    try {
      const baseline={...structuredClone(profile),imgUrl:profilePhoto(profile,authState?.firebaseUser)};
      const result=await getPortfolioSuggestions(baseline);
      setImprovements({...result,profile:baseline,config:structuredClone(config),suggestions:result.suggestions.filter(item=>config.includeSections.includes(item.section))});
    } catch(error) { setError(error.message || 'Failed to prepare portfolio suggestions.'); }
    finally { setGenerating(false); }
  };

  const createReviewedPortfolio = async suggestions => {
    const result={title:'Reviewed Portfolio Draft',status:'draft',resume:applyPortfolioSuggestions(improvements.profile,suggestions)};
    await saveWebPortfolioDraft(userId,{config:improvements.config,draft:result});
    setConfig(improvements.config);
    setPortfolioDraft(result);
    setImprovements(null);
    setEditing(false);
  };

  const handleSaveDraft = async () => {
    if (!portfolioDraft) {
      alert("Generate a portfolio draft first.");
      return;
    }

    if (!userId) {
      alert("You must be logged in to save portfolio draft.");
      return;
    }

    setSaving(true);

    try {
      await saveWebPortfolioDraft(userId, {
        config,
        draft: portfolioDraft,
      });

      alert("Portfolio draft saved.");
    } catch (error) {
      console.error("Error saving portfolio draft:", error);
      alert("Failed to save portfolio draft.");
    }

    setSaving(false);
  };

  const handlePublishPortfolio = async () => {
    if (portfolioDraft?.status !== "approved" || !userId) return;
    const confirmation = await Swal.fire({
      title: "Make Public?",
      text: "Your approved portfolio will be accessible to anyone with its link. Only opted-in contact details will be shared.",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Make Public",
    });
    if (!confirmation.isConfirmed) return;
    try {
      const id = await publishPortfolio(userId, {
        draft: portfolioDraft,
        config,
        publicSlug: config.slug,
      });

      setConfig((prev) => ({ ...prev, slug: id, visibility: "public" }));
      Swal.fire({
        title: "Portfolio Published",
        text: window.location.origin + "/p/" + id,
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDownloadResumePdf = async () => {
    if (resumeDraft?.status !== "approved") {
      alert(
        "No generated resume found. Please generate a resume first in Resume Builder.",
      );
      return;
    }

    if (!resumeRef.current) {
      alert("Resume preview is not ready.");
      return;
    }

    setDownloading(true);

    const fileName = `${
      resumeDraft.resume?.fullName || profile?.fullName || "resume"
    }-resume.pdf`
      .toLowerCase()
      .replace(/\s+/g, "-");

    const options = {
      margin: 0.35,
      filename: fileName,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    };

    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf().set(options).from(resumeRef.current).save();
    } catch (error) {
      console.error("PDF download error:", error);
      alert("Failed to download resume PDF.");
    }

    setDownloading(false);
  };

  if (loading) {
    return (
      <AppLayout title="Web Portfolio Generator">
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Web Portfolio Generator"
      subtitle="Create and customize your professional online portfolio"
      badge="AI Enhanced"
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <Card title="Portfolio Configuration">
          <div className="grid gap-4">
            <FormField
              label="Portfolio Title"
              name="portfolioTitle"
              value={config.portfolioTitle}
              onChange={handleConfigChange}
            />

            <FormField
              label="Portfolio Slug / URL"
              name="slug"
              readOnly
              value={config.slug}
              onChange={handleConfigChange}
            />

            <FormField
              label="Theme Style"
              as="select"
              name="themeStyle"
              value={config.themeStyle}
              onChange={handleConfigChange}
            >
              <option value="Modern Blue">Modern Blue</option>
              <option value="Minimal White">Minimal White</option>
            </FormField>

            <FormField
              label="Visibility"
              as="select"
              name="visibility"
              value={config.visibility}
              onChange={handleConfigChange}
            >
              <option value="private">Private / Token-share ready</option>
              <option value="public">Public (requires Make Public)</option>
            </FormField>
          </div>

          {config.includeSections.includes('Contact Links') && availableSections['Contact Links'] && <div className="mt-4 grid gap-2">
            {["showEmail", "showPhone", "showAddress", "showLinks"].map(
              (name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    name={name}
                    checked={Boolean(availableContacts[name]) && Boolean(config[name])}
                    disabled={!availableContacts[name]}
                    onChange={handleConfigChange}
                  />{" "}
                  {name.replace("show", "Share ")}
                </label>
              ),
            )}
          </div>}
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 font-bold text-ink">Include in Portfolio</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {includeOptions.map((option) => (
                <label key={option} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(availableSections[option]) && config.includeSections.includes(option)}
                    disabled={!availableSections[option]}
                    onChange={() => handleSectionToggle(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
            {!availableSections['Resume Download'] && <p className="mt-3 text-sm text-slate-600">Resume Download needs an approved resume. <a className="font-semibold text-forge underline" href="/resume-builder">Generate and review your resume in Resume Builder</a>, then return here and select Resume Download.</p>}
            {availableSections['Resume Download'] && !config.includeSections.includes('Resume Download') && <p className="mt-3 text-sm text-slate-600">Select Resume Download above to show the download button in your portfolio preview.</p>}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            className="mt-5 w-full"
            onClick={generatePortfolio}
            disabled={generating}
          >
            <Globe size={16} />
            {generating ? "Generating..." : "Generate Portfolio"}
          </Button>
        </Card>

        <Card title="Portfolio Preview">
          {!portfolioDraft && <p className="mb-3 text-sm text-slate-600">The resume download button appears inside the generated portfolio preview when Resume Download is selected and your resume is approved.</p>}
          {portfolioDraft ? (
            <PortfolioPreview
              draft={portfolioDraft}
              config={config}
              photoSrc={profilePhoto(authState?.userProfile || profile, authState?.firebaseUser)}
              profile={profile}
              profileSources={profileSources}
              showContact={showContact}
              onToggleContact={() => setShowContact((prev) => !prev)}
              onDownloadResume={handleDownloadResumePdf}
              downloading={downloading}
              hasResume={resumeDraft?.status === "approved"}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <p className="font-bold text-ink">
                No AI-generated portfolio yet.
              </p>
              <p className="mt-1 text-sm">
                Click "Generate Portfolio" to see a preview.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !portfolioDraft}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              variant="outline"
              onClick={generatePortfolio}
              disabled={generating}
            >
              <RefreshCw size={16} />
              {portfolioDraft ? "Regenerate" : "Generate First"}
            </Button>

            <Button
              variant="outline"
              disabled={!portfolioDraft}
              onClick={() => {
                setEditing(true);
              }}
            >
              Edit
            </Button>
            {editing && (
              <DraftEditor
                resume={portfolioDraft.resume}
                onCancel={() => setEditing(false)}
                onSave={async (resume) => {
                  const updated = {
                    ...portfolioDraft,
                    resume,
                    status: "draft",
                  };
                  await saveWebPortfolioDraft(userId, {
                    config,
                    draft: updated,
                  });
                  setPortfolioDraft(updated);
                  setEditing(false);
                }}
              />
            )}
            <span>
              {portfolioDraft?.status === "approved" ? "Approved" : "Draft"}
            </span>
            {portfolioDraft?.warning && (
              <p role="alert">{portfolioDraft.warning}</p>
            )}
            <Button
              disabled={!portfolioDraft || portfolioDraft.status === "approved" || editing || generating || !!improvements}
              onClick={async () => {
                const currentPhoto=profilePhoto(authState?.userProfile || profile,authState?.firebaseUser);
                const draft = { ...portfolioDraft, resume:{...portfolioDraft.resume,imgUrl:safeUrl(currentPhoto) || portfolioDraft.resume?.imgUrl || ''}, status: "approved" };
                await saveWebPortfolioDraft(userId, { config, draft });
                setPortfolioDraft(draft);
              }}
            >
              Approve for Publishing
            </Button>
            <Button
              onClick={handlePublishPortfolio}
              disabled={saving || portfolioDraft?.status !== "approved"}
            >
              Make Public
            </Button>
          </div>
        </Card>
      </div>

      {improvements && <PortfolioImprovements suggestions={improvements.suggestions} notice={improvements.notice} onCancel={()=>setImprovements(null)} onComplete={createReviewedPortfolio} />}
      <div className="hidden">
        <div ref={resumeRef}>
          <ResumePreview profile={profile} draft={resumeDraft} />
        </div>
      </div>
    </AppLayout>
  );
}

export function PortfolioPreview({
  draft,
  config,
  photoSrc,
  profile,
  profileSources,
  showContact,
  onToggleContact,
  onDownloadResume,
  downloading,
  hasResume,
}) {
  const portfolio = draft.resume || {};
  const minimal=config?.themeStyle === 'Minimal White';
  const fullName = portfolio.fullName || profile?.fullName || "Your Name";
  const targetRole =
    portfolio.targetRole || profile?.targetRole || "Target ICT Role";

  const about =
    portfolio.aboutMe ||
    portfolio.professionalSummary ||
    profile?.summary ||
    "No summary provided.";

  const skills =
    portfolio.technicalSkills || portfolio.skills || profile?.skills || [];

  const projects = portfolio.projects || profile?.projects || [];
  const certifications =
    portfolio.certifications || profile?.certifications || [];
  const educationItems = normalizeEducation(
    portfolio.education || profile?.education,
  );

  const email = (!config || config.showEmail) ? profile?.email || portfolio.contact?.email || "" : "";
  const phone = (!config || config.showPhone) ? profile?.phone || portfolio.contact?.phone || "" : "";
  const location = (!config || config.showAddress) ? profile?.location || portfolio.contact?.location || "" : "";
  const imageUrl =
    photoSrc || profilePhoto(profile) || portfolio.imgUrl || "";

  const connectedSources = (profileSources || []).filter(
    (source) => (!config || config.showLinks) && safeUrl(source.url),
  );
  const experience = portfolio.workExperience || profile?.experience || [];
  const available = portfolioAvailability({summary: portfolio.professionalSummary || portfolio.aboutMe || profile?.summary, skills, education: educationItems, projects, certifications, experience, email, phone, location}, hasResume ? {status:'approved'} : null, connectedSources);
  const included = section => available[section] && (!Array.isArray(config?.includeSections) || config.includeSections.includes(section));

  return (
    <div data-theme={minimal?'minimal-white':'modern-blue'} className={minimal?'portfolio-minimal overflow-hidden rounded-xl border border-slate-300 bg-white':'overflow-hidden rounded-xl border border-blue-200 bg-white'}>
      {minimal && <style>{'.portfolio-minimal .text-forge { color: #0f172a; } .portfolio-minimal .shadow-sm, .portfolio-minimal .shadow-soft { box-shadow: none; }'}</style>}
      <div className="flex items-center justify-between border-b p-4 text-sm">
        <b className="text-forge">{fullName}</b>

        <div className="hidden gap-5 sm:flex">
          {[[ 'About Me', 'about', 'About'], ['Technical Skills','skills','Skills'], ['Education','education','Education'], ['Featured Projects','projects','Projects'], ['Certifications','certs','Certificates'], ['Work Experience','experience','Experience'], ['Contact Links','contact','Contact']].filter(([section])=>included(section)).map(([section,id,label])=><a key={section} href={`#${id}`} className="cursor-pointer hover:text-forge">{label}</a>)}
        </div>
      </div>

      <div className={minimal?'grid gap-6 bg-white p-6 md:grid-cols-[1.2fr_0.8fr]':'grid gap-6 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 md:grid-cols-[1.2fr_0.8fr]'}>
        <div>
          <p className="text-sm text-slate-500">Hello, I'm</p>

          <h2 className="text-4xl font-black tracking-tight text-ink">
            {fullName}
          </h2>

          <p className="mt-1 font-bold text-forge">{targetRole}</p>

          {included('About Me') && <p className="mt-4 text-slate-600">{about}</p>}

          {included('Contact Links') && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {email && (
              <a href={`mailto:${email}`} className="hover:text-forge">
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="hover:text-forge">
                {phone}
              </a>
            )}
            {location && <span>{location}</span>}
          </div>}

          <div className="mt-5 flex flex-wrap gap-3">
            {included('Resume Download') && <Button
              onClick={onDownloadResume}
              disabled={!hasResume || downloading}
            >
              <Download size={16} />
              {downloading ? "Downloading..." : "Download Resume"}
            </Button>}

            {included('Contact Links') && <Button variant="outline" onClick={onToggleContact}>
              <Mail size={16} />
              Contact Me
            </Button>}
          </div>
        </div>

        <div className="grid place-items-center">
          <ProfileAvatar src={imageUrl} alt={`${fullName} profile photo`} className="h-40 w-40 rounded-full bg-white object-cover shadow-soft" />
        </div>
      </div>

      {showContact && included('Contact Links') && (
        <div className="border-b border-blue-100 bg-white p-5">
          <h3 className="mb-3 font-bold text-ink">Contact Information</h3>

          <div className="grid gap-2 text-sm text-slate-700">
            {email && (
              <p>
                <span className="font-bold text-ink">Email:</span>{" "}
                <a
                  href={`mailto:${email}`}
                  className="text-forge hover:underline"
                >
                  {email}
                </a>
              </p>
            )}

            {phone && (
              <p>
                <span className="font-bold text-ink">Phone:</span>{" "}
                <a href={`tel:${phone}`} className="text-forge hover:underline">
                  {phone}
                </a>
              </p>
            )}

            {connectedSources.length > 0 && (
              <div>
                <p className="font-bold text-ink">Profile Links:</p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {connectedSources.map((source) => (
                    <a
                      key={source.name}
                      href={safeUrl(source.url) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-forge hover:bg-blue-50"
                    >
                      {source.name}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!email && !phone && connectedSources.length === 0 && (
              <p className="text-slate-500">No contact details added yet.</p>
            )}
          </div>
        </div>
      )}

      <div className={minimal?'grid gap-5 border-t bg-white p-6 md:grid-cols-2':'grid gap-5 bg-slate-50 p-6 md:grid-cols-2'}>
        {included('About Me') && <div id="about">
          <Mini title="About Me" text={about} />
        </div>}

        {included('Technical Skills') && <div id="skills">
          <Mini title="Technical Skills" text={formatSkills(skills)} />
        </div>}

        {included('Education') && <div id="education">
          <Mini title="Education" text={formatEducation(educationItems)} />
        </div>}

        {included('Featured Projects') && <div id="projects">
          <Mini title="Featured Projects" text={formatProjects(projects)} />
        </div>}

        {included('Certifications') && <div id="certs">
          <Mini
            title="Certificates"
            text={formatCertificates(certifications)}
          />
        </div>}

        {included('Work Experience') && <div id="experience"><Mini title="Work Experience" text={experience.map(item=>[item.jobTitle,item.companyName,item.description].filter(Boolean).join(' — ')).join('; ')} /></div>}
        {included('Contact Links') && connectedSources.length > 0 && <div id="links">
          <Mini
            title="Profile Links"
            customContent={
              connectedSources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {connectedSources.map((source) => (
                    <a
                      key={source.name}
                      href={safeUrl(source.url) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-forge hover:bg-blue-50"
                    >
                      {source.name}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No profile links added yet.
                </p>
              )
            }
          />
        </div>}

        {included('Contact Links') && <div id="contact">
          <Mini
            title="Contact"
            text={formatContact(email, phone, connectedSources)}
          />
        </div>}
      </div>
    </div>
  );
}

function Mini({ title, text, customContent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-forge">
        {title}
      </h3>

      {customContent || (
        <p className="text-sm leading-relaxed text-slate-600">
          {text || "No data available yet."}
        </p>
      )}
    </div>
  );
}

function formatSkills(skills = []) {
  if (!skills.length) return "";

  return skills
    .map((skill) => {
      if (skill.skillName) {
        return skill.proficiencyLevel
          ? `${skill.skillName} (${skill.proficiencyLevel})`
          : skill.skillName;
      }

      if (skill.items?.length) {
        return skill.items
          .map((item) =>
            item.level ? `${item.name} (${item.level})` : item.name,
          )
          .join(", ");
      }

      return skill.name || "";
    })
    .filter(Boolean)
    .slice(0, 8)
    .join(", ");
}

function formatProjects(projects = []) {
  return projects
    .map((project) => {
      const title = project.projectTitle || project.name || "";
      const tech = project.technologiesUsed
        ? ` (${project.technologiesUsed})`
        : "";

      return [ `${title}${tech}`, project.description ].filter(Boolean).join(" — ");
    })
    .filter(Boolean)
    .join(", ");
}

function formatCertificates(certifications = []) {
  if (!certifications.length) return "";

  return certifications
    .map((cert) => {
      const name = cert.name || cert.certificationName || "";
      const org = cert.organization ? ` — ${cert.organization}` : "";
      const date = cert.issueDate ? ` (${cert.issueDate})` : "";

      return `${name}${org}${date}`;
    })
    .filter(Boolean)
    .join(", ");
}

function normalizePortfolioSlug(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^cvforge\.app\//i, "")
    .replace(/^\/?portfolio\//i, "");

  return (
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "portfolio"
  );
}

function formatEducation(educationItems = []) {
  return educationItems
    .map((item) => {
      const degree = item.degree || "Education";
      const school = item.school ? ` at ${item.school}` : "";
      const year = item.year ? ` (${item.year})` : "";

      return `${degree}${school}${year}`;
    })
    .filter(Boolean)
    .join(", ");
}

function formatContact(email, phone, sources = []) {
  return [
    email ? `Email: ${email}` : "",
    phone ? `Phone: ${phone}` : "",
    ...sources.map((source) => `${source.name}: ${source.url}`),
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeEducation(education) {
  if (!education) return [];

  if (Array.isArray(education)) {
    return education.map((item) => ({
      degree: item.degree || item.course || item.level || "Education",
      school: item.school || item.schoolName || "",
      year:
        item.year ||
        item.yearGraduated ||
        [item.startYear, item.endYear].filter(Boolean).join(" - "),
    }));
  }

  const result = [];

  if (education.primary?.schoolName) {
    result.push({
      degree: "Primary Education",
      school: education.primary.schoolName,
      year: education.primary.yearGraduated || "",
    });
  }

  if (education.secondary?.schoolName) {
    result.push({
      degree: "Secondary Education",
      school: education.secondary.schoolName,
      year: education.secondary.yearGraduated || "",
    });
  }

  const groups = [
    ["College", education.college],
    ["Vocational", education.vocational],
    ["Master's Degree", education.masters],
    ["Doctoral Degree", education.doctoral],
  ];

  groups.forEach(([label, items]) => {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
      result.push({
        degree: item.degreeProgram || item.degree || item.course || label,
        school:
          item.schoolName ||
          item.institution ||
          item.university ||
          item.school ||
          "",
        year:
          item.yearGraduated ||
          item.completionYear ||
          item.year ||
          [item.startYear, item.endYear].filter(Boolean).join(" - "),
      });
    });
  });

  return result;
}
