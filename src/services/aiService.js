export async function generateAIContent(type, payload) {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT
  if (endpoint) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    })
    if (!res.ok) throw new Error('AI endpoint failed')
    return res.json()
  }

  return {
    title: `AI Generated ${type}`,
    content: `Draft generated for ${payload?.targetRole || 'Full Stack Developer'}. This mock output is ready to replace with DeepSeek API through a secure backend endpoint.`,
    bullets: [
      'Uses user-approved profile information only.',
      'Keeps the tone professional and employer-ready.',
      'Can be regenerated after updating profile sources.'
    ]
  }
}
