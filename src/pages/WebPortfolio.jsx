import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import FormField from "../components/FormField";
import ResumePreview from "../components/ResumePreview";
import { onAuthChange } from "../services/authservice";
import {
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
  visibility: "Private / Token-share ready",
  includeSections: includeOptions,
};

export default function WebPortfolio() {
  const resumeRef = useRef(null);

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
          slug:
            savedPortfolioDraft?.config?.slug ||
            `cvforge.app/${fullName.toLowerCase().replace(/\s+/g, "")}`,
          themeStyle:
            savedPortfolioDraft?.config?.themeStyle || defaultConfig.themeStyle,
          visibility:
            savedPortfolioDraft?.config?.visibility || defaultConfig.visibility,
          includeSections:
            savedPortfolioDraft?.config?.includeSections ||
            defaultConfig.includeSections,
        };

        setConfig(initialConfig);
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

  const generatePortfolio = async () => {
    if (!profile) {
      alert("Profile data is missing. Please complete Profile Management first.");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const result = await generateAIContent("Portfolio Draft", {
        targetRole: profile?.targetRole || "",
        tone: "Professional",
        includeSections: config.includeSections,
        portfolioConfig: config,
        profile: {
          fullName: profile?.fullName || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
          location: profile?.location || "",
          targetRole: profile?.targetRole || "",
          summary: profile?.summary || "",
          education: profile?.education || null,
          experience: profile?.experience || [],
          skills: profile?.skills || [],
          projects: profile?.projects || [],
          certifications: profile?.certifications || [],
        },
        profileSources,
      });

      setPortfolioDraft(result);

      if (userId) {
        await saveWebPortfolioDraft(userId, {
          config,
          draft: result,
        });
      }
    } catch (error) {
      console.error("Portfolio generation error:", error);
      setError(error.message || "Failed to generate portfolio.");
    }

    setGenerating(false);
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

  const handleDownloadResumePdf = async () => {
    if (!resumeDraft) {
      alert(
        "No generated resume found. Please generate a resume first in Resume Builder."
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
        <p>Loading...</p>
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
              <option value="Private / Token-share ready">
                Private / Token-share ready
              </option>
              <option value="Public">Public</option>
            </FormField>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 font-bold text-ink">Include in Portfolio</h3>

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
            className="mt-5 w-full"
            onClick={generatePortfolio}
            disabled={generating}
          >
            <Globe size={16} />
            {generating ? "Generating..." : "Generate Portfolio"}
          </Button>
        </Card>

        <Card title="Portfolio Preview">
          {portfolioDraft ? (
            <PortfolioPreview
              draft={portfolioDraft}
              profile={profile}
              profileSources={profileSources}
              showContact={showContact}
              onToggleContact={() => setShowContact((prev) => !prev)}
              onDownloadResume={handleDownloadResumePdf}
              downloading={downloading}
              hasResume={Boolean(resumeDraft)}
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

            <Button disabled={!portfolioDraft}>Publish Portfolio</Button>
          </div>
        </Card>
      </div>

      <div className="hidden">
        <div ref={resumeRef}>
          <ResumePreview profile={profile} draft={resumeDraft} />
        </div>
      </div>
    </AppLayout>
  );
}

function PortfolioPreview({
  draft,
  profile,
  profileSources,
  showContact,
  onToggleContact,
  onDownloadResume,
  downloading,
  hasResume,
}) {
  const portfolio = draft.portfolio || draft.resume || {};
  const fullName = portfolio.fullName || profile?.fullName || "Your Name";
  const targetRole =
    portfolio.targetRole || profile?.targetRole || "Target ICT Role";

  const about =
    portfolio.aboutMe ||
    portfolio.professionalSummary ||
    profile?.summary ||
    "AI-enhanced portfolio summary will appear here.";

  const skills =
    portfolio.technicalSkills ||
    portfolio.skills ||
    profile?.skills ||
    [];

  const projects = portfolio.projects || profile?.projects || [];
  const certifications =
    portfolio.certifications || profile?.certifications || [];

  const email = profile?.email || portfolio.contact?.email || "";
  const phone = profile?.phone || portfolio.contact?.phone || "";

  const connectedSources = (profileSources || []).filter(
    (source) => source.url && source.url.trim()
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b p-4 text-sm">
        <b className="text-forge">{fullName}</b>

        <div className="hidden gap-5 sm:flex">
          <span>About</span>
          <span>Skills</span>
          <span>Projects</span>
          <span>Certificates</span>
          <span>Links</span>
          <span>Contact</span>
        </div>
      </div>

      <div className="grid gap-6 bg-blue-50 p-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm text-slate-500">Hello, I'm</p>

          <h2 className="text-4xl font-extrabold text-ink">{fullName}</h2>

          <p className="mt-1 font-bold text-forge">{targetRole}</p>

          <p className="mt-4 text-slate-600">{about}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={onDownloadResume}
              disabled={!hasResume || downloading}
            >
              <Download size={16} />
              {downloading ? "Downloading..." : "Download Resume"}
            </Button>

            <Button variant="outline" onClick={onToggleContact}>
              <Mail size={16} />
              Contact Me
            </Button>
          </div>
        </div>

        <div className="grid place-items-center">
          <div className="grid h-40 w-40 place-items-center rounded-full bg-white text-7xl shadow-soft">
            👨‍💻
          </div>
        </div>
      </div>

      {showContact && (
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
                      href={source.url}
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

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Mini title="About Me" text={about} />

        <Mini title="Technical Skills" text={formatSkills(skills)} />

        <Mini title="Featured Projects" text={formatProjects(projects)} />

        <Mini
          title="Certificates"
          text={formatCertificates(certifications)}
        />

        <Mini
          title="Profile Links"
          customContent={
            connectedSources.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {connectedSources.map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
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

        <Mini
          title="Contact"
          text={formatContact(email, phone, connectedSources)}
        />
      </div>
    </div>
  );
}

function Mini({ title, text, customContent }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-2 font-bold text-ink">{title}</h3>

      {customContent || (
        <p className="text-sm text-slate-600">
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
            item.level ? `${item.name} (${item.level})` : item.name
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

      return `${title}${tech}`;
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

function formatContact(email, phone, sources = []) {
  return [
    email ? `Email: ${email}` : "",
    phone ? `Phone: ${phone}` : "",
    ...sources.map((source) => `${source.name}: ${source.url}`),
  ]
    .filter(Boolean)
    .join(", ");
}