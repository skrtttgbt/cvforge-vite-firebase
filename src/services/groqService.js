// Spark-only architecture: this preserves the existing direct Groq integration.
// A VITE key is public in a browser bundle. A secret requires an external proxy;
// no Firebase server product is created or required here.
export async function requestGroq(request) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('Missing VITE_GROQ_API_KEY. The current direct Groq integration requires a client key.');
  const endpoint = import.meta.env.VITE_AI_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(endpoint, {
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
    body:JSON.stringify({ model:'openai/gpt-oss-20b', messages:request.messages, temperature:0.2, max_completion_tokens:2200, response_format:{type:'json_object'} }),
    signal:AbortSignal.timeout(80000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error=new Error(data?.error?.message || 'Groq AI request failed.');
    error.code=data?.error?.code;
    error.status=response.status;
    throw error;
  }
  return data;
}
