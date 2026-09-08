const text = (value) => typeof value === "string" && value.trim().length > 0;
const list = (value) => (Array.isArray(value) ? value : []);

export function normalizePhilippineMobile(value) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[\s()-]/g, "");
  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`;
  if (/^\+639\d{9}$/.test(compact)) return compact;
  return "";
}

export const mobileError =
  "Enter a Philippine mobile number: 09123456789 or +639123456789.";

const educationFields = {
  primary: ["schoolName", "yearGraduated"],
  secondary: ["schoolName", "yearGraduated"],
  college: ["schoolName", "degreeProgram", "yearGraduated"],
  vocational: ["institution", "course", "completionYear"],
  masters: ["university", "degree", "yearGraduated"],
  doctoral: ["university", "degree", "yearGraduated"],
};
const sections = {
  experience: ["Experience", ["companyName", "jobTitle", "startDate"]],
  skills: ["Skills", ["skillName", "category", "proficiencyLevel"]],
  projects: ["Projects", ["projectTitle", "role", "startDate"]],
  certifications: ["Certifications", ["name", "organization", "issueDate"]],
};

export function validateProfile(profile = {}) {
  const errors = [];
  const add = (tab, message) => errors.push({ tab, message });
  if (!text(profile.fullName))
    add("Personal Information", "Full name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email || ""))
    add("Personal Information", "A valid email address is required.");
  if (!normalizePhilippineMobile(profile.phone))
    add("Personal Information", mobileError);
  if (!text(profile.location))
    add("Personal Information", "Location is required.");

  for (const [key, fields] of Object.entries(educationFields)) {
    const value = profile.education?.[key];
    const rows = ["primary", "secondary"].includes(key)
      ? value && Object.values(value).some(text)
        ? [value]
        : []
      : list(value);
    rows.forEach((row, index) => {
      const label = `${key} education #${index + 1}`;
      if (!fields.every((field) => text(row?.[field])))
        add("Education", `Complete all fields in ${label}.`);
      const year = row?.yearGraduated || row?.completionYear;
      if (
        year &&
        (!/^\d{4}$/.test(year) ||
          +year < 1900 ||
          +year > new Date().getFullYear() + 10)
      )
        add("Education", `Enter a valid four-digit year in ${label}.`);
    });
  }
  for (const [key, [tab, required]] of Object.entries(sections)) {
    list(profile[key]).forEach((row, index) => {
      const label = `${tab} #${index + 1}`;
      if (!required.every((field) => text(row?.[field])))
        add(tab, `Complete ${required.join(", ")} in ${label}.`);
      if (key === "experience" || key === "projects") {
        if (!(row?.isCurrent || row?.isOngoing) && !text(row?.endDate))
          add(tab, `Enter an end date or mark ${label} as current / ongoing.`);
        if (row?.startDate && row?.endDate && row.endDate < row.startDate)
          add(tab, `End date must be on or after start date in ${label}.`);
      }
      for (const field of ["startDate", "endDate", "issueDate"]) {
        if (row?.[field] && !/^\d{4}-(0[1-9]|1[0-2])$/.test(row[field]))
          add(tab, `Enter a valid month and year for ${field} in ${label}.`);
      }
      for (const field of ["projectLink", "repositoryLink", "credentialLink"]) {
        if (!text(row?.[field])) continue;
        try {
          const url = new URL(row[field]);
          if (!["https:", "http:"].includes(url.protocol)) throw new Error();
        } catch {
          add(
            tab,
            `Enter a full http:// or https:// URL for ${field} in ${label}.`,
          );
        }
      }
    });
  }
  return errors;
}

export function getIncompleteSections(profile = {}) {
  profile = profile || {};
  const invalid = new Set(validateProfile(profile).map(({ tab }) => tab));
  const education = Object.entries(educationFields).some(([key, fields]) => {
    const value = profile.education?.[key];
    const rows = ["primary", "secondary"].includes(key) ? [value] : list(value);
    return rows.some((row) => fields.every((field) => text(row?.[field])));
  });
  if (!education) invalid.add("Education");
  for (const [key, [tab]] of Object.entries(sections)) {
    if (!list(profile[key]).length) invalid.add(tab);
  }
  return [
    "Personal Information",
    "Education",
    "Experience",
    "Skills",
    "Projects",
    "Certifications",
  ].filter((tab) => invalid.has(tab));
}

export const isProfileComplete = (profile) =>
  getIncompleteSections(profile).length === 0;
