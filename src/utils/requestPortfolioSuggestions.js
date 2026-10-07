// Recover only invalid generated content. Authentication, quota and network
// failures must remain visible rather than being presented as successful AI.
export async function requestPortfolioSuggestions(messages, request) {
  for (let attempt=0;attempt<2;attempt++) {
    let response;
    try {
      response=await request({messages:attempt ? [...messages,{role:'user',content:'Return a single JSON object only, with exactly these keys: summary (string), projects (array), experience (array). Each array item has index (integer) and description (string). No markdown, explanations or extra keys. Use short descriptions based only on the supplied facts; use empty arrays when no records are supplied.'}] : messages});
    } catch(error) {
      if(error.code !== 'json_validate_failed' && !/failed to generate json/i.test(error.message || '')) throw error;
      continue;
    }
    try {
      const data=JSON.parse(response?.choices?.[0]?.message?.content || '');
      if(data && typeof data.summary==='string' && Array.isArray(data.projects) && Array.isArray(data.experience) && [...data.projects,...data.experience].every(item=>Number.isInteger(item?.index) && item.index>=0 && typeof item.description==='string')) return {data,fallback:false};
    } catch { /* Retry once before returning explicitly labeled templates. */ }
  }
  return {data:{},fallback:true};
}
