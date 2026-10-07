import { requestGroq } from './groqService';
import { buildGroundedProfileContext, groundingRules } from '../utils/grounding';
import { buildResumeSuggestions, skillCategories } from '../utils/resumeSuggestions';
import { summaryReference, profileSummarySuggestion } from '../utils/summaryWording';

export async function getResumeSuggestions(profile) {
  if(import.meta.env.VITE_AI_PROVIDER!=='groq') return {
    suggestions:buildResumeSuggestions(profile,{},'role-suggestion'),
    notice:'AI is unavailable. Skills use role-based recommendations and the summary uses a concise wording template from your profile facts.',
  };
  const facts=buildGroundedProfileContext(profile);
  const context={...facts};
  context.summaryReference=summaryReference(profile);
  context.summaryTemplate=profileSummarySuggestion(profile);
  for(const field of ['projects','experience']) context[field]=(profile[field] || []).flatMap((record,index)=>{
    const clean=buildGroundedProfileContext({[field]:[record]})[field]?.[0];
    return clean?[{index,record:clean}]:[];
  });
  const response=await requestGroq({messages:[
    {role:'system',content:groundingRules.replace('Copy factual statements verbatim; do not embellish them.','Improve summary phrasing and grammar without embellishing facts. Rewrite summaryTemplate to combine the career objective, existing summary and listed skills. Keep substantive facts in the same order; do not add qualifiers or claims. Never copy the original summary unchanged.')+' Recommend skill names separately as UNVERIFIED role suggestions, never qualifications. Do not create projects, employers, credentials or personal facts.'},
    {role:'user',content:'Prepare resume improvement suggestions, not a resume. Return JSON {"skills":[{"name":"skill name","category":"suggested category"}],"summary":"improved summary wording","projects":[{"index":0,"description":""}],"experience":[{"index":0,"description":""}]}. Rewrite summaryReference more clearly and concisely instead of copying it. Keep its substantive facts in the same order. For example, "I build SQL reports" can become "Create SQL reports". Do not add achievements, expertise, seniority, years, graduate status or technologies. Recommend up to five skills relevant to targetRole, without asserting that the user has them. Suggest a category for each skill from '+JSON.stringify(skillCategories)+'. Do not suggest or infer proficiency; the user chooses it. Description indexes must refer only to existing indexed records; preserve those description facts verbatim. Profile data: '+JSON.stringify(context)},
  ]});
  let data;
  try{data=JSON.parse(response?.choices?.[0]?.message?.content || '');}catch{throw new Error('AI returned invalid suggestions. Please retry.');}
  return {suggestions:buildResumeSuggestions(profile,data),notice:'The summary can improve phrasing without adding qualifications. Wording that fails the fact checks uses a profile-based template instead. Review or edit every suggestion before approving.'};
}
