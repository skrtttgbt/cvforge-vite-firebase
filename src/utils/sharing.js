import { safeUrl, sharedDraft } from './grounding.js';
import { isConnectedProfileSource } from './sourceValidation.js';

export const isSecureId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const resumeFields = ['fullName','targetRole','professionalSummary','technicalSkills','workExperience','projects','certifications','education','imgUrl','contact'];
export function filteredDraft(draft, config = {}) {
  if (draft?.status !== 'approved' || !draft.resume || typeof draft.resume !== 'object') throw new Error('Approve this output before sharing.');
  const source = draft.resume;
  const resume = {
    fullName: source.fullName || '', targetRole: source.targetRole || '', professionalSummary: source.professionalSummary || '',
    technicalSkills: source.technicalSkills || [], workExperience: source.workExperience || [], projects: source.projects || [], certifications: source.certifications || [], education: source.education || [],
    imgUrl: source.imgUrl || '', contact: source.contact || {},
  };
  return sharedDraft({ status:'approved', title:'Approved shared draft', resume }, config);
}
export function sharedLinks(sources, config = {}) {
  const sourceSectionSelected = !Array.isArray(config.includeSections) || config.includeSections.includes('Profile Sources') || config.includeSections.includes('Contact Links');
  if (config.showLinks !== true || !sourceSectionSelected) return [];
  return (Array.isArray(sources) ? sources : []).filter(isConnectedProfileSource).slice(0,100).flatMap(source => {
    const url = safeUrl(source.url);
    return url ? [{ name:String(source.name || 'Professional link').slice(0,100), url }] : [];
  });
}
export function validateTokenState(token, now = Date.now()) {
  const expiry = token?.expiresAt?.toMillis?.();
  return token?.schemaVersion === 2 && isSecureId(token.token) && token.sharedResourceId === token.token && token.active === true && token.status === 'Active'
    && Number.isFinite(expiry) && expiry > now && Number.isInteger(token.viewCount) && token.viewCount >= 0
    && Number.isInteger(token.maxViews) && token.maxViews >= 0 && (token.maxViews === 0 || token.viewCount < token.maxViews);
}
