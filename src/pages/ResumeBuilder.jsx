import { useEffect, useState } from "react";
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
import { WandSparkles, Save, RefreshCw, Download } from "lucide-react";

const includeOptions = [
  "Professional Summary",
  "Technical Skills",
  "Work Experience",
  "Projects",
  "Certifications",
  "Education",
];

const defaultConfig = {
  targetRole: "Full Stack Developer",
  experienceLevel: "Mid-Level (2–5 years)",
  tone: "Professional",
  length: "1 Page",
  includeSections: includeOptions,
};

export default function ResumeBuilder() {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  const [config, setConfig] = useState(defaultConfig);
  const [draft, setDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSectionToggle = (section) => {
    setConfig((prev) => {
      const alreadyIncluded = prev.includeSections.includes(section);

      return {
        ...prev,
        includeSections: alreadyIncluded
          ? prev.includeSections.filter((item) => item !== section)
          : [...prev.includeSections, section],
      };
    });
  };

  const generate = async () => {
    setGenerating(true);
    setError("");

    try {
      const result = await generateAIContent("Resume Draft", {
        targetRole: config.targetRole,
        experienceLevel: config.experienceLevel,
        tone: config.tone,
        length: config.length,
        includeSections: config.includeSections,
        profile: {
          fullName: profile?.fullName,
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

  const handleDownloadText = () => {
    if (!draft) {
      alert("Generate a resume draft first.");
      return;
    }

    const resumeText = [
      draft.title,
      "",
      draft.content,
      "",
      ...(draft.bullets || []).map((bullet) => `• ${bullet}`),
    ].join("\n");

    const blob = new Blob([resumeText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "resume-draft.txt";
    link.click();

    URL.revokeObjectURL(url);
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

            <FormField
              label="Resume Length"
              as="select"
              name="length"
              value={config.length}
              onChange={handleConfigChange}
            >
              <option value="1 Page">1 Page</option>
              <option value="2 Pages">2 Pages</option>
              <option value="Detailed CV">Detailed CV</option>
            </FormField>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 font-bold text-ink">Include in Resume</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {includeOptions.map((option) => (
                <label key={option} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={config.includeSections.includes(option)}
                    onChange={() => handleSectionToggle(option)}
                  />

                  {option}
                </label>
              ))}
            </div>
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
          <ResumePreview profile={profile} draft={draft} />

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !draft}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            <Button variant="outline" onClick={generate} disabled={generating}>
              <RefreshCw size={16} />
              {draft ? "Regenerate" : "Generate First"}
            </Button>

            <Button onClick={handleDownloadText} disabled={!draft}>
              <Download size={16} />
              Download TXT
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
