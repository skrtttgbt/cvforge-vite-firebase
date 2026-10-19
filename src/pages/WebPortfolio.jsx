import VisualTemplateEditor from "../components/VisualTemplateEditor";
import PortfolioSkills from '../components/PortfolioSkills';
import ResumeApproval from '../components/ResumeApproval';
import PortfolioImprovements from '../components/PortfolioImprovements';
import { getPortfolioSuggestions } from '../services/portfolioSuggestionsService';
import { applyPortfolioSuggestions } from '../utils/portfolioSuggestions';
import ProfileAvatar from '../components/ProfileAvatar';
import { profilePhoto } from '../utils/profilePhoto';
import { useAuth } from '../contexts/AuthContext';
import { portfolioAvailability, portfolioContactAvailability } from '../utils/portfolioSections';
import { safeUrl } from "../utils/grounding";
import { isConnectedProfileSource } from "../utils/sourceValidation";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { sharedDraft } from "../utils/grounding";
import { useEffect, useRef, useState } from "react";

import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import DocumentStatus from "../components/DocumentStatus";
import ResumePreview from "../components/ResumePreview";
import Swal from "sweetalert2";
import { onAuthChange } from "../services/authservice";
import {
  publishPortfolio,
  unpublishPortfolio,
  getProfile,
  getProfileSources,
  getResumeDraft,
  getWebPortfolioDraft,
  saveWebPortfolioDraft,
  subscribeProfileSources,
} from "../services/firestoreService";
import { generateAIContent } from "../services/aiService";
import {
  Download,
  Mail,
  Save,
  RefreshCw,
  Globe,
  ExternalLink,
  Link2,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";

const includeOptions = [
  "About Me",
  "Technical Skills",
  "Education",
  "Featured Projects",
  "Resume Download",
  "Certifications",
  "Work Experience",
  "Contact Information",
  "Profile Sources",
];

function normalizeIncludeSections(sections) {
  const selected = Array.isArray(sections) ? [...sections] : [...includeOptions];
  if (selected.includes("Contact Links")) {
    if (!selected.includes("Contact Information")) selected.push("Contact Information");
    if (!selected.includes("Profile Sources")) selected.push("Profile Sources");
  }
  return withLegacyContactSection(selected);
}

function withLegacyContactSection(sections) {
  const selected = sections.filter((section) => section !== "Contact Links");
  if (selected.includes("Contact Information") || selected.includes("Profile Sources")) {
    selected.push("Contact Links");
  }
  return selected;
}

const defaultConfig = {
  portfolioTitle: "",
  slug: "",
  themeStyle: "Modern Blue",
  visibility: "private",
  showEmail: false,
  showPhone: false,
  showAddress: false,
  showLinks: false,
  includeSections: withLegacyContactSection(includeOptions),
};

export default function WebPortfolio() {
  const authState = useAuth();
  const resumeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [reviewing,setReviewing] = useState(false);
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
  const [publishing, setPublishing] = useState(false);
  const [savedFingerprint, setSavedFingerprint] = useState("");
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
          includeSections: normalizeIncludeSections(
            savedPortfolioDraft?.config?.includeSections,
          ),
        };

        const available = portfolioAvailability(savedProfile, savedResumeDraft?.draft, savedSources?.sources || []);
        initialConfig.includeSections = withLegacyContactSection(
          initialConfig.includeSections.filter(
            (section) => section === "Contact Links" || available[section],
          ),
        );
        const loadedConfig = {
          ...initialConfig,
          showEmail: savedPortfolioDraft?.config?.showEmail === true,
          showPhone: savedPortfolioDraft?.config?.showPhone === true,
          showAddress: savedPortfolioDraft?.config?.showAddress === true,
          showLinks: savedPortfolioDraft?.config?.showLinks === true,
        };
        const loadedDraft = savedPortfolioDraft?.draft || null;
        setConfig(loadedConfig);
        setPortfolioDraft(loadedDraft);
        setSavedFingerprint(portfolioFingerprint(loadedDraft, loadedConfig));
      } catch (error) {
        console.error("Error loading portfolio data:", error);
        setError("Failed to load portfolio data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeProfileSources(
      userId,
      (savedSources) => setProfileSources(savedSources?.sources || []),
      (subscriptionError) => {
        console.error("Profile source subscription error:", subscriptionError);
        setError("Connected profile sources could not be refreshed.");
      },
    );
  }, [userId]);

  const handleConfigChange = (e) => {
    const { name, value, checked, type } = e.target;
    const requiredSection = name === "showLinks" ? "Profile Sources" : "Contact Information";
    if (type === 'checkbox' && (!config.includeSections.includes(requiredSection) || !availableContacts[name])) return;
    const nextConfig = {
      ...config,
      [name]: type === 'checkbox' ? checked : value,
      visibility: portfolioDraft ? "private" : config.visibility,
    };
    setPortfolioDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, status: "draft" };
      saveWebPortfolioDraft(userId, { config: nextConfig, draft })
        .then(() => setSavedFingerprint(portfolioFingerprint(draft, nextConfig)))
        .catch((error) => setError(error.message));
      return draft;
    });

    setConfig(nextConfig);
  };

  const handleSectionToggle = (section) => {
    if (!availableSections[section]) return;
    const removing = config.includeSections.includes(section);
    const includeSections = withLegacyContactSection(
      removing
        ? config.includeSections.filter(item => item !== section)
        : [...config.includeSections, section],
    );
    const nextConfig = {
      ...config,
      visibility: portfolioDraft ? "private" : config.visibility,
      includeSections,
      ...(removing && section === "Contact Information"
        ? { showEmail: false, showPhone: false, showAddress: false }
        : {}),
      ...(removing && section === "Profile Sources"
        ? { showLinks: false }
        : {}),
    };
    setPortfolioDraft((prev) => {
      if (!prev) return prev;
      const draft = { ...prev, status: "draft" };
      saveWebPortfolioDraft(userId, { config: nextConfig, draft })
        .then(() => setSavedFingerprint(portfolioFingerprint(draft, nextConfig)))
        .catch((error) => setError(error.message));
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
    const privateConfig = { ...improvements.config, visibility: "private" };
    await saveWebPortfolioDraft(userId,{config:privateConfig,draft:result});
    setConfig(privateConfig);
    setPortfolioDraft(result);
    setSavedFingerprint(portfolioFingerprint(result, privateConfig));
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

      setSavedFingerprint(portfolioFingerprint(portfolioDraft, config));
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
    setPublishing(true);
    try {
      const id = await publishPortfolio(userId, {
        draft: portfolioDraft,
        config,
        publicSlug: config.slug,
      });

      const publicConfig = { ...config, slug: id, visibility: "public" };
      setConfig(publicConfig);
      setSavedFingerprint(portfolioFingerprint(portfolioDraft, publicConfig));
      Swal.fire({
        title: "Portfolio Published",
        text: window.location.origin + "/p/" + id,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleMakePrivate = async () => {
    if (!userId || config.visibility !== "public") return;
    const confirmation = await Swal.fire({
      title: "Make Portfolio Private?",
      text: "The public portfolio link will stop working. Your saved portfolio will remain available here and for token sharing.",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Make Private",
    });
    if (!confirmation.isConfirmed) return;

    setPublishing(true);
    setError("");
    try {
      await unpublishPortfolio(userId);
      const privateConfig = { ...config, visibility: "private" };
      setConfig(privateConfig);
      setSavedFingerprint(portfolioFingerprint(portfolioDraft, privateConfig));
      await Swal.fire({
        icon: "success",
        title: "Portfolio Is Private",
        text: "Your saved portfolio is no longer publicly accessible.",
      });
    } catch (error) {
      setError(error.message || "Unable to make the portfolio private.");
    } finally {
      setPublishing(false);
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

  const portfolioSaved = Boolean(portfolioDraft) &&
    savedFingerprint === portfolioFingerprint(portfolioDraft, config);
  const portfolioIsPublic = config.visibility === "public";

  return (
    <AppLayout
      title="Web Portfolio Generator"
      subtitle="Create and customize your professional online portfolio"
      badge="AI Enhanced"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.6fr)_minmax(0,1.8fr)]">
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
              disabled
            >
              <option value="private">Private / Token-share ready</option>
              <option value="public">Public</option>
            </FormField>
          </div>

          {config.includeSections.includes('Contact Information') && availableSections['Contact Information'] && <div className="mt-4 grid gap-2">
            {["showEmail", "showPhone", "showAddress"].map(
              (name) => (
                <label key={name} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={name}
                    checked={Boolean(availableContacts[name]) && Boolean(config[name])}
                    disabled={!availableContacts[name]}
                    onChange={handleConfigChange}
                  />{" "}
                  {{
                    showEmail: "Share Email",
                    showPhone: "Share Phone",
                    showAddress: "Share Address",
                  }[name]}
                </label>
              ),
            )}
          </div>}
          {config.includeSections.includes('Profile Sources') && availableSections['Profile Sources'] && (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="showLinks"
                checked={Boolean(availableContacts.showLinks) && Boolean(config.showLinks)}
                disabled={!availableContacts.showLinks}
                onChange={handleConfigChange}
              />
              Share Profile Source
            </label>
          )}
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
          <DocumentStatus
            label="Portfolio"
            exists={Boolean(portfolioDraft)}
            approvalStatus={portfolioDraft?.status}
            saved={portfolioSaved}
            visibility={config.visibility}
          />
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
              disabled={saving || !portfolioDraft || portfolioSaved}
            >
              <Save size={16} />
              {saving ? "Saving..." : portfolioSaved ? "Saved Portfolio" : "Save Portfolio"}
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
              <Pencil size={16} />
              Edit
            </Button>
            {portfolioDraft?.warning && (
              <p role="alert">{portfolioDraft.warning}</p>
            )}
            {portfolioDraft?.status !== 'approved' && <Button
              disabled={!portfolioDraft || editing || generating || !!improvements || reviewing}
              onClick={() => setReviewing(true)}
            >
              Approve for Publishing
            </Button>}
            <Button
              variant={portfolioIsPublic ? "danger" : "primary"}
              onClick={portfolioIsPublic ? handleMakePrivate : handlePublishPortfolio}
              disabled={publishing || saving || (!portfolioIsPublic && portfolioDraft?.status !== "approved")}
            >
              {publishing ? "Updating..." : portfolioIsPublic ? "Make Private" : "Make Public"}
            </Button>
          </div>
        </Card>
      </div>

      {improvements && <PortfolioImprovements suggestions={improvements.suggestions} notice={improvements.notice} onCancel={()=>setImprovements(null)} onComplete={createReviewedPortfolio} />}
      {editing && portfolioDraft && (
        <VisualTemplateEditor
          mode="portfolio"
          resume={portfolioDraft.resume}
          onCancel={() => setEditing(false)}
          onSave={async (resume) => {
            const updated = {
              ...portfolioDraft,
              resume,
              status: "draft",
            };
            const privateConfig = { ...config, visibility: "private" };
            await saveWebPortfolioDraft(userId, {
              config: privateConfig,
              draft: updated,
            });
            setConfig(privateConfig);
            setPortfolioDraft(updated);
            setSavedFingerprint(portfolioFingerprint(updated, privateConfig));
            setEditing(false);
          }}
        />
      )}
      {reviewing && portfolioDraft && <ResumeApproval outputName="Portfolio" resume={sharedDraft(portfolioDraft,config).resume} profile={{}} onCancel={()=>setReviewing(false)} onEdit={()=>{
        setReviewing(false);
        setEditing(true);
      }} onApprove={async resume=>{
        const currentPhoto=profilePhoto(authState?.userProfile || profile,authState?.firebaseUser);
        const draft={...portfolioDraft,resume:{...resume,imgUrl:safeUrl(currentPhoto) || resume.imgUrl || ''},status:'approved'};
        await saveWebPortfolioDraft(userId,{config,draft});
        setPortfolioDraft(draft);
        setSavedFingerprint(portfolioFingerprint(draft, config));
        setReviewing(false);
      }}/>}
      <div className="hidden">
        <div ref={resumeRef}>
          <ResumePreview profile={profile} draft={resumeDraft} />
        </div>
      </div>
    </AppLayout>
  );
}

function portfolioFingerprint(draft, config) {
  if (!draft) return "";
  const { slug: _slug, visibility: _visibility, ...savedConfig } = config || {};
  return JSON.stringify({ draft, config: savedConfig });
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
  sourcesAreShared = false,
}) {
  const portfolio = draft.resume || {};
  const minimal=config?.themeStyle === 'Minimal White';
  const fullName = portfolio.fullName || profile?.fullName || "Your Name";
  const targetRole =
    portfolio.targetRole || profile?.targetRole || "Target ICT Role";

  const about =
    portfolio.aboutMe ??
    portfolio.professionalSummary ??
    profile?.summary ??
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
  const imageUrl = safeUrl(
    photoSrc || profilePhoto(profile) || portfolio.imgUrl || "",
  );

  const connectedSources = (profileSources || []).filter(
    (source) =>
      (!config || config.showLinks) &&
      (sourcesAreShared
        ? Boolean(safeUrl(source?.url))
        : isConnectedProfileSource(source)),
  );
  const experience = portfolio.workExperience || profile?.experience || [];
  const available = portfolioAvailability({summary: about === 'No summary provided.' ? '' : about, skills, education: educationItems, projects, certifications, experience, email, phone, location}, hasResume ? {status:'approved'} : null, connectedSources.map(source => ({...source,status:'Connected'})));
  const included = section => available[section] && (!Array.isArray(config?.includeSections) || config.includeSections.includes(section));

  return (
    <div data-theme={minimal?'minimal-white':'modern-blue'} className={minimal?'portfolio-minimal overflow-hidden rounded-xl border border-slate-300 bg-white':'overflow-hidden rounded-xl border border-blue-200 bg-white'}>
      {minimal && <style>{'.portfolio-minimal .text-forge { color: #0f172a; } .portfolio-minimal .shadow-sm, .portfolio-minimal .shadow-soft { box-shadow: none; }'}</style>}
      <div className="flex items-center justify-between border-b p-4 text-sm">
        <b className="text-forge">{fullName}</b>

        <div className="hidden gap-5 sm:flex">
          {[[ 'About Me', 'about', 'About'], ['Technical Skills','skills','Skills'], ['Education','education','Education'], ['Featured Projects','projects','Projects'], ['Certifications','certs','Certificates'], ['Work Experience','experience','Experience'], ['Profile Sources','links','Sources'], ['Contact Information','contact','Contact']].filter(([section])=>included(section)).map(([section,id,label])=><a key={section} href={`#${id}`} className="cursor-pointer hover:text-forge">{label}</a>)}
        </div>
      </div>

      <div className={`${minimal ? 'bg-white' : 'bg-gradient-to-br from-blue-50 via-white to-slate-50'} grid gap-6 p-6 ${imageUrl ? 'md:grid-cols-[1.2fr_0.8fr]' : ''}`}>
        <div>
          <p className="text-sm text-slate-500">Hello, I'm</p>

          <h2 className="text-4xl font-black tracking-tight text-ink">
            {fullName}
          </h2>

          <p className="mt-1 font-bold text-forge">{targetRole}</p>

          {included('About Me') && <p className="mt-4 text-slate-600">{about}</p>}

          {included('Contact Information') && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
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

            {included('Contact Information') && (email || phone || location) && <Button variant="outline" onClick={onToggleContact}>
              <Mail size={16} />
              Contact Me
            </Button>}
          </div>
        </div>

        {imageUrl && (
          <div className="grid place-items-center">
            <ProfileAvatar
              src={imageUrl}
              fallback={false}
              alt={`${fullName} profile photo`}
              className="h-40 w-40 rounded-full bg-white object-cover shadow-soft"
            />
          </div>
        )}
      </div>

      {showContact && included('Contact Information') && (
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

            {location && (
              <p>
                <span className="font-bold text-ink">Location:</span>{" "}
                {location}
              </p>
            )}

            {!email && !phone && !location && (
              <p className="text-slate-500">No contact details added yet.</p>
            )}
          </div>
        </div>
      )}

      <div className={minimal?'space-y-5 border-t bg-white p-5 sm:p-6':'space-y-5 bg-slate-50 p-5 sm:p-6'}>
        {(included('About Me') || included('Education') || included('Technical Skills')) && (
          <div className={`grid items-start gap-5 ${included('Technical Skills') && (included('About Me') || included('Education')) ? 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : ''}`}>
            {(included('About Me') || included('Education')) && (
              <div className="grid content-start gap-5">
                {included('About Me') && <div id="about">
                  <Mini compact title="About Me" text={compactSummary(about)} />
                </div>}

                {included('Education') && <div id="education">
                  <Mini compact title="Education" customContent={<EducationList items={educationItems} />} />
                </div>}
              </div>
            )}

            {included('Technical Skills') && <div id="skills">
              <Mini title="Technical Skills" customContent={<PortfolioSkills skills={skills} minimal={minimal} />} />
            </div>}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
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
        {included('Profile Sources') && connectedSources.length > 0 && <div id="links">
          <Mini
            title="Profile Sources"
            customContent={<ProfileSourceList sources={connectedSources} />}
          />
        </div>}

        {included('Contact Information') && <div id="contact">
          <Mini
            title="Contact Information"
            customContent={<ContactDetails email={email} phone={phone} location={location} />}
          />
        </div>}
        </div>
      </div>
    </div>
  );
}

function Mini({ title, text, customContent, compact = false }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${compact ? "p-4" : "p-5"}`}>
      <h3 className={`${compact ? "mb-2" : "mb-3"} text-sm font-bold uppercase tracking-wide text-forge`}>
        {title}
      </h3>

      {customContent || (
        <p className="text-sm leading-relaxed text-slate-600">
          {text || "No data available yet."}
        </p>
      )}
    </section>
  );
}

function EducationList({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No education added yet.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <div key={`${item.degree}-${item.school}-${item.year}-${index}`} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-ink">
                {item.degree || "Education"}
              </p>
              {item.school && (
                <p className="mt-1 text-sm text-slate-600">{item.school}</p>
              )}
            </div>
            {item.year && (
              <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {item.year}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactDetails({ email, phone, location }) {
  const details = [
    email && { label: "Email", value: email, href: `mailto:${email}`, Icon: Mail },
    phone && { label: "Phone", value: phone, href: `tel:${phone}`, Icon: Phone },
    location && { label: "Location", value: location, Icon: MapPin },
  ].filter(Boolean);

  if (!details.length) {
    return <p className="text-sm text-slate-500">No contact information shared.</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {details.map(({ label, value, href, Icon }) => {
        const content = (
          <>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-blue-50 text-forge">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase text-slate-500">{label}</span>
              <span className="block break-words text-sm font-medium text-ink">{value}</span>
            </span>
          </>
        );
        return href ? (
          <a key={label} href={href} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:text-forge">
            {content}
          </a>
        ) : (
          <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}

function ProfileSourceList({ sources = [] }) {
  return (
    <div className="divide-y divide-slate-100">
      {sources.map((source, index) => {
        const url = safeUrl(source.url);
        if (!url) return null;
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        return (
          <a
            key={`${source.name}-${index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-forge"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-blue-50 text-forge">
                <Link2 size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">{source.name || "Professional profile"}</span>
                <span className="block truncate text-xs text-slate-500">{hostname}</span>
              </span>
            </span>
            <ExternalLink size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}

function compactSummary(value) {
  const sentences = String(value || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const seen = new Set();
  return sentences
    .filter((sentence) => {
      const key = sentence.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(" ");
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
