import DraftEditor from "../components/DraftEditor";
import ResumeApproval from '../components/ResumeApproval';
import ResumeImprovements from '../components/ResumeImprovements';
import { getResumeSuggestions } from '../services/resumeSuggestionsService';
import { saveResumeProfileSuggestions } from '../services/resumeProfileSuggestions';
import { resumeSuggestionProfile, includeApprovedSuggestions } from '../utils/resumeSuggestions';
import { normalizeResume } from '../utils/resumeContent';
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import ResumePreview from "../components/ResumePreview";
import { generateAIContent } from "../services/aiService";
import { onAuthChange } from "../services/authservice";
import {
  getProfile,
  getResumeDraft,
  saveResumeDraft,
} from "../services/firestoreService";
import { WandSparkles, Save, Download } from "lucide-react";

const defaultConfig = {
  targetRole: "",
  experienceLevel: "Mid-Level (2–5 years)",
  tone: "Professional",
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

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
          setConfig({
            ...defaultConfig,
            ...savedDraft.config,
            targetRole: savedProfile?.targetRole || "",
          });
          const stored = savedDraft.draft;
          setDraft(stored ? { ...stored, resume: normalizeResume(stored.resume, savedProfile || {}) } : null);
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
    const result={...generated,status:'draft',resume:includeApprovedSuggestions(generated.resume,approvedProfile,suggestions)};
    await saveResumeDraft(userId,{config:improvements.config,draft:result});
    draftRevision.current++;
    setEditing(false);
    setReviewing(true);
    setDraft(result);
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
      await saveResumeDraft(userId, {
        config,
        draft,
      });

      alert("Resume draft saved to Firebase.");
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

  if (loading) {
    return (
      <AppLayout title="AI-Assisted Resume Builder">
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="AI-Assisted Resume Builder"
      subtitle="Generate an employer-ready resume using approved profile data"
      badge="Powered by AI"
    >
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.5fr]">
        <Card title="Resume Configuration">
          <div className="grid gap-4">
            <FormField
              label="Target ICT Role"
              as="select"
              name="targetRole"
              value={profile?.targetRole || ""}
              disabled
              onChange={handleConfigChange}
            >
              <option value={profile?.targetRole || ""}>
                {profile?.targetRole || "Set target role in Profile"}
              </option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Data Analyst">Data Analyst</option>
              <option value="Cybersecurity Specialist">
                Cybersecurity Specialist
              </option>
            </FormField>
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
          </div>

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
        </Card>

        <Card
          title="Resume Preview"
          right={
            draft ? (
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                AI Generated Draft
              </span>
            ) : (
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                No Draft Yet
              </span>
            )
          }
        >
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
            <span>{draft?.status === "approved" ? "Approved" : "Draft"}</span>
            <Button
              variant="outline"
              disabled={!draft || generating || editing}
              onClick={() => {
                setEditing(true);
              }}
            >
              Edit
            </Button>
            {editing && (
              <DraftEditor
                resume={draft.resume}
                onCancel={() => setEditing(false)}
                onSave={async (resume) => {
                  const updated = { ...draft, resume, status: "draft" };
                  await saveResumeDraft(userId, { config, draft: updated });
                  setDraft(updated);
                  setEditing(false);
                  setReviewing(true);
                }}
              />
            )}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !draft || editing}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Draft"}
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
      {reviewing && draft && <ResumeApproval resume={draft.resume} profile={profile || {}}
        onCancel={() => setReviewing(false)}
        onApprove={async resume => {
          const approved = { ...draft, resume, status:'approved' };
          await saveResumeDraft(userId,{config,draft:approved});
          setDraft(approved);
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
