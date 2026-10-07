import { factualResume } from './grounding.js';
import { profileSummarySuggestion, isGroundedSummaryWording, conciseSummary } from './summaryWording.js';
import { normalizeResume } from './resumeContent.js';
export function buildPortfolioSuggestions(profile, data = {}, source = 'ai') {
  const template = profileSummarySuggestion(profile);
  const suggestions = [];
  const add = (id, section, title, original, proposed, reference, index) => {
    const valid = proposed !== original && isGroundedSummaryWording(proposed, reference);
    const value = valid ? proposed : reference;
    if (value) suggestions.push({ id, section, title, original, value, index, status:'pending', source:valid ? source : 'profile-based' });
  };
  add('about','About Me','About Me introduction',profile.summary || '',data.summary,template);
  for (const [field, section] of [['projects','Featured Projects'],['experience','Work Experience']]) {
    (profile[field] || []).forEach((row,index) => {
      if (!row.description?.trim()) return;
      const proposed = (Array.isArray(data[field]) ? data[field] : []).find(item=>item.index===index)?.description;
      add(`${field}-${index}`,section,row.projectTitle || row.jobTitle || 'Description',row.description,proposed,conciseSummary(row.description),index);
    });
  }
  return suggestions;
}
export function applyPortfolioSuggestions(profile, suggestions) {
  const resume=normalizeResume(factualResume(profile));
  for (const item of suggestions.filter(item=>item.status==='approved')) {
    if (!item.value?.trim()) throw new Error('Approved wording cannot be empty.');
    if (item.id==='about') resume.professionalSummary=item.value.trim();
    else {
      const rows=item.id.startsWith('projects-') ? resume.projects : resume.workExperience;
      if (!rows[item.index]) throw new Error('The corresponding profile entry is unavailable.');
      rows[item.index]={...rows[item.index],description:item.value.trim()};
    }
  }
  return resume;
}
