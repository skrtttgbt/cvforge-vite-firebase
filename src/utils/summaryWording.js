import { buildGroundedProfileContext } from './grounding.js';

// Compare the ordered substantive words, allowing a small set of faithful
// wording changes. Dates, technologies, negations and qualifiers stay checked.
const grammar=new Set('i my we our a an the and of for to in on at is are am was were have has can with by using use uses include includes including'.split(' '));
const equivalents={builds:'build',building:'build',built:'build',create:'build',creates:'build',created:'build',creating:'build',develop:'build',develops:'build',developed:'build',developing:'build',reports:'report',pages:'page',applications:'application',apps:'application',app:'application',websites:'website',test:'test',tests:'test',tested:'test',testing:'test',know:'knowledge',knows:'knowledge',skills:'skill',analyses:'analysis',analyzes:'analyze',analysed:'analyze',analyzed:'analyze'};
function words(value){return String(value || '').toLowerCase().match(/[\p{L}\p{N}+#.-]+/gu)?.map(word=>word.replace(/\.+$/,'')).filter(word=>word && !grammar.has(word)).map(word=>equivalents[word] || word) || [];}
export function summaryReference(profile){
  const facts=buildGroundedProfileContext(profile);
  if(facts.summary) return facts.summary;
  const skills=(facts.skills || []).map(skill=>typeof skill==='string'?skill:skill.skillName || skill.name).filter(Boolean);
  return [facts.targetRole?`Targeting a ${facts.targetRole} role.`:'',skills.length?`Skills include ${skills.join(', ')}.`:''].filter(Boolean).join(' ');
}
export function isGroundedSummaryWording(value,reference){
  if(typeof value!=='string' || !value.trim() || value.length>20000 || !reference) return false;
  const source=words(reference),candidate=words(value);
  return source.length>0 && JSON.stringify(candidate)===JSON.stringify(source);
}
export function conciseSummary(reference){
  return String(reference || '').replace(/^\s*I\s+(?:am\s+)?/i,'').replace(/\bbuild\b/gi,'create').replace(/^./,letter=>letter.toUpperCase());
}

export function profileSummarySuggestion(profile) {
  const facts = buildGroundedProfileContext(profile);
  const skills = [...new Set((facts.skills || []).map(skill => typeof skill === 'string' ? skill : skill.skillName || skill.name).filter(Boolean))];
  const parts = [];
  if (facts.targetRole) parts.push(`Seeking opportunities as a ${facts.targetRole}.`);
  if (facts.summary) parts.push(conciseSummary(facts.summary));
  if (skills.length) parts.push(`Skills include ${skills.join(', ')}.`);
  return parts.join(' ');
}
