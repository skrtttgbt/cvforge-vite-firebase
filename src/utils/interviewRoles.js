const roles = {
  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "responsive design",
    "debugging",
  ],
  "Data Analyst": [
    "SQL",
    "data cleaning",
    "spreadsheets",
    "visualization",
    "statistics",
    "analytics",
  ],
  "Backend Developer": [
    "APIs",
    "database",
    "authentication",
    "server",
    "debugging",
  ],
  "Full Stack Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "APIs",
    "database",
    "authentication",
    "debugging",
  ],
  "Mobile Developer": ["mobile", "Android", "iOS", "app", "testing"],
  "UI/UX Designer": [
    "usability",
    "design",
    "prototype",
    "accessibility",
    "research",
  ],
  "Cybersecurity Specialist": [
    "security",
    "vulnerability",
    "incident",
    "network",
    "risk",
  ],
};
const canonicalRole = (role) => Object.keys(roles).find((name) => name.toLowerCase() === String(role || '').trim().toLowerCase()) || String(role || '').trim();
export const roleTopics = (role) => roles[canonicalRole(role)] || [canonicalRole(role)];
const relatedTopics = {
  'Frontend Developer': ['browser', 'DOM', 'accessibility', 'web performance', 'TypeScript', 'layout', 'component'],
  'Data Analyst': ['Excel', 'Tableau', 'Power BI', 'dataset', 'data', 'chart', 'dashboard', 'outlier', 'missing values', 'hypothesis', 'regression', 'pivot'],
  'Backend Developer': ['SQL', 'query', 'queries', 'REST', 'HTTP', 'endpoint', 'caching', 'cache', 'scalability', 'transaction', 'authorization', 'microservice'],
  'Full Stack Developer': ['SQL', 'TypeScript', 'browser', 'DOM', 'REST', 'HTTP', 'endpoint', 'component', 'deployment', 'cache'],
  'Mobile Developer': ['Kotlin', 'Swift', 'Flutter', 'React Native', 'battery', 'offline', 'notification'],
  'UI/UX Designer': ['wireframe', 'Figma', 'user journey', 'user interview', 'interaction', 'persona', 'user flow'],
  'Cybersecurity Specialist': ['threat', 'phishing', 'malware', 'encryption', 'firewall', 'penetration', 'audit', 'access control', 'authentication'],
};
const matches = (text, term) => new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|ing)?\\b', 'i').test(text);
export function questionsMatchRole(questions, role) {
  if (!Array.isArray(questions) || !questions.length) return false;
  const normalizedRole = canonicalRole(role);
  if (!normalizedRole) return false;
  const allowed = [...roleTopics(normalizedRole), ...(relatedTopics[normalizedRole] || [])];
  return questions.every((item) => {
    if (typeof item?.question !== "string" || !item.question.trim() || typeof item.category !== "string" || !item.category.trim())
      return false;
    const text = item.question + ' ' + item.category;
    // Behavioral questions apply across roles. A broad "General" category
    // alone must not let unrelated technical questions through.
    const behavioral = /^(hr(?:\s|\/|$)|behavioral|behavioural|communication|teamwork|situational|motivation)/i.test(item.category.trim());
    return (
      behavioral ||
      matches(text, normalizedRole) ||
      allowed.some((topic) => matches(text, topic))
    );
  });
}
