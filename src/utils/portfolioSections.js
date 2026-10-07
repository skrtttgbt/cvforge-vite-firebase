import { normalizeResume } from './resumeContent.js';
import { safeUrl } from './grounding.js';
export function portfolioAvailability(profile = {}, resumeDraft = null, sources = []) {
  const r = normalizeResume(undefined, profile || {});
  const named = (rows, keys) => rows.some(row => keys.some(key => typeof row[key] === 'string' && row[key].trim()));
  return {
    'About Me': Boolean(r.professionalSummary.trim()),
    'Technical Skills': r.technicalSkills.length > 0,
    'Education': r.education.length > 0,
    'Featured Projects': named(r.projects, ['projectTitle', 'name', 'description']),
    'Certifications': named(r.certifications, ['name', 'certificationName']),
    'Work Experience': named(r.workExperience, ['jobTitle', 'companyName', 'description']),
    'Resume Download': resumeDraft?.status === 'approved',
    'Contact Links': Boolean(r.contact.email || r.contact.phone || r.contact.location || sources.some(source => safeUrl(source.url))),
  };
}

export function portfolioContactAvailability(profile = {}, sources = []) {
  const { contact } = normalizeResume(undefined, profile || {});
  return {
    showEmail: Boolean(contact.email.trim()),
    showPhone: Boolean(contact.phone.trim()),
    showAddress: Boolean(contact.location.trim()),
    showLinks: sources.some(source => Boolean(safeUrl(source?.url))),
  };
}
