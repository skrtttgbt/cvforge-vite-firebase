import { requestGroq } from './groqService';
import { buildGroundedProfileContext, groundingRules } from '../utils/grounding';
import { buildPortfolioSuggestions } from '../utils/portfolioSuggestions';
import { profileSummarySuggestion } from '../utils/summaryWording';
export async function getPortfolioSuggestions(profile) {
  if (import.meta.env.VITE_AI_PROVIDER !== 'groq') return { suggestions:buildPortfolioSuggestions(profile), notice:'AI is unavailable. These suggestions use profile-based wording templates.' };
  const facts=buildGroundedProfileContext(profile);
  const context={...facts,summaryTemplate:profileSummarySuggestion(profile)};
  for (const field of ['projects','experience']) context[field]=(profile[field] || []).map((row,index)=>({index,record:buildGroundedProfileContext({[field]:[row]})[field]?.[0] || {}}));
  const response=await requestGroq({messages:[{role:'system',content:groundingRules.replace('Copy factual statements verbatim; do not embellish them.','Improve phrasing without adding facts. Keep substantive facts in the same order.')},{role:'user',content:'Suggest portfolio wording tailored to targetRole. Return JSON {"summary":"","projects":[{"index":0,"description":""}],"experience":[{"index":0,"description":""}]}. Rewrite summaryTemplate and existing descriptions clearly. Do not invent expertise, achievements, numbers or technologies. Use only existing record indexes. Profile data: '+JSON.stringify(context)}]});
  let data; try {data=JSON.parse(response?.choices?.[0]?.message?.content || '');} catch {throw new Error('AI returned invalid suggestions. Please retry.');}
  return {suggestions:buildPortfolioSuggestions(profile,data),notice:'Review each suggestion. Wording that cannot be checked against your facts uses a labeled profile-based template. Changes apply only to this portfolio.'};
}
