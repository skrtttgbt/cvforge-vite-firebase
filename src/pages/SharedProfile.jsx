import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  getProfile,
  getProfileSources,
  getResumeDraft,
} from "../services/firestoreService";

export default function SharedProfile() {
  const { userId, ownerId } = useParams();
  const candidateId = userId || ownerId;

  const [profile, setProfile] = useState(null);
  const [profileSources, setProfileSources] = useState([]);
  const [resumeDraft, setResumeDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSharedProfile() {
      if (!candidateId) {
        setError("Missing candidate ID in the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const savedProfile = await getProfile(candidateId);
        const savedSources = await getProfileSources(candidateId);
        const savedResumeDraft = await getResumeDraft(candidateId);
        console.log("Loaded shared profile data:", {
          profile: savedProfile,
          profileSources: savedSources,
          resumeDraft: savedResumeDraft,
        });
        setProfile(savedProfile || null);
        setProfileSources(savedSources?.sources || []);
        setResumeDraft(savedResumeDraft?.draft || null);
      } catch (error) {
        console.error("Shared profile load error:", error);
        setError("Failed to load shared profile.");
      }

      setLoading(false);
    }

    loadSharedProfile();
  }, [candidateId]);

  const resume = resumeDraft?.resume || null;

  const fullName = resume?.fullName || profile?.fullName || "Unnamed Candidate";
  const targetRole =
    resume?.targetRole || profile?.targetRole || "Target ICT Role";
  const imageUrl =
    profile?.imgUrl || profile?.photoURL || resume?.imgUrl || resume?.photoURL || "";

  const contact = resume?.contact || {};

  const email = contact.email || profile?.email || "";
  const phone = contact.phone || profile?.phone || "";
  const location = contact.location || profile?.location || "";

  const summary =
    resume?.professionalSummary ||
    profile?.summary ||
    "No professional summary available.";

  const workExperience = useMemo(
    () => normalizeExperience(resume?.workExperience || profile?.experience),
    [resume, profile]
  );

  const educationItems = useMemo(
    () => normalizeEducation( profile?.education),
    [resume, profile]
  );

  const skills = useMemo(
    () => normalizeSkills(resume?.technicalSkills || profile?.skills),
    [resume, profile]
  );

  const projects = useMemo(
    () => normalizeProjects(resume?.projects || profile?.projects),
    [resume, profile]
  );

  const certifications = useMemo(
    () =>
      normalizeCertifications(
        resume?.certifications || profile?.certifications
      ),
    [resume, profile]
  );

  const connectedSources = useMemo(
    () =>
      (profileSources || []).filter(
        (source) => source.url && source.url.trim()
      ),
    [profileSources]
  );

  if (loading) {
    return (
      <AppLayout
        title="Shared Profile Viewer"
        subtitle="Employer / HR secure candidate view"
        employer
      >
        <p>Loading...</p>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        title="Shared Profile Viewer"
        subtitle="Employer / HR secure candidate view"
        employer
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!profile && !resume) {
    return (
      <AppLayout
        title="Shared Profile Viewer"
        subtitle="Employer / HR secure candidate view"
        employer
      >
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
          <p className="font-bold text-ink">Candidate profile not found.</p>
          <p className="mt-1 text-sm">
            The shared profile may not exist or may no longer be available.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Shared Profile Viewer"
      subtitle="Employer / HR secure candidate view"
      employer
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #print-area,
            #print-area * {
              visibility: visible !important;
            }

            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
            }

            .no-print {
              display: none !important;
            }

            @page {
              margin: 16mm;
            }
          }
        `}
      </style>

      <div id="print-area">
        <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr] print:block">
          <Card>
            <div className="flex flex-col gap-6 md:flex-row">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${fullName} profile`}
                  className="h-32 w-32 shrink-0 rounded-full border border-slate-200 object-cover print:hidden"
                />
              ) : (
                <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-blue-100 text-3xl font-extrabold text-forge print:hidden">
                  {getInitials(fullName)}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold text-ink">
                  {fullName}
                </h1>

                <p className="font-bold text-forge">{targetRole}</p>

                <p className="mt-3 max-w-2xl text-slate-600">{summary}</p>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <span>{email || "No email"}</span>
                  <span>{phone || "No phone"}</span>
                  <span>{location || "No location"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Profile Information">
            <div className="grid gap-3 text-sm">
              <Info label="Target Role" value={targetRole} />
              <Info
                label="Experience Level"
                value={profile?.experienceLevel || "Not specified"}
              />
              <Info
                label="Availability"
                value={profile?.availability || "Open to Opportunities"}
              />
              <Info
                label="Last Updated"
                value={formatDate(profile?.updatedAt)}
              />
            </div>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr] print:block">
          <div className="grid gap-5">
            <Card title="Professional Summary">
              <p className="text-slate-600">{summary}</p>
            </Card>

            <Card title="Work Experience">
              {workExperience.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No work experience added yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {workExperience.map((job, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <p className="font-bold text-ink">
                        {job.jobTitle || "Job Title"}{" "}
                        {job.companyName ? `| ${job.companyName}` : ""}
                      </p>

                      <p className="text-sm text-slate-500">
                        {[job.location, formatDateRange(job.startDate, job.endDate)]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>

                      {job.description && (
                        <p className="mt-3 text-sm text-slate-600">
                          {job.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Education">
              {educationItems.length === 0 ? (
                <p className="text-sm text-slate-500">No education added yet.</p>
              ) : (
                <div className="space-y-3">
                  {educationItems.map((edu, index) => (
                    <div
                      key={index}
                      className="flex justify-between gap-4 border-b py-3 last:border-0"
                    >
                      <p>
                        <b>{edu.degree || "Education"}</b>
                        <br />
                        {edu.school || "School not specified"}
                      </p>

                      <span className="text-sm text-slate-500">
                        {edu.year || ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-5">
            <Card title="Skills">
              {skills.length === 0 ? (
                <p className="text-sm text-slate-500">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill.name}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold"
                    >
                      {skill.level
                        ? `${skill.name} (${skill.level})`
                        : skill.name}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Top Projects">
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500">No projects added yet.</p>
              ) : (
                projects.map((project, index) => (
                  <div key={index} className="border-b py-3 last:border-0">
                    <h3 className="font-bold text-ink">
                      {project.projectTitle || "Untitled Project"}
                    </h3>

                    {project.description && (
                      <p className="text-sm text-slate-600">
                        {project.description}
                      </p>
                    )}

                    {project.technologiesUsed && (
                      <p className="mt-1 text-xs text-slate-500">
                        Tech: {project.technologiesUsed}
                      </p>
                    )}

                    {(project.projectLink || project.repositoryLink) && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {project.projectLink && (
                          <a
                            href={project.projectLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-forge"
                          >
                            View Project ↗
                          </a>
                        )}

                        {project.repositoryLink && (
                          <a
                            href={project.repositoryLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-forge"
                          >
                            Repository ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </Card>

            <Card title="Certifications">
              {certifications.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No certifications added yet.
                </p>
              ) : (
                <ul className="list-inside list-disc text-sm text-slate-600">
                  {certifications.map((cert, index) => (
                    <li key={index}>
                      {cert.name}
                      {cert.organization ? ` — ${cert.organization}` : ""}
                      {cert.issueDate ? ` (${cert.issueDate})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Profile Links">
              {connectedSources.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No profile links shared yet.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {connectedSources.map((source) => (
                    <a
                      key={source.name}
                      href={formatUrl(source.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-forge hover:bg-blue-50"
                    >
                      {source.name} ↗
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <div className="no-print mt-5 flex justify-end gap-3 print:hidden">
        <Button onClick={() => window.print()}>Download Resume PDF</Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print Profile
        </Button>
      </div>
    </AppLayout>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <b className="text-right text-ink">{value || "Not specified"}</b>
    </div>
  );
}

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CV";
}

function formatUrl(url) {
  if (!url) return "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

function normalizeEducation(education) {
  if (!education) return [];
  console.log("Normalizing education:", education);

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
        degree: item.degree || item.course || label,
        school: item.schoolName || item.school || "",
        year:
          item.yearGraduated ||
          item.year ||
          [item.startYear, item.endYear].filter(Boolean).join(" - "),
      });
    });
  });

  return result;
}

function normalizeExperience(experience) {
  if (!experience) return [];

  if (!Array.isArray(experience)) return [];

  return experience.map((item) => ({
    jobTitle: item.jobTitle || item.role || "",
    companyName: item.companyName || item.company || "",
    employmentType: item.employmentType || "",
    location: item.location || "",
    startDate: item.startDate || "",
    endDate: item.isCurrent ? "Present" : item.endDate || "",
    description: Array.isArray(item.description)
      ? item.description.join(" ")
      : item.description || "",
  }));
}

function normalizeSkills(skills) {
  if (!skills) return [];

  if (!Array.isArray(skills)) return [];

  const result = [];

  skills.forEach((skill) => {
    if (typeof skill === "string") {
      result.push({
        name: skill,
        level: "",
      });
      return;
    }

    if (skill.items?.length) {
      skill.items.forEach((item) => {
        result.push({
          name: item.name || item.skillName || "",
          level: item.level || item.proficiencyLevel || "",
        });
      });
      return;
    }

    result.push({
      name: skill.name || skill.skillName || "",
      level: skill.level || skill.proficiencyLevel || "",
    });
  });

  return result.filter((skill) => skill.name);
}

function normalizeProjects(projects) {
  if (!projects) return [];

  if (!Array.isArray(projects)) return [];

  return projects.map((project) => ({
    projectTitle: project.projectTitle || project.name || "",
    projectType: project.projectType || "",
    role: project.role || "",
    technologiesUsed: project.technologiesUsed || "",
    projectLink: project.projectLink || project.link || "",
    repositoryLink: project.repositoryLink || "",
    startDate: project.startDate || "",
    endDate: project.isOngoing ? "Present" : project.endDate || "",
    description: project.description || project.desc || "",
  }));
}

function normalizeCertifications(certifications) {
  if (!certifications) return [];

  if (!Array.isArray(certifications)) return [];

  return certifications.map((cert) => {
    if (typeof cert === "string") {
      return {
        name: cert,
        organization: "",
        issueDate: "",
      };
    }

    return {
      name: cert.name || cert.certificationName || "",
      organization: cert.organization || cert.issuer || "",
      issueDate: cert.issueDate || cert.date || "",
      credentialId: cert.credentialId || "",
      credentialLink: cert.credentialLink || "",
    };
  });
}
function formatDate(value) {
  if (!value) return "Not recorded";

  const date = value?.toDate?.() || new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleDateString(undefined, { dateStyle: "long" });
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";

  return [startDate, endDate].filter(Boolean).join(" - ");
} 
