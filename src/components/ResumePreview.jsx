import { safeUrl } from "../utils/grounding";
import { normalizeResume } from "../utils/resumeContent";
import ProfileAvatar from "./ProfileAvatar";

export default function ResumePreview({ profile = {}, draft = null }) {
  if (!draft) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        <p className="font-bold text-ink">No AI-generated resume yet.</p>
        <p className="mt-1 text-sm">Click "Generate Resume" to create your draft.</p>
      </div>
    );
  }

  const resume = normalizeResume(draft.resume, profile);
  const imageUrl = safeUrl(resume.imgUrl);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
      <header className={`border-b border-slate-300 pb-5 ${imageUrl ? "flex items-center gap-5 text-left" : "text-center"}`}>
        {imageUrl && (
          <ProfileAvatar
            src={imageUrl}
            fallback={false}
            alt={`${resume.fullName || "Candidate"} resume photo`}
            className="h-24 w-24 shrink-0 rounded-md border border-slate-200 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-extrabold uppercase text-forge sm:text-3xl">
            {resume.fullName || "Your Name"}
          </h1>
          {resume.targetRole && <p className="mt-1 font-bold text-ink">{resume.targetRole}</p>}
          <p className="mt-2 break-words text-xs text-slate-500">
            {[resume.contact?.location, resume.contact?.phone, resume.contact?.email]
              .filter(Boolean)
              .join(" | ")}
          </p>
        </div>
      </header>

      {resume.professionalSummary && (
        <Section title="Professional Summary">
          <p className="border-l-2 border-forge pl-4 leading-6">{resume.professionalSummary}</p>
        </Section>
      )}

      {resume.technicalSkills.length > 0 && (
        <Section title="Technical Skills">
          <div className="divide-y divide-slate-100">
            {groupTechnicalSkills(resume.technicalSkills).map((group) => (
              <div key={group.category} className="grid gap-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]">
                <p className="font-bold text-ink">{group.category}</p>
                <p>{group.items.map((item) => item.level ? `${item.name} (${item.level})` : item.name).join(" | ")}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.workExperience.length > 0 && (
        <Section title="Work Experience">
          <div className="divide-y divide-slate-200">
            {resume.workExperience.map((item, index) => (
              <article key={index} className="break-inside-avoid py-3 first:pt-0 last:pb-0">
                <EntryHeader
                  title={item.jobTitle || "Position"}
                  subtitle={[item.companyName, item.location].filter(Boolean).join(" | ")}
                  date={formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                />
                {item.employmentType && <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{item.employmentType}</p>}
                {item.description && <p className="mt-2 whitespace-pre-line leading-6">{item.description}</p>}
              </article>
            ))}
          </div>
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title="Projects">
          <div className="divide-y divide-slate-200">
            {resume.projects.map((project, index) => (
              <article key={index} className="break-inside-avoid py-3 first:pt-0 last:pb-0">
                <EntryHeader
                  title={project.projectTitle || "Project"}
                  subtitle={[project.projectType, project.role].filter(Boolean).join(" | ")}
                  date={formatDateRange(project.startDate, project.endDate, project.isOngoing)}
                />
                {project.technologiesUsed && (
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-bold text-ink">Technologies:</span>{" "}{project.technologiesUsed}
                  </p>
                )}
                {(project.projectLink || project.repositoryLink) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-forge">
                    <ResumeLink href={project.projectLink} label="View project" />
                    <ResumeLink href={project.repositoryLink} label="Source repository" />
                  </div>
                )}
                {project.description && <p className="mt-2 whitespace-pre-line leading-6">{project.description}</p>}
              </article>
            ))}
          </div>
        </Section>
      )}

      {resume.certifications.length > 0 && (
        <Section title="Certifications">
          <div className="divide-y divide-slate-200">
            {resume.certifications.map((cert, index) => (
              <article key={index} className="flex break-inside-avoid flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-ink">{cert.name || "Certification"}</h3>
                  {cert.organization && <p>{cert.organization}</p>}
                  {(cert.credentialId || cert.credentialLink) && (
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {cert.credentialId && <span>Credential ID: {cert.credentialId}</span>}
                      <ResumeLink href={cert.credentialLink} label="Verify credential" />
                    </div>
                  )}
                </div>
                {cert.issueDate && <DateLabel value={formatResumeDate(cert.issueDate)} />}
              </article>
            ))}
          </div>
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="Education">
          <div className="divide-y divide-slate-200">
            {resume.education.map((item, index) => (
              <article key={index} className="flex break-inside-avoid flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-ink">{item.degree || "Education"}</h3>
                  {item.school && <p>{item.school}</p>}
                </div>
                {item.year && <DateLabel value={item.year} />}
              </article>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 flex items-center gap-3 text-xs font-extrabold uppercase text-forge">
        {title}
        <span className="h-px flex-1 bg-slate-300" aria-hidden="true" />
      </h2>
      {children}
    </section>
  );
}

function EntryHeader({ title, subtitle, date }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        {subtitle && <p className="font-medium text-forge">{subtitle}</p>}
      </div>
      {date && <DateLabel value={date} />}
    </div>
  );
}

function DateLabel({ value }) {
  return <p className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{value}</p>;
}

function ResumeLink({ href, label }) {
  const url = safeUrl(href);
  if (!url) return null;
  return <a href={url} target="_blank" rel="noreferrer" className="break-all hover:underline">{label}</a>;
}

function formatDateRange(startDate, endDate, current = false) {
  const start = formatResumeDate(startDate);
  const end = formatResumeDate(endDate);
  if (current) return start ? `${start} - Present` : "Present";
  if (!start && !end) return "";
  if (start && !end) return start;
  return `${start} - ${end}`;
}

function formatResumeDate(value) {
  const text = String(value || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  if (!match) return text;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function groupTechnicalSkills(skills = []) {
  const grouped = {};
  skills.forEach((skill) => {
    const category = skill.category || "Skills";
    if (!grouped[category]) grouped[category] = [];
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
