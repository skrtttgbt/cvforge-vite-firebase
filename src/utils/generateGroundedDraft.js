import {
  buildGroundedProfileContext,
  groundingRules,
  validateGeneratedClaims,
  factualResume,
} from "./grounding.js";
export async function generateGroundedDraft(type, payload, request) {
  const facts = buildGroundedProfileContext(payload.profile);
  const fallback = factualResume(payload.profile);
  const prompt =
    groundingRules +
    "\nGenerate a " +
    type +
    ". Canonical targetRole: " +
    (facts.targetRole || "") +
    ". Tone: " +
    (payload.tone || "Professional") +
    '. Return JSON {"resume":{"fullName":"","targetRole":"","professionalSummary":"","technicalSkills":[],"workExperience":[],"projects":[],"certifications":[],"education":[]}}. Copy factual statements verbatim. Context: ' +
    JSON.stringify(facts);
  for (let attempt = 0; attempt < 2; attempt++) {
    const data = await request({
      messages: [
        {
          role: "system",
          content: groundingRules + " Return valid JSON only.",
        },
        {
          role: "user",
          content:
            prompt +
            (attempt
              ? "\nCorrection: the previous output contained unverifiable claims. Copy only source facts; leave unsupported fields empty."
              : ""),
        },
      ],
    });
    let parsed;
    try {
      parsed = JSON.parse(data?.choices?.[0]?.message?.content || "");
    } catch {
      continue;
    }
    if (parsed.resume && !validateGeneratedClaims(parsed.resume, facts).length)
      return {
        title: "AI Generated Draft",
        status: "draft",
        // Generation may omit or shorten entries. Keep all supplied records
        // and their details; inclusion choices happen in the final review.
        resume: { ...fallback, ...parsed.resume,
          education: fallback.education,
          workExperience: fallback.workExperience,
          projects: fallback.projects,
          certifications: fallback.certifications,
          technicalSkills: fallback.technicalSkills,
          contact: fallback.contact,
        },
      };
  }
  return {
    title: "Profile Draft",
    status: "draft",
    resume: fallback,
    warning:
      "Some generated statements could not be verified from your profile and were removed.",
  };
}
