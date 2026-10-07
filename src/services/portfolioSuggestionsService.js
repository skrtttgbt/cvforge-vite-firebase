import { requestGroq } from './groqService';
import { buildGroundedProfileContext, groundingRules } from '../utils/grounding';
import { buildPortfolioSuggestions } from '../utils/portfolioSuggestions';
import { profileSummarySuggestion } from '../utils/summaryWording';
import { requestPortfolioSuggestions } from '../utils/requestPortfolioSuggestions';
export async function getPortfolioSuggestions(profile) {
  if (import.meta.env.VITE_AI_PROVIDER !== 'groq') return { suggestions:buildPortfolioSuggestions(profile), notice:'AI is unavailable. These suggestions use profile-based wording templates.' };
  const facts=buildGroundedProfileContext(profile);
  const context={...facts,summaryTemplate:profileSummarySuggestion(profile)};
  for (const field of ['projects','experience']) context[field]=(profile[field] || []).map((row,index)=>({index,record:buildGroundedProfileContext({[field]:[row]})[field]?.[0] || {}}));
  const messages=[{role:'system',content:'Return valid JSON only. '+groundingRules.replace('Copy factual statements verbatim; do not embellish them.','Improve phrasing without adding facts. Keep substantive facts in the same order.')},{role:'user',content:'Suggest portfolio wording tailored to targetRole. Return exactly one JSON object {"summary":"","projects":[{"index":0,"description":""}],"experience":[{"index":0,"description":""}]}. No markdown or additional text. Keep the introduction to at most three sentences and each description to two sentences. Use empty arrays for absent records. Rewrite summaryTemplate and existing descriptions clearly. Do not invent expertise, achievements, numbers or technologies. Use only existing record indexes. Profile data: '+JSON.stringify(context)}];
  const {data,fallback}=await requestPortfolioSuggestions(messages,requestGroq);
  return {suggestions:buildPortfolioSuggestions(profile,data),notice:fallback ? 'AI could not return valid suggestions after a retry. Showing profile-based wording templates for your review instead. Changes apply only to this portfolio.' : 'Review each suggestion. Wording that cannot be checked against your facts uses a labeled profile-based template. Changes apply only to this portfolio.'};
}
