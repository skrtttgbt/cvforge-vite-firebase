import { questionsMatchRole, roleTopics } from './interviewRoles.js';

const behavioralCategory = /^(hr(?:\s|\/|$)|behavioral|behavioural|communication|teamwork|situational|motivation)/i;

function validSet(result, role, interviewType) {
  return questionsMatchRole(result?.questions, role) && result.questions.length === 5 &&
    result.questions.every(({ category }) => interviewType === 'Technical Only'
      ? !behavioralCategory.test(category.trim())
      : interviewType === 'HR / Behavioral Only' ? behavioralCategory.test(category.trim()) : true);
}

export function rolePracticeQuestions(role, interviewType) {
  const topics = roleTopics(role);
  const technical = Array.from({ length: 5 }, (_, index) => ({
    category: topics[index % topics.length],
    question: [
      `How would you approach a task involving ${topics[index % topics.length]} as a ${role}?`,
      `What common mistakes would you look for when working with ${topics[index % topics.length]}?`,
      `How would you troubleshoot a problem involving ${topics[index % topics.length]}?`,
      `How would you explain ${topics[index % topics.length]} to a colleague unfamiliar with it?`,
      `How would you check the quality of work involving ${topics[index % topics.length]}?`,
    ][index],
  }));
  const behavioral = [
    `Why are you interested in a ${role} role?`,
    'How would you handle a disagreement with a teammate?',
    'How do you prioritize competing deadlines?',
    'How would you communicate a mistake and resolve it?',
    'How would you learn a topic you have not worked with before?',
  ].map(question => ({ question, category: 'Behavioral' }));
  return interviewType === 'HR / Behavioral Only' ? behavioral
    : interviewType === 'Technical Only' ? technical : [...technical.slice(0, 3), ...behavioral.slice(0, 2)];
}

// Retry invalid content once. Network/provider failures retain their original
// error; authored fallback questions are never presented as an AI response.
export async function generateInterviewQuestions({ role, interviewType, messages }, request) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await request({ messages: attempt === 0 ? messages : [...messages, {
      role: 'user',
      content: `The previous response could not be used. Return exactly five nonempty question/category objects in a questions array. Target role: ${role}. Topics: ${roleTopics(role).join(', ')}. Interview type: ${interviewType}. Use topic names as technical categories, or Behavioral for HR. Do not include unrelated technical topics.`,
    }] });
    let result;
    try { result = JSON.parse(data?.choices?.[0]?.message?.content || ''); } catch { continue; }
    if (validSet(result, role, interviewType)) return { questions: result.questions.map(({ question, category }) => ({ question: question.trim(), category: category.trim() })), source: 'ai' };
  }
  return {
    questions: rolePracticeQuestions(role, interviewType),
    source: 'role-based',
    notice: 'AI returned unusable questions after a retry. Showing role-based practice questions instead.',
  };
}
