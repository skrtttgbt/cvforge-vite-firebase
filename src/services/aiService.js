export async function generateAIContent(type, payload) {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload })
    })
    if (!response.ok) throw new Error('AI endpoint failed')
    return response.json()
  }

  await new Promise(resolve => setTimeout(resolve, 650))
  const name = payload?.profile?.fullName || 'Juan Dela Cruz'
  const role = payload?.profile?.targetRole || 'Full Stack Developer'

  const mock = {
    resume: {
      summary: `${name} is a motivated ${role} with practical experience in building responsive applications, managing databases, and delivering user-centered digital solutions.`,
      bullets: [
        'Developed web applications using React, Node.js, Express, and database technologies.',
        'Created reusable UI components, API integrations, and secure authentication flows.',
        'Collaborated with teams to improve application performance, usability, and maintainability.'
      ]
    },
    portfolio: {
      headline: `${name} — ${role}`,
      bio: 'I build scalable web applications and digital solutions that combine clean interface design, reliable backend logic, and strong user experience.',
      sections: ['About Me', 'Technical Skills', 'Featured Projects', 'Certifications', 'Contact Links']
    },
    interview: {
      feedback: 'Good technical explanation with clear structure. Add more measurable results, explain trade-offs, and connect your answer to the target role.',
      score: 'Good',
      strengths: ['Clear communication', 'Relevant project examples', 'Good understanding of modern web tools'],
      improvements: ['Mention metrics', 'Explain alternatives', 'Add business impact']
    }
  }

  return mock[type] || mock.resume
}
