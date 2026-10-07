import { factualResume } from './grounding.js';

const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const rows = value => Array.isArray(value) ? value : [];
export function educationRows(value) {
  const entries = Array.isArray(value) ? value : Object.values(value || {}).flatMap(row => Array.isArray(row) ? row : [row]);
  return entries.filter(row => row && (typeof row === 'object' || typeof row === 'string')).map(row => typeof row === 'string' ? {degree:row,school:'',year:''} : ({
    degree:text(row.degree || row.degreeProgram || row.course),
    school:text(row.school || row.schoolName || row.university || row.institution),
    year:text(row.year || row.yearGraduated || row.completionYear),
  })).filter(row => row.degree || row.school || row.year);
}
export function normalizeResume(input, profile = {}, { fillEmpty = false } = {}) {
  const source = factualResume(profile);
  const r = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const select = (key, alias) => {
    const value = r[key] ?? (alias ? r[alias] : undefined);
    return value === undefined || (fillEmpty && Array.isArray(value) && !value.length) ? source[key] : value;
  };
  return {
    fullName:text(r.fullName ?? source.fullName), targetRole:text(r.targetRole ?? source.targetRole),
    professionalSummary:text(r.professionalSummary ?? source.professionalSummary),
    imgUrl:text(r.imgUrl ?? source.imgUrl),
    contact:{email:text(r.contact?.email ?? source.contact.email),phone:text(r.contact?.phone ?? source.contact.phone),location:text(r.contact?.location ?? source.contact.location)},
    technicalSkills:rows(select('technicalSkills','skills')).map(skill => typeof skill === 'string' ? {name:skill,category:'',level:''} : {
      name:text(skill?.name || skill?.skillName),category:text(skill?.category),level:text(skill?.level || skill?.proficiencyLevel),
    }).filter(skill => skill.name.trim()),
    education:educationRows(select('education')),
    workExperience:rows(select('workExperience','experience')).filter(row=>row && typeof row === 'object'),
    projects:rows(select('projects')).filter(row=>row && typeof row === 'object'),
    certifications:rows(select('certifications')).filter(row=>row && typeof row === 'object'),
  };
}
export const resumeSections = [
  {key:'technicalSkills',title:'Technical Skills',singular:'skill',empty:{name:'',category:'',level:''},describe:row=>row.name},
  {key:'education',title:'Education',singular:'education entry',empty:{degree:'',school:'',year:''},describe:row=>[row.degree,row.school,row.year].filter(Boolean).join(' — ')},
  {key:'workExperience',title:'Work Experience',singular:'experience',empty:{jobTitle:'',companyName:'',location:'',startDate:'',endDate:'',employmentType:'',description:''},describe:row=>[row.jobTitle,row.companyName].filter(Boolean).join(' — ')},
  {key:'projects',title:'Projects',singular:'project',empty:{projectTitle:'',role:'',technologiesUsed:'',projectLink:'',repositoryLink:'',description:''},describe:row=>row.projectTitle || row.name},
  {key:'certifications',title:'Certifications',singular:'certification',empty:{name:'',organization:'',issueDate:'',credentialId:'',credentialLink:''},describe:row=>row.name || row.certificationName},
];
export function reviewCandidates(resume, profile) {
  const current=normalizeResume(resume), source=normalizeResume(factualResume(profile));
  return Object.fromEntries(resumeSections.map(section=>{
    const seen=new Set();
    const values=[];
    for (const [list, included] of [[current[section.key],true],[source[section.key],false]]) {
      for (const item of list) {
        const key=section.key==='technicalSkills' ? item.name.trim().toLowerCase() : JSON.stringify(item);
        if(!seen.has(key)){ seen.add(key);values.push({item,included}); }
      }
    }
    return [section.key,values];
  }));
}
