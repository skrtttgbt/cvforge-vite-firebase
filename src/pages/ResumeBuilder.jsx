import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
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
  targetRole: "Full Stack Developer",
  experienceLevel: "Mid-Level (2–5 years)",
  tone: "Professional",
};

export default function ResumeBuilder() {
  const resumeRef = useRef(null);
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

        if (savedDraft) {
          setConfig(savedDraft.config || defaultConfig);
          setDraft(savedDraft.draft || null);
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

    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generate = async () => {
    setGenerating(true);
    setError("");

    try {
      const result = await generateAIContent("Resume Draft", {
        targetRole: config.targetRole,
        experienceLevel: config.experienceLevel,
        tone: config.tone,
        profile: {
          fullName: profile?.fullName,
          targetRole: profile?.targetRole,
          email: profile?.email,
          phone: profile?.phone,
          location: profile?.location,
          summary: profile?.summary,
          education: profile?.education,
          experience: profile?.experience,
          skills: profile?.skills,
          projects: profile?.projects,
          certifications: profile?.certifications,
        },
      });

      setDraft(result);

      if (userId) {
        await saveResumeDraft(userId, {
          config,
          draft: result,
        });
      }
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to generate resume draft.");
    } finally {
      setGenerating(false);
    }
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
        <p>Loading...</p>
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
              value={config.targetRole}
              onChange={handleConfigChange}
            >
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

            <FormField
              label="Experience Level"
              as="select"
              name="experienceLevel"
              value={config.experienceLevel}
              onChange={handleConfigChange}
            >
              <option value="Entry-Level / Fresh Graduate">
                Entry-Level / Fresh Graduate
              </option>
              <option value="Junior Level (0–2 years)">
                Junior Level (0–2 years)
              </option>
              <option value="Mid-Level (2–5 years)">
                Mid-Level (2–5 years)
              </option>
              <option value="Senior Level (5+ years)">
                Senior Level (5+ years)
              </option>
            </FormField>

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
            disabled={generating}
          >
            <WandSparkles size={16} />
            {generating ? "Generating..." : "Generate Resume"}
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
                    AI is generating your resume...
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
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !draft}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button onClick={handleDownloadResumePdf} disabled={!draft || downloading}>
              <Download size={16} />
              {downloading ? "Downloading..." : "Download Resume"}
            </Button>
          </div>
        </Card>
      </div>
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
          .map((item) => item.level ? `${item.name} (${item.level})` : item.name)
          .join(", ");

        return `${group.category}: ${skills}`;
      })
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
      ].filter(Boolean).join("\n")
    )
  );

  addSection(
    lines,
    "Projects",
    resume.projects?.map((project) =>
      [
        project.projectTitle,
        project.role,
        project.technologiesUsed && `Technologies Used: ${project.technologiesUsed}`,
        project.projectLink && `Project Link: ${project.projectLink}`,
        project.repositoryLink && `Repository Link: ${project.repositoryLink}`,
        project.description,
      ].filter(Boolean).join("\n")
    )
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
      ].filter(Boolean).join(" | ")
    )
  );

  addSection(
    lines,
    "Education",
    resume.education?.map((item) =>
      [item.degree, item.school, item.year].filter(Boolean).join(" | ")
    )
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
  return String(fullName || "cvforge")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "cvforge";
}
