export default function ResumePreview({ profile = {}, draft = null }) {
  if (!draft) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        <p className="font-bold text-ink">No AI-generated resume yet.</p>
        <p className="mt-1 text-sm">
          Click "Generate Resume" to create your draft.
        </p>
      </div>
    );
  }

  const resume = mergeResumeWithProfile(
    buildResumeFromProfile(profile, draft),
    draft.resume || {},
  );
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700">
      <header className="border-b border-slate-200 pb-4 text-center">
        <h1 className="text-3xl font-extrabold uppercase tracking-wide text-forge">
          {resume.fullName || "Your Name"}
        </h1>

        {resume.targetRole && (
          <p className="mt-1 font-bold text-ink">{resume.targetRole}</p>
        )}

        <p className="mt-2 text-xs text-slate-500">
          {[
            resume.contact?.location,
            resume.contact?.phone,
            resume.contact?.email,
          ]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      {resume.professionalSummary && (
        <Section title="Professional Summary">
          <p>{resume.professionalSummary}</p>
        </Section>
      )}

      {resume.technicalSkills?.length > 0 && (
        <Section title="Technical Skills">
          <div className="space-y-1">
            {groupTechnicalSkills(resume.technicalSkills).map(
              (group, index) => (
                <p key={index}>
                  <span className="font-bold text-ink">{group.category}:</span>{" "}
                  {group.items
                    .map((item) =>
                      item.level ? `${item.name} (${item.level})` : item.name,
                    )
                    .join(", ")}
                </p>
              ),
            )}
          </div>
        </Section>
      )}
      {resume.workExperience?.length > 0 && (
        <Section title="Work Experience">
          <div className="space-y-4">
            {resume.workExperience.map((item, index) => (
              <div key={index}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-ink">{item.jobTitle}</h3>
                    <p>
                      {item.companyName}
                      {item.location && ` — ${item.location}`}
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    {formatDateRange(item.startDate, item.endDate)}
                  </p>
                </div>

                {item.employmentType && (
                  <p className="text-xs text-slate-500">
                    {item.employmentType}
                  </p>
                )}

                {item.description && <p className="mt-1">{item.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.projects?.length > 0 && (
        <Section title="Projects">
          <div className="space-y-4">
            {resume.projects.map((project, index) => (
              <div key={index}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-ink">
                      {project.projectTitle}
                    </h3>

                    <p>
                      {project.projectType}
                      {project.role && ` — ${project.role}`}
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-slate-500">
                    {formatDateRange(project.startDate, project.endDate)}
                  </p>
                </div>

                {project.technologiesUsed && (
                  <p className="text-xs text-slate-500">
                    Technologies Used: {project.technologiesUsed}
                  </p>
                )}

                {(project.projectLink || project.repositoryLink) && (
                  <p className="text-xs text-slate-500">
                    {project.projectLink &&
                      `Project Link: ${project.projectLink}`}
                    {project.projectLink && project.repositoryLink && " | "}
                    {project.repositoryLink &&
                      `Repository Link: ${project.repositoryLink}`}
                  </p>
                )}

                {project.description && (
                  <p className="mt-1">{project.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.certifications?.length > 0 && (
        <Section title="Certifications">
          <div className="space-y-2">
            {resume.certifications.map((cert, index) => (
              <div key={index}>
                <p>
                  <span className="font-bold text-ink">{cert.name}</span>
                  {cert.organization && ` — ${cert.organization}`}
                  {cert.issueDate && ` (${cert.issueDate})`}
                </p>

                {(cert.credentialId || cert.credentialLink) && (
                  <p className="text-xs text-slate-500">
                    {cert.credentialId && `Credential ID: ${cert.credentialId}`}
                    {cert.credentialId && cert.credentialLink && " | "}
                    {cert.credentialLink &&
                      `Credential Link: ${cert.credentialLink}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {resume.education?.length > 0 && (
        <Section title="Education">
          <div className="space-y-2">
            {resume.education.map((item, index) => (
              <div key={index}>
                <p>
                  <span className="font-bold text-ink">{item.degree}</span>
                  {item.school && ` — ${item.school}`}
                </p>

                {item.year && (
                  <p className="text-xs text-slate-500">{item.year}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-xs font-extrabold uppercase tracking-wide text-ink">
        {title}
      </h2>

      {children}
    </section>
  );
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";
  if (startDate && !endDate) return startDate;
  return `${startDate} - ${endDate}`;
}

function buildResumeFromProfile(profile = {}, draft = {}) {
  return {
    fullName: profile.fullName || "Your Name",
    targetRole: profile.targetRole || "",
    contact: {
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
    },
    professionalSummary: draft.content || profile.summary || "",
    technicalSkills: profile.skills || [],
    workExperience: profile.experience || [],
    projects: profile.projects || [],
    certifications: profile.certifications || [],
    education: flattenEducation(profile.education || {}),
  };
}

function mergeResumeWithProfile(profileResume, generatedResume) {
  return {
    ...profileResume,
    ...compactObject(generatedResume),
    contact: {
      ...profileResume.contact,
      ...compactObject(generatedResume.contact || {}),
    },
    professionalSummary:
      generatedResume.professionalSummary ||
      profileResume.professionalSummary,
    technicalSkills: mergeList(
      profileResume.technicalSkills,
      generatedResume.technicalSkills,
    ),
    workExperience: mergeList(
      profileResume.workExperience,
      generatedResume.workExperience,
    ),
    projects: mergeList(profileResume.projects, generatedResume.projects),
    certifications: mergeList(
      profileResume.certifications,
      generatedResume.certifications,
    ),
    education: mergeList(profileResume.education, generatedResume.education),
  };
}

function mergeList(profileList = [], generatedList = []) {
  if (!Array.isArray(generatedList) || generatedList.length === 0) {
    return profileList;
  }

  const maxLength = Math.max(profileList.length, generatedList.length);

  return Array.from({ length: maxLength }, (_, index) =>
    mergeItem(profileList[index], generatedList[index]),
  ).filter(Boolean);
}

function mergeItem(profileItem, generatedItem) {
  if (!generatedItem) return profileItem;
  if (!profileItem || typeof generatedItem !== "object") return generatedItem;

  return {
    ...profileItem,
    ...compactObject(generatedItem),
  };
}

function compactObject(value) {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) =>
      Array.isArray(item) ? item.length > 0 : item !== undefined && item !== null && item !== "",
    ),
  );
}

function groupSkills(skills) {
  const groups = {};

  skills.forEach((skill) => {
    const category = skill.category || "Skills";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push({
      name: skill.skillName || "",
      level: skill.proficiencyLevel || "",
    });
  });

  return Object.entries(groups).map(([category, items]) => ({
    category,
    items,
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
