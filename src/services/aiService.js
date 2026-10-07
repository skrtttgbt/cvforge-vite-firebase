import { roleTopics } from "../utils/interviewRoles";
import { generateInterviewQuestions } from "../utils/generateInterviewQuestions";
import { generateGroundedDraft } from "../utils/generateGroundedDraft";
import { requestGroq } from "./groqService";
import {
  buildGroundedProfileContext,
  groundingRules,
  factualResume,
} from "../utils/grounding";
export async function generateAIContent(type, payload = {}) {
  if (import.meta.env.VITE_AI_PROVIDER !== "groq")
    return {
      title: "Profile Draft (AI unavailable)",
      status: "draft",
      resume: factualResume(payload.profile),
    };
  return generateGroundedDraft(type, payload, (request) =>
    requestGroq(request),
  );
}
export async function generateInterviewAI(type, payload = {}) {
  const facts = buildGroundedProfileContext(payload.profile);
  if (!facts.targetRole)
    throw new Error("Set your target role in Profile first.");
  if (import.meta.env.VITE_AI_PROVIDER !== "groq")
    throw new Error(
      "AI interview service is unavailable. No practice score was generated.",
    );
  const questions = type === "Interview Questions";
  const prompt =
    groundingRules +
    "\nTarget role: " +
    facts.targetRole +
    ". Role topics: " +
    roleTopics(facts.targetRole).join(", ") +
    ". Practice difficulty: " +
    (payload.difficulty || "Intermediate") +
    ". Interview type: " + (payload.interviewType || "Technical + HR") +
    ". Generate only role-relevant text questions. Do not assume the user knows a technology. Unrelated focus areas must be ignored. Profile: " +
    JSON.stringify(facts) +
    (questions
      ? '. Return JSON {"questions":[{"question":"","category":""}]} with five questions. For technical questions, use the relevant role topic as category (for example SQL or data cleaning), rather than a generic Technical category. For HR questions use category HR or Behavioral. Technical Only excludes HR questions; HR / Behavioral Only excludes technical questions.'
      : ". Evaluate this text answer as practice feedback only, never an employer assessment. Do not infer confidence from voice or appearance. Do not invent personal claims in improvedAnswer. Question: " +
        JSON.stringify(payload.question) +
        ". Answer: " +
        JSON.stringify(payload.answer) +
        '. Return JSON {"feedback":{"overallAssessment":"","summary":"","scores":{"relevance":0,"clarity":0,"depth":0},"strengths":[],"areasToImprove":[],"suggestedKeywords":[],"tip":"","improvedAnswer":""}}. Scores are practice indicators from 0 to 100.');
  const messages = [
      { role: "system", content: groundingRules },
      { role: "user", content: prompt },
    ];
  if (questions) return generateInterviewQuestions({ role: facts.targetRole, interviewType: payload.interviewType || 'Technical + HR', messages }, requestGroq);
  const data = await requestGroq({ messages });
  let result;
  try {
    result = JSON.parse(data?.choices?.[0]?.message?.content || "");
  } catch {
    throw new Error("AI returned invalid JSON. Please retry.");
  }
  if (!questions) {
    if (!result.feedback) throw new Error("Invalid practice feedback.");
    result.feedback.improvedAnswer = "";
  }
  return result;
}
