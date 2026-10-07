import { buildGroundedProfileContext } from './grounding.js';
import { normalizeResume } from './resumeContent.js';
import { summaryReference, isGroundedSummaryWording, profileSummarySuggestion } from './summaryWording.js';
const clone = value => structuredClone(value);
export const skillName = value => String(typeof value === 'string' ? value : value?.skillName || value?.name || '').trim().replace(/\s+/g,' ');
const key = value => skillName(value).toLowerCase();
const text = value => typeof value === 'string' ? value.trim() : '';
export const skillCategories = ['Programming','Web Development','Mobile Development','Database','UI/UX Design','Data Analytics','Artificial Intelligence / Machine Learning','Cybersecurity','Hardware / Networking','Soft Skill','Other'];
const roleCategory = {
  'Frontend Developer':'Web Development','Backend Developer':'Web Development','Full Stack Developer':'Web Development',
  'Data Analyst':'Data Analytics','Mobile Developer':'Mobile Development','UI/UX Designer':'UI/UX Design','Cybersecurity Specialist':'Cybersecurity',
};
const roleSkills = {
  'Frontend Developer':['React','Git','Responsive Web Design'],
  'Backend Developer':['REST APIs','SQL','Git'],
  'Full Stack Developer':['React','REST APIs','Git'],
  'Data Analyst':['SQL','Excel','Data Visualization'],
  'Mobile Developer':['Mobile App Testing','Git'],
  'UI/UX Designer':['Figma','User Research','Accessibility'],
  'Cybersecurity Specialist':['Network Security','Incident Response'],
};
export function buildResumeSuggestions(profile, response = {}, source = 'ai-suggestion') {
  response=response && typeof response==='object' && !Array.isArray(response)?response:{};
  const facts=buildGroundedProfileContext(profile);
  const existing=new Set((profile.skills || []).map(key));
  const suggestions=[];
  const names=Array.isArray(response.skills) ? response.skills : roleSkills[profile.targetRole] || [];
  for(const item of names.slice(0,10)) {
    const name=skillName(item);
    if(!name || name.length>100 || existing.has(key(name))) continue;
    existing.add(key(name));
    const suppliedCategory=text(item?.category);
    const category=skillCategories.find(category=>category.toLowerCase()===suppliedCategory.toLowerCase()) || roleCategory[profile.targetRole] || 'Other';
    suggestions.push({id:`skill-${suggestions.length}`,type:'skill',value:name,category,status:'pending',addToProfile:false,source});
  }
  const suggestedSummary=text(response.summary);
  const reference=summaryReference(profile);
  const template=profileSummarySuggestion(profile);
  const accepted=suggestedSummary!==text(facts.summary) && (isGroundedSummaryWording(suggestedSummary,reference) || isGroundedSummaryWording(suggestedSummary,template));
  const summary=accepted?suggestedSummary:template;
  if(summary) suggestions.push({id:'professional-summary',type:'summary',value:summary,originalSummary:text(facts.summary),status:'pending',addToProfile:false,source:accepted?source:'wording-template'});
  for(const [type,collection,responseKey] of [['project','projects','projects'],['experience','experience','experience']]) {
    (profile[collection] || []).forEach((original,index)=>{
      if(!original || typeof original!=='object' || !text(original.description)) return;
      const proposed=(Array.isArray(response[responseKey])?response[responseKey]:[]).find(row=>row.index===index);
      // Existing grounding policy is conservative: unknown rewrites never become claims.
      const proposedText=text(proposed?.description);
      const value=proposedText===text(original.description) ? proposedText : text(original.description);
      suggestions.push({id:`${type}-${index}`,type,value,index,original:clone(original),status:'pending',addToProfile:false,source:proposedText===value?source:'profile'});
    });
  }
  return suggestions;
}
export const profileSelections = suggestions => suggestions.filter(s=>s.status==='approved' && s.addToProfile===true);
function apply(profile,suggestions,baseline,onlySelected) {
  const result=clone(profile);
  const accepted=suggestions.filter(s=>s.status==='approved' && (!onlySelected || s.addToProfile===true));
  const known=new Set((result.skills || []).map(key));
  for(const suggestion of accepted) {
    const value=text(suggestion.value);
    if(!value || value.length>20000) throw new Error('Approved suggestions must contain valid text.');
    if(suggestion.type==='skill') {
      const name=skillName(value);
      if(name.length>100) throw new Error('Skill names must be 100 characters or fewer.');
      if(!known.has(key(name))) {
        const category=text(suggestion.category),proficiencyLevel=text(suggestion.proficiencyLevel);
        if(onlySelected && (!category || category.length>100 || !['Beginner','Intermediate','Advanced','Expert'].includes(proficiencyLevel))) throw new Error('Choose your skill category and proficiency before saving to your profile.');
        result.skills=[...(result.skills || []),{skillName:name,category,proficiencyLevel}];known.add(key(name));
        if(result.skills.length>100) throw new Error('Your profile supports at most 100 skills.');
      }
    } else if(suggestion.type==='summary') {
      if(onlySelected && profile.summary!==baseline.summary) throw new Error('Your profile summary changed. Review the latest profile before saving.');
      result.summary=value;
    } else if(['project','experience'].includes(suggestion.type)) {
      const collection=suggestion.type==='project'?'projects':'experience';
      const index=suggestion.index;
      if(!Number.isInteger(index) || index<0 || JSON.stringify(profile[collection]?.[index])!==JSON.stringify(suggestion.original)) throw new Error('The corresponding profile entry changed. Review the latest profile before saving.');
      result[collection]=clone(result[collection]);result[collection][index]={...result[collection][index],description:value};
    }
  }
  return result;
}
export function profileSuggestionPatch(current,suggestions,baseline=current) {
  const selections=profileSelections(suggestions);
  const updated=apply(current,selections,baseline,true);
  const patch={};
  for(const field of ['skills','summary','projects','experience']) if(JSON.stringify(updated[field])!==JSON.stringify(current[field])) patch[field]=updated[field];
  return patch;
}
export function resumeSuggestionProfile(profile,suggestions) {
  const updated=apply(profile,suggestions,profile,false);
  if(suggestions.some(s=>s.type==='summary' && s.status==='declined') && !suggestions.some(s=>s.type==='summary' && s.status==='approved')) updated.summary='';
  return updated;
}
// Guarantee explicit approvals survive provider omissions; never revive declined suggestions.
export function includeApprovedSuggestions(resume,profile,suggestions) {
  const result=normalizeResume(resume,profile,{fillEmpty:true});
  for(const suggestion of suggestions.filter(s=>s.status==='approved')) {
    if(suggestion.type==='skill' && !result.technicalSkills.some(s=>key(s)===key(suggestion.value))) result.technicalSkills.push({name:skillName(suggestion.value),category:text(suggestion.category),level:text(suggestion.proficiencyLevel)});
    if(suggestion.type==='summary') result.professionalSummary=text(suggestion.value);
    if(['project','experience'].includes(suggestion.type)) {
      const collection=suggestion.type==='project'?'projects':'workExperience';
      const sourceRow=profile[suggestion.type==='project'?'projects':'experience']?.[suggestion.index];
      const row=sourceRow ? normalizeResume({[collection]:[sourceRow]})[collection][0] : null;
      if(!row) continue;
      const index=result[collection].findIndex(item=>suggestion.type==='project' ? item.projectTitle===row.projectTitle : item.companyName===row.companyName && item.jobTitle===row.jobTitle && item.startDate===row.startDate);
      if(index<0) result[collection].push(row);else result[collection][index]={...result[collection][index],description:row.description};
    }
  }
  return result;
}
