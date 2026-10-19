import { useEffect, useId, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import Button from "./Button";
import ProfileAvatar from "./ProfileAvatar";
import { safeUrl } from "../utils/grounding";
import { normalizeResume, resumeSections } from "../utils/resumeContent";
import { skillCategories } from "../utils/resumeSuggestions";

const fieldMap = {
  technicalSkills: [
    { field: "name", label: "Skill", suggestions: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C#", "PHP", "SQL", "Firebase", "Git", "Figma", "Communication", "Problem Solving"] },
    { field: "category", label: "Category", options: skillCategories },
    { field: "level", label: "Level", options: ["Beginner", "Intermediate", "Advanced", "Expert"] },
  ],
  education: [
    { field: "degree", label: "Degree", suggestions: ["Bachelor of Science in Information Technology", "Bachelor of Science in Computer Science", "Bachelor of Science in Information Systems", "Diploma in Information Technology", "Master of Science in Information Technology"] },
    { field: "school", label: "School" },
    { field: "year", label: "Year" },
  ],
  workExperience: [
    { field: "jobTitle", label: "Job title", suggestions: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Developer", "Web Developer", "UI/UX Designer", "Data Analyst", "IT Support Specialist"] },
    { field: "companyName", label: "Company" },
    { field: "location", label: "Location" },
    { field: "startDate", label: "Start date" },
    { field: "endDate", label: "End date" },
    { field: "employmentType", label: "Employment type", options: ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Volunteer"] },
    { field: "description", label: "Description", multiline: true },
  ],
  projects: [
    { field: "projectTitle", label: "Project title" },
    { field: "role", label: "Role", options: ["Project Lead", "Full Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer", "UI/UX Designer", "Data Analyst", "Contributor"] },
    { field: "technologiesUsed", label: "Technologies", suggestions: ["React, Node.js, Firebase", "HTML, CSS, JavaScript", "Python, Django, PostgreSQL", "Java, Spring Boot, MySQL", "Figma"] },
    { field: "projectLink", label: "Project link", type: "url" },
    { field: "repositoryLink", label: "Repository link", type: "url" },
    { field: "description", label: "Description", multiline: true },
  ],
  certifications: [
    { field: "name", label: "Certificate", suggestions: ["Google Data Analytics Professional Certificate", "Google UX Design Professional Certificate", "AWS Certified Cloud Practitioner", "Microsoft Certified: Azure Fundamentals", "Cisco Certified Support Technician"] },
    { field: "organization", label: "Organization", suggestions: ["Google", "Microsoft", "Amazon Web Services", "Cisco", "Coursera", "Udemy"] },
    { field: "issueDate", label: "Issue date" },
    { field: "credentialId", label: "Credential ID" },
    { field: "credentialLink", label: "Credential link", type: "url" },
  ],
};

const roleSuggestions = ["Full Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer", "Software Developer", "UI/UX Designer", "Data Analyst", "Cybersecurity Specialist", "IT Support Specialist"];

export default function VisualTemplateEditor({ resume, mode = "resume", onSave, onCancel }) {
  const [value, setValue] = useState(() => normalizeResume(resume));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const portfolio = mode === "portfolio";
  const imageUrl = safeUrl(value.imgUrl);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event) => {
      if (event.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", close);
    };
  }, [onCancel, saving]);

  const update = (path, next) => setValue((previous) => {
    const keys = Array.isArray(path) ? path : [path];
    const copy = structuredClone(previous);
    let current = copy;
    for (const key of keys.slice(0, -1)) current = current[key];
    current[keys.at(-1)] = next;
    return copy;
  });
  const remove = (section, index) => update(section, value[section].filter((_, itemIndex) => itemIndex !== index));
  const add = (section) => {
    const definition = resumeSections.find((item) => item.key === section);
    update(section, [...value[section], structuredClone(definition.empty)]);
  };

  async function save() {
    setSaving(true);
    setError("");
    try {
      await onSave(normalizeResume(value));
    } catch (saveError) {
      setError(saveError.message || "Your changes could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex min-w-0 flex-col bg-slate-100" role="dialog" aria-modal="true" aria-label={`Edit ${portfolio ? "web portfolio" : "resume"}`}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div>
          <h2 className="font-extrabold text-ink">Edit {portfolio ? "Web Portfolio" : "Resume"}</h2>
          <p className="text-xs text-slate-500">Select any field in the template to edit it.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
            <X size={16} /> Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={save}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
        {error && <p role="alert" className="mx-auto mb-4 max-w-5xl rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <article className={`mx-auto min-h-full w-full max-w-5xl bg-white shadow-xl ${portfolio ? "overflow-hidden rounded-lg" : "p-5 sm:p-10"}`}>
          <div className={`${portfolio ? "bg-blue-50 p-6 sm:p-10" : "border-b border-slate-200 pb-6 text-center"} ${imageUrl ? "grid items-center gap-6 md:grid-cols-[1fr_auto]" : ""}`}>
            <div>
              {portfolio && <p className="mb-2 text-sm text-slate-500">Hello, I'm</p>}
              <Editable label="Full name" value={value.fullName} placeholder="Full name" onChange={(next) => update("fullName", next)} className={portfolio ? "text-2xl font-black text-ink sm:text-4xl" : "text-center text-2xl font-extrabold uppercase text-forge sm:text-3xl"} />
              <Editable label="Target role" value={value.targetRole} placeholder="Target role" suggestions={roleSuggestions} onChange={(next) => update("targetRole", next)} className={`font-bold ${portfolio ? "text-forge" : "text-center text-ink"}`} />
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {["location", "phone", "email"].map((field) => (
                  <Editable key={field} label={field} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} value={value.contact[field]} placeholder={field} onChange={(next) => update(["contact", field], next)} className="text-sm text-slate-600" />
                ))}
              </div>
            </div>
            {imageUrl && <ProfileAvatar src={imageUrl} fallback={false} alt={`${value.fullName || "Candidate"} profile photo`} className={portfolio ? "h-36 w-36 rounded-full object-cover shadow-soft" : "h-24 w-24 rounded-md border border-slate-200 object-cover"} />}
          </div>

          <div className={portfolio ? "space-y-6 p-6 sm:p-10" : "space-y-6 pt-6"}>
            <EditorSection title={portfolio ? "About Me" : "Professional Summary"}>
              <Editable label={portfolio ? "About me" : "Professional summary"} multiline value={value.professionalSummary} placeholder="Write a professional summary" onChange={(next) => update("professionalSummary", next)} />
            </EditorSection>

            {resumeSections.map((section) => (
              <EditorSection key={section.key} title={portfolio && section.key === "projects" ? "Featured Projects" : section.title}>
                <div className={portfolio && ["technicalSkills", "projects", "certifications"].includes(section.key) ? "grid gap-3 md:grid-cols-2" : "space-y-3"}>
                  {value[section.key].map((row, index) => (
                    <div key={index} className="group relative rounded-lg border border-slate-200 p-4 hover:border-blue-300">
                      <button type="button" className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" title={`Remove ${section.singular}`} onClick={() => remove(section.key, index)}>
                        <Trash2 size={15} />
                      </button>
                      <div className="grid gap-2 pr-7 sm:grid-cols-2">
                        {fieldMap[section.key].map(({ field, label, multiline, options, suggestions, type }) => (
                          <Editable key={field} label={label} multiline={multiline} options={options} suggestions={suggestions} type={type} value={row[field] || ""} placeholder={label} onChange={(next) => update([section.key, index, field], next)} className={multiline ? "sm:col-span-2" : ""} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" className="mt-3" onClick={() => add(section.key)}>
                  <Plus size={15} /> Add {section.singular}
                </Button>
              </EditorSection>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}

function Editable({ value, onChange, label, placeholder, multiline = false, options, suggestions, type = "text", className = "" }) {
  const listId = useId();
  const common = `w-full rounded-md border border-blue-200 bg-blue-50/40 px-3 py-2 outline-none transition hover:border-blue-400 hover:bg-blue-50 focus:border-forge focus:bg-white focus:ring-2 focus:ring-blue-100 ${className}`;
  const knownOption = options?.includes(value);

  return (
    <label className={className.includes("sm:col-span-2") ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 flex items-center gap-1 text-xs font-bold capitalize text-slate-500">
        <Pencil size={11} aria-hidden="true" /> {label || placeholder}
      </span>
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} className={`${common} resize-y`} onChange={(event) => onChange(event.target.value)} />
      ) : options ? (
        <select value={value} className={common} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select {label || placeholder}</option>
          {value && !knownOption && <option value={value}>{value}</option>}
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <>
          <input type={type} list={suggestions ? listId : undefined} value={value} placeholder={placeholder} className={common} onChange={(event) => onChange(event.target.value)} />
          {suggestions && <datalist id={listId}>{suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>}
        </>
      )}
    </label>
  );
}

function EditorSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 border-b border-slate-200 pb-2 text-sm font-extrabold uppercase text-ink">{title}</h3>
      {children}
    </section>
  );
}
