import VisualTemplateEditor from "../components/VisualTemplateEditor";
import ResumeApproval from '../components/ResumeApproval';
import ResumeImprovements from '../components/ResumeImprovements';
import { getResumeSuggestions } from '../services/resumeSuggestionsService';
import { saveResumeProfileSuggestions } from '../services/resumeProfileSuggestions';
import { resumeSuggestionProfile, includeApprovedSuggestions } from '../utils/resumeSuggestions';
import { normalizeResume } from '../utils/resumeContent';
import { RESUME_HISTORY_LIMIT } from '../utils/resumeHistory';
import { profilePhoto } from '../utils/profilePhoto';
import { safeUrl } from '../utils/grounding';
import { uploadProfilePhoto } from '../services/storageService';
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import ResumePreview from "../components/ResumePreview";
import ProfileAvatar from "../components/ProfileAvatar";
import DocumentStatus from "../components/DocumentStatus";
import { generateAIContent } from "../services/aiService";
import { onAuthChange } from "../services/authservice";
import {
  getProfile,
  getResumeDraft,
  deleteResumeHistoryEntry,
  saveResumeDraft,
} from "../services/firestoreService";
import { Camera, ChevronLeft, ChevronRight, WandSparkles, Save, Download, Eye, History, RotateCcw, Trash2, Upload, UserRound, X, Pencil } from "lucide-react";

const defaultConfig = {
  targetRole: "",
  experienceLevel: "Mid-Level (2–5 years)",
  tone: "Professional",
  photoMode: "none",
  customPhotoUrl: "",
};

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const resumeRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [improvements, setImprovements] = useState(null);
  const workflowBusy = useRef(false);
  const draftRevision = useRef(0);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  const [config, setConfig] = useState(defaultConfig);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      const revision = draftRevision.current;
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const savedProfile = await getProfile(user.uid);
        const savedDraft = await getResumeDraft(user.uid);

        if (savedProfile) {
          setProfile(savedProfile);

          setConfig((prev) => ({
            ...prev,
            targetRole: savedProfile.targetRole || prev.targetRole,
          }));
        }

        if (savedDraft && !workflowBusy.current && revision===draftRevision.current) {
          const stored = savedDraft.draft;
          const normalized = stored ? { ...stored, resume: normalizeResume(stored.resume, savedProfile || {}) } : null;
          const loadedConfig = normalizeResumeConfig(
            savedDraft.config,
            normalized,
            savedProfile,
          );
          const configuredDraft = normalized ? {
            ...normalized,
            resume: {
              ...normalized.resume,
              imgUrl: resolveResumePhoto(loadedConfig, savedProfile),
            },
          } : null;
          setConfig(loadedConfig);
          setDraft(configuredDraft);
          setHistory(Array.isArray(savedDraft.history) ? savedDraft.history : []);
          setSavedFingerprint(draftFingerprint(configuredDraft, loadedConfig));
        }
      } catch (error) {
        console.error("Error loading resume builder data:", error);
        setError("Failed to load saved resume data.");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    if (name === "targetRole") return;

    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generate = async () => {
    if(!profile?.targetRole) { setError('Set your target role in Profile first.'); return; }
    setGenerating(true);
    workflowBusy.current=true;
    draftRevision.current++;
    setError("");
    try {
      const baseline=structuredClone(profile);
      const result=await getResumeSuggestions(baseline);
      setImprovements({...result,profile:baseline,config:{...config}});
    } catch(error) {
      workflowBusy.current=false;
      setError(error.message || 'Failed to prepare resume improvement questions.');
    } finally { setGenerating(false); }
  };
  const generateReviewedDraft = async suggestions => {
    const latestProfile=await getProfile(userId);
    if(latestProfile?.targetRole!==improvements.profile.targetRole) throw new Error('Your target role changed. Restart the improvement questions.');
    const approvedProfile=resumeSuggestionProfile(improvements.profile,suggestions);
    const generated=await generateAIContent('Resume Draft',{...improvements.config,profile:approvedProfile});
    const resume=includeApprovedSuggestions(generated.resume,approvedProfile,suggestions);
    const result={...generated,status:'draft',resume:{...resume,imgUrl:resolveResumePhoto(improvements.config,latestProfile)}};
    const saved = await saveResumeDraft(
      userId,
      {config:improvements.config,draft:result},
      {recordHistory:true,label:"Generated draft"},
    );
    draftRevision.current++;
    setEditing(false);
    setReviewing(true);
    setDraft(result);
    setHistory(saved.data?.history || []);
    setSavedFingerprint(draftFingerprint(result, improvements.config));
    setImprovements(null);
    workflowBusy.current=false;
  };

  const handleSaveDraft = async () => {
    if (!draft) {
      alert("Generate a resume draft first.");
      return;
    }

    if (!userId) {
      alert("You must be logged in to save your resume draft.");
      return;
    }

    setSaving(true);

    try {
      const saved = await saveResumeDraft(userId, {
        config,
        draft,
      }, { recordHistory: true, label: "Saved draft" });

      setHistory(saved.data?.history || []);
      setSavedFingerprint(draftFingerprint(draft, config));
    } catch (error) {
      console.error("Error saving resume draft:", error);
      alert("Failed to save resume draft.");
    }

    setSaving(false);
  };

  const handleDownloadResume = () => {
    if (!draft) {
      alert("Generate a resume draft first.");
      return;
    }

    const resume = draft.resume || buildResumeFromDraft(profile, draft);
    const resumeText = formatResumeText(resume);
    const legacyResumeText = [
      draft.title,
      "",
      draft.content,
      "",
      ...(draft.bullets || []).map((bullet) => `• ${bullet}`),
    ].join("\n");

    const blob = new Blob([resumeText || legacyResumeText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${getResumeFileName(resume.fullName)}-resume.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleDownloadResumePdf = async () => {
    if (!draft) {
      alert("Generate a resume draft first.");
      return;
    }

    if (!resumeRef.current) {
      alert("Resume preview is not ready.");
      return;
    }

    const resume = draft.resume || buildResumeFromDraft(profile, draft);

    setDownloading(true);

    const options = {
      margin: 0.35,
      filename: `${getResumeFileName(resume.fullName)}-resume.pdf`,
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
    } finally {
      setDownloading(false);
    }
  };

  const selectPhotoMode = (photoMode) => {
    if (photoMode === "profile" && !safeUrl(profilePhoto(profile))) {
      setError("Upload a profile photo in Profile Management first, or choose a custom image.");
      return;
    }

    setError("");
    const nextConfig = { ...config, photoMode };
    setConfig(nextConfig);
    setDraft((previous) => previous ? {
      ...previous,
      status: "draft",
      resume: {
        ...previous.resume,
        imgUrl: resolveResumePhoto(nextConfig, profile),
      },
    } : previous);
  };

  const handleResumePhotoUpload = async (file) => {
    if (!file || !userId || uploadingPhoto) return;
    setUploadingPhoto(true);
    setError("");
    try {
      const customPhotoUrl = await uploadProfilePhoto(userId, file);
      const nextConfig = { ...config, photoMode: "custom", customPhotoUrl };
      setConfig(nextConfig);
      setDraft((previous) => previous ? {
        ...previous,
        status: "draft",
        resume: { ...previous.resume, imgUrl: customPhotoUrl },
      } : previous);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload the resume photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const restoreHistoryEntry = (entry) => {
    const restoredConfig = normalizeResumeConfig(entry.config, entry.draft, profile);
    const restoredResume = normalizeResume(entry.draft?.resume, profile || {});
    setDraft({
      ...entry.draft,
      resume: {
        ...restoredResume,
        imgUrl: resolveResumePhoto(restoredConfig, profile),
      },
    });
    setConfig(restoredConfig);
    setEditing(false);
    setReviewing(false);
    setViewingHistory(null);
  };

  const deleteHistoryEntry = async (entry) => {
    if (!window.confirm(`Delete "${entry.label || "Saved draft"}" from history?`)) {
      return;
    }

    setDeletingHistoryId(entry.id);
    try {
      const result = await deleteResumeHistoryEntry(userId, entry.id);
      setHistory(result.history || []);
      if (viewingHistory?.id === entry.id) setViewingHistory(null);
    } catch (deleteError) {
      console.error("Error deleting resume history:", deleteError);
      alert("Failed to delete this history entry.");
    } finally {
      setDeletingHistoryId("");
    }
  };

  if (loading) {
    return (
      <AppLayout title="AI-Assisted Resume Builder">
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  const draftSaved = Boolean(draft) && savedFingerprint === draftFingerprint(draft, config);
  const selectedPhotoUrl = resolveResumePhoto(config, profile);
  const hasProfilePhoto = Boolean(safeUrl(profilePhoto(profile)));
  const matchingHistory = [...history].reverse().filter((entry) => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return true;
    return [entry.label, entry.draft?.status, formatSavedDate(entry.savedAt)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const historyPageCount = Math.max(1, Math.ceil(matchingHistory.length / 10));
  const currentHistoryPage = Math.min(historyPage, historyPageCount);
  const visibleHistory = matchingHistory.slice(
    (currentHistoryPage - 1) * 10,
    currentHistoryPage * 10,
  );

  return (
    <AppLayout
      title="AI-Assisted Resume Builder"
      subtitle="Generate an employer-ready resume using approved profile data"
      badge="Powered by AI"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.6fr)_minmax(0,1.8fr)]">
        <Card title="Resume Configuration">
          <div className="grid gap-4">
            <FormField
              label="Target ICT Role"
              type="text"
              name="targetRole"
              value={profile?.targetRole || ""}
              placeholder="Set target role in Profile"
              readOnly
            />
            <Button type="button" variant="outline" onClick={() => navigate('/profile')}>
              Change Target Role
            </Button>

            <FormField
              label="Resume Tone"
              as="select"
              name="tone"
              value={config.tone}
              onChange={handleConfigChange}
            >
              <option value="Professional">Professional</option>
              <option value="Confident">Confident</option>
              <option value="Concise">Concise</option>
              <option value="Modern">Modern</option>
              <option value="Academic">Academic</option>
            </FormField>

            <fieldset className="border-t border-slate-200 pt-4">
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Resume Photo
              </legend>
              <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-300 bg-white">
                {[
                  ["none", X, "None"],
                  ["profile", UserRound, "Profile"],
                  ["custom", Camera, "Upload"],
                ].map(([mode, Icon, label]) => (
                  <label
                    key={mode}
                    className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 border-r border-slate-200 px-2 py-2 text-center text-xs font-semibold last:border-r-0 ${config.photoMode === mode ? "bg-blue-50 text-forge" : "text-slate-600 hover:bg-slate-50"} ${mode === "profile" && !hasProfilePhoto ? "opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="photoMode"
                      value={mode}
                      checked={config.photoMode === mode}
                      disabled={mode === "profile" && !hasProfilePhoto}
                      className="sr-only"
                      onChange={() => selectPhotoMode(mode)}
                    />
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </label>
                ))}
              </div>

              {config.photoMode === "custom" && (
                <label className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 px-3 py-3 text-sm font-semibold text-forge hover:bg-blue-50 ${uploadingPhoto ? "pointer-events-none opacity-60" : ""}`}>
                  <Upload size={16} aria-hidden="true" />
                  {uploadingPhoto ? "Uploading photo..." : config.customPhotoUrl ? "Replace Photo" : "Choose JPG or PNG"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    disabled={uploadingPhoto}
                    onChange={(event) => {
                      handleResumePhotoUpload(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              )}

              {selectedPhotoUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-md bg-slate-50 p-3">
                  <ProfileAvatar
                    src={selectedPhotoUrl}
                    fallback={false}
                    alt="Selected resume photo"
                    className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Photo included</p>
                    <p className="text-xs text-slate-500">
                      {config.photoMode === "profile" ? "Using your profile photo" : "Using a resume-specific photo"}
                    </p>
                  </div>
                </div>
              )}
            </fieldset>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={generate}
            className="mt-5 w-full"
            disabled={generating || editing}
          >
            <WandSparkles size={16} />
            {generating ? "Preparing questions..." : "Generate Resume"}
          </Button>
          </div>
        </Card>

        <Card title="Resume Preview">
          <DocumentStatus
            label="Resume"
            exists={Boolean(draft)}
            approvalStatus={draft?.status}
            saved={draftSaved}
          />
          <div className="relative min-h-[300px]">
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-forge"></div>

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Preparing resume improvement questions...
                </p>

                <p className="text-xs text-slate-400">
                  This may take a few seconds
                </p>
              </div>
            )}

            <div ref={resumeRef}>
              <ResumePreview profile={profile} draft={draft} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {draft?.warning && <p role="alert">{draft.warning}</p>}
            {draft?.status !== 'approved' && <Button
              disabled={!draft || editing || generating || reviewing || !!improvements}
              onClick={() => setReviewing(true)}
            >
              Approve
            </Button>}
            <Button
              variant="outline"
              disabled={!draft || generating || editing}
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
              Edit
            </Button>
            <Button
              variant="outline"
              disabled={!draft || editing}
              onClick={() => setPreviewing(true)}
            >
              <Eye size={16} />
              Preview Resume
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !draft || editing || draftSaved}
            >
              <Save size={16} />
              {saving ? "Saving..." : draftSaved ? "Draft Saved" : "Save Draft"}
            </Button>

            <Button
              onClick={handleDownloadResumePdf}
              disabled={draft?.status !== "approved" || downloading || editing}
            >
              <Download size={16} />
              {downloading ? "Downloading..." : "Download Resume"}
            </Button>
          </div>
        </Card>
      </div>
      {history.length > 0 && (
        <Card title="Saved Draft History" className="mt-5" right={<History size={18} />}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <label className="block min-w-0 flex-1 sm:max-w-sm">
              <span className="mb-1 block text-sm font-bold text-ink">Filter history</span>
              <input
                type="search"
                value={historyQuery}
                placeholder="Search label, status, or date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-forge focus:ring-2 focus:ring-blue-100"
                onChange={(event) => {
                  setHistoryQuery(event.target.value);
                  setHistoryPage(1);
                }}
              />
            </label>
            <p className="text-xs text-slate-500">
              Keeps up to {RESUME_HISTORY_LIMIT} versions for 30 days.
            </p>
          </div>

          {visibleHistory.length ? (
            <div className="overflow-hidden rounded-md border border-slate-200">
              {visibleHistory.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="flex flex-col gap-3 border-b border-slate-200 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">
                      {entry.label || "Saved draft"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSavedDate(entry.savedAt)} | <span className="capitalize">{entry.draft?.status || "draft"}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => setViewingHistory(entry)}>
                      <Eye size={16} /> View
                    </Button>
                    <Button type="button" variant="outline" onClick={() => restoreHistoryEntry(entry)}>
                      <RotateCcw size={16} /> Restore
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deletingHistoryId === entry.id}
                      onClick={() => deleteHistoryEntry(entry)}
                    >
                      <Trash2 size={16} />
                      {deletingHistoryId === entry.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No history matches this filter.
            </p>
          )}

          {historyPageCount > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" disabled={currentHistoryPage === 1} onClick={() => setHistoryPage(currentHistoryPage - 1)} title="Previous page">
                <ChevronLeft size={16} />
              </Button>
              <span className="min-w-24 text-center text-sm text-slate-600">
                Page {currentHistoryPage} of {historyPageCount}
              </span>
              <Button type="button" variant="outline" disabled={currentHistoryPage === historyPageCount} onClick={() => setHistoryPage(currentHistoryPage + 1)} title="Next page">
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </Card>
      )}
      {viewingHistory && (
        <div className="fixed inset-0 z-50 flex min-w-0 flex-col bg-slate-100" role="dialog" aria-modal="true" aria-label="Saved resume history preview">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <div>
              <h2 className="font-extrabold text-ink">{viewingHistory.label || "Saved draft"}</h2>
              <p className="text-xs text-slate-500">{formatSavedDate(viewingHistory.savedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setViewingHistory(null)}>
                <RotateCcw size={16} /> Back to Latest
              </Button>
              <Button type="button" onClick={() => restoreHistoryEntry(viewingHistory)}>
                Restore This Version
              </Button>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-5xl shadow-xl">
              <ResumePreview profile={{}} draft={{...viewingHistory.draft, resume: normalizeResume(viewingHistory.draft?.resume, profile || {})}} />
            </div>
          </main>
        </div>
      )}
      {previewing && draft && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Resume preview">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setPreviewing(false)}>
                <X size={16} />
                Close Preview
              </Button>
            </div>
            <ResumePreview profile={profile} draft={draft} />
          </div>
        </div>
      )}
      {editing && draft && (
        <VisualTemplateEditor
          mode="resume"
          resume={draft.resume}
          onCancel={() => setEditing(false)}
          onSave={async (resume) => {
            const updated = { ...draft, resume, status: "draft" };
            const saved = await saveResumeDraft(
              userId,
              { config, draft: updated },
              { recordHistory: true, label: "Edited draft" },
            );
            setDraft(updated);
            setHistory(saved.data?.history || []);
            setSavedFingerprint(draftFingerprint(updated, config));
            setEditing(false);
            setReviewing(true);
          }}
        />
      )}
      {reviewing && draft && <ResumeApproval resume={draft.resume} profile={profile || {}}
        onCancel={() => setReviewing(false)}
        onEdit={() => {
          setReviewing(false);
          setEditing(true);
        }}
        onApprove={async resume => {
          const approved = { ...draft, resume, status:'approved' };
          const saved = await saveResumeDraft(
            userId,
            {config,draft:approved},
            {recordHistory:true,label:"Approved resume"},
          );
          setDraft(approved);
          setHistory(saved.data?.history || []);
          setSavedFingerprint(draftFingerprint(approved, config));
          setReviewing(false);
        }} />}
      {improvements && <ResumeImprovements suggestions={improvements.suggestions} notice={improvements.notice}
        onCancel={()=>{setImprovements(null);workflowBusy.current=false;draftRevision.current++;}}
        onSaveProfile={async suggestions=>{
          const saved=await saveResumeProfileSuggestions(userId,suggestions,improvements.profile);
          setProfile(saved);
          setDraft(previous=>previous?{...previous,status:'draft'}:null);
        }}
        onGenerate={generateReviewedDraft} />}
    </AppLayout>
  );
}

function formatResumeText(resume = {}) {
  const lines = [];

  lines.push(resume.fullName || "Your Name");

  if (resume.targetRole) lines.push(resume.targetRole);

  const contact = [
    resume.contact?.location,
    resume.contact?.phone,
    resume.contact?.email,
  ].filter(Boolean);

  if (contact.length) lines.push(contact.join(" | "));

  addSection(lines, "Professional Summary", resume.professionalSummary);

  if (resume.technicalSkills?.length) {
    addSection(
      lines,
      "Technical Skills",
      groupTechnicalSkills(resume.technicalSkills).map((group) => {
        const skills = group.items
          .map((item) =>
            item.level ? `${item.name} (${item.level})` : item.name,
          )
          .join(", ");

        return `${group.category}: ${skills}`;
      }),
    );
  }

  addSection(
    lines,
    "Work Experience",
    resume.workExperience?.map((item) =>
      [
        item.jobTitle,
        item.companyName,
        item.location,
        formatDateRange(item.startDate, item.endDate),
        item.employmentType,
        item.description,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  addSection(
    lines,
    "Projects",
    resume.projects?.map((project) =>
      [
        project.projectTitle,
        project.role,
        project.technologiesUsed &&
          `Technologies Used: ${project.technologiesUsed}`,
        project.projectLink && `Project Link: ${project.projectLink}`,
        project.repositoryLink && `Repository Link: ${project.repositoryLink}`,
        project.description,
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  addSection(
    lines,
    "Certifications",
    resume.certifications?.map((cert) =>
      [
        cert.name,
        cert.organization,
        cert.issueDate,
        cert.credentialId && `Credential ID: ${cert.credentialId}`,
        cert.credentialLink && `Credential Link: ${cert.credentialLink}`,
      ]
        .filter(Boolean)
        .join(" | "),
    ),
  );

  addSection(
    lines,
    "Education",
    resume.education?.map((item) =>
      [item.degree, item.school, item.year].filter(Boolean).join(" | "),
    ),
  );

  return lines.filter(Boolean).join("\n");
}

function addSection(lines, title, content) {
  const entries = Array.isArray(content)
    ? content.filter(Boolean)
    : content
      ? [content]
      : [];

  if (!entries.length) return;

  lines.push("", title.toUpperCase(), ...entries);
}

function buildResumeFromDraft(profile = {}, draft = {}) {
  return {
    fullName: profile?.fullName || "Your Name",
    targetRole: profile?.targetRole || "",
    contact: {
      email: profile?.email || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
    },
    professionalSummary: draft.content || profile?.summary || "",
    technicalSkills: profile?.skills || [],
    workExperience: profile?.experience || [],
    projects: profile?.projects || [],
    certifications: profile?.certifications || [],
    education: flattenEducation(profile?.education || {}),
  };
}

function groupTechnicalSkills(skills = []) {
  const grouped = {};

  skills.forEach((skill) => {
    const category = skill.category || "Skills";

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      name: skill.name || skill.skillName || "",
      level: skill.level || skill.proficiencyLevel || "",
    });
  });

  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items: items.filter((item) => item.name),
  }));
}

function flattenEducation(education) {
  const list = [];

  if (education.masters?.length) {
    education.masters.forEach((item) => {
      list.push({
        degree: item.degree || "Masteral Degree",
        school: item.university || "",
        year: item.yearGraduated || "",
      });
    });
  }

  if (education.doctoral?.length) {
    education.doctoral.forEach((item) => {
      list.push({
        degree: item.degree || "Doctoral Degree",
        school: item.university || "",
        year: item.yearGraduated || "",
      });
    });
  }

  if (education.college?.length) {
    education.college.forEach((item) => {
      list.push({
        degree: item.degreeProgram || "College Degree",
        school: item.schoolName || "",
        year: item.yearGraduated || "",
      });
    });
  }

  if (education.vocational?.length) {
    education.vocational.forEach((item) => {
      list.push({
        degree: item.course || "Vocational / Technical Education",
        school: item.institution || "",
        year: item.completionYear || "",
      });
    });
  }

  if (education.secondary?.schoolName || education.secondary?.yearGraduated) {
    list.push({
      degree: "Secondary Education",
      school: education.secondary?.schoolName || "",
      year: education.secondary?.yearGraduated || "",
    });
  }

  if (education.primary?.schoolName || education.primary?.yearGraduated) {
    list.push({
      degree: "Primary Education",
      school: education.primary?.schoolName || "",
      year: education.primary?.yearGraduated || "",
    });
  }

  return list;
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";
  if (startDate && !endDate) return startDate;
  return `${startDate} - ${endDate}`;
}

function getResumeFileName(fullName) {
  return (
    String(fullName || "cvforge")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cvforge"
  );
}

function draftFingerprint(draft, config) {
  return draft ? JSON.stringify({ draft, config }) : "";
}

function formatSavedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Saved version"
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function resolveResumePhoto(config = {}, profile = {}) {
  if (config.photoMode === "profile") return safeUrl(profilePhoto(profile));
  if (config.photoMode === "custom") return safeUrl(config.customPhotoUrl);
  return "";
}

function normalizeResumeConfig(storedConfig = {}, draft = null, profile = {}) {
  const draftPhoto = safeUrl(draft?.resume?.imgUrl);
  const savedProfilePhoto = safeUrl(profilePhoto(profile));
  const validMode = ["none", "profile", "custom"].includes(storedConfig?.photoMode);
  const photoMode = validMode
    ? storedConfig.photoMode
    : draftPhoto
      ? draftPhoto === savedProfilePhoto
        ? "profile"
        : "custom"
      : "none";

  return {
    ...defaultConfig,
    ...storedConfig,
    targetRole: profile?.targetRole || "",
    photoMode,
    customPhotoUrl:
      photoMode === "custom"
        ? safeUrl(storedConfig?.customPhotoUrl) || draftPhoto
        : safeUrl(storedConfig?.customPhotoUrl),
  };
}
