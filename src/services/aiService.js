export async function generateAIContent(type, payload = {}) {
  const provider = import.meta.env.VITE_AI_PROVIDER || "mock";
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  const groqModel =
    import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-20b";

  if (provider === "groq") {
    if (!endpoint) {
      throw new Error("Missing VITE_AI_ENDPOINT in .env");
    }

    if (!groqApiKey) {
      throw new Error("Missing VITE_GROQ_API_KEY in .env");
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: "system",
            content:
              "You are a professional resume writer. Return only valid JSON. Do not use markdown. Do not use bullet symbols. Do not wrap the response in code blocks.",
          },
          {
            role: "user",
            content: buildResumePrompt(type, payload),
          },
        ],
        temperature: 0.3,
        max_completion_tokens: 2000,
        response_format: {
          type: "json_object",
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.error?.message || data?.message || "Groq AI request failed",
      );
    }

    const aiText = data?.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(aiText);

      return {
        title: parsed.title || `AI Generated ${type}`,
        resume: parsed.resume || parsed,
        content: "",
        bullets: [],
        raw: data,
      };
    } catch (error) {
      console.error("Failed to parse AI JSON:", error);

      return {
        title: `AI Generated ${type}`,
        resume: null,
        content: aiText,
        bullets: [],
        raw: data,
      };
    }
  }

  return {
    title: `AI Generated ${type}`,
    resume: {
      fullName: payload?.profile?.fullName || "Your Name",
      contact: {
        email: payload?.profile?.email || "",
        phone: payload?.profile?.phone || "",
        location: payload?.profile?.location || "",
      },
      professionalSummary:
        payload?.profile?.summary ||
        `Draft generated for ${payload?.targetRole || "Full Stack Developer"}.`,
      technicalSkills: [],
      workExperience: [],
      projects: [],
      certifications: [],
      education: [],
    },
    content: "",
    bullets: [],
  };
}

function buildResumePrompt(type, payload) {
  return `
Generate a professional resume draft tailored to the user.

Instructions for AI:
- Target Role: ${payload.targetRole || "Full Stack Developer"}
- Experience Level: ${payload.experienceLevel || "Entry-Level"}
- Resume Tone: ${payload.tone || "Professional"}

The resume should:
1. Rewrite the Professional Summary based on target role, experience level, and tone.
2. Rewrite job descriptions to emphasize achievements relevant to the target role.
3. Rewrite project descriptions to highlight relevant skills and responsibilities.
4. Use the tone specified (Professional, Confident, Concise, Modern, Academic).
5. Include the sections specified in Include Sections.
6. Do NOT invent companies, schools, certificates, dates, or links.
7. Output only valid JSON (no markdown, no bullets, no asterisks).

Raw profile data:
${JSON.stringify(payload.profile || {}, null, 2)}

Return JSON in this structure:

{
  "title": "AI Generated Resume Draft",
  "resume": {
    "fullName": "",
    "targetRole": "",
    "contact": {
      "email": "",
      "phone": "",
      "location": ""
    },
    "professionalSummary": "",
    "technicalSkills": [],
    "workExperience": [],
    "projects": [],
    "certifications": [],
    "education": []
  }
}
`;
}
export async function generateInterviewAI(type, payload = {}) {
  const provider = import.meta.env.VITE_AI_PROVIDER || "mock";
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  const groqModel =
    import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-20b";

  if (provider === "groq") {
    if (!endpoint) {
      throw new Error("Missing VITE_AI_ENDPOINT in .env");
    }

    if (!groqApiKey) {
      throw new Error("Missing VITE_GROQ_API_KEY in .env");
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          {
            role: "system",
            content:
              "You are an expert ICT job interview coach. Return only valid JSON. Do not use markdown, bullets, asterisks, or code blocks.",
          },
          {
            role: "user",
            content: buildInterviewPrompt(type, payload),
          },
        ],
        temperature: 0.4,
        max_completion_tokens: 2200,
        response_format: {
          type: "json_object",
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.error?.message || data?.message || "AI interview request failed",
      );
    }

    const aiText = data?.choices?.[0]?.message?.content || "";

    try {
      return JSON.parse(aiText);
    } catch (error) {
      console.error("Failed to parse interview AI JSON:", error);

      return {
        questions: [],
        feedback: {
          overallAssessment: "Needs Review",
          summary: aiText,
          strengths: [],
          areasToImprove: [],
          suggestedKeywords: [],
        },
      };
    }
  }

  if (type === "Interview Questions") {
    return {
      questions: [
        {
          question:
            "Can you describe a project where you used your technical skills to solve a real problem?",
          category: "Technical",
        },
        {
          question:
            "How do you handle debugging when a feature does not work as expected?",
          category: "Problem Solving",
        },
        {
          question:
            "Tell me about a time you explained a technical concept to another person.",
          category: "HR / Communication",
        },
      ],
    };
  }

  return {
    feedback: {
      overallAssessment: "Good",
      summary:
        "You gave a relevant answer. Improve it by adding more specific examples, tools used, and measurable results.",
      scores: {
        relevance: 80,
        clarity: 75,
        depth: 70,
        confidence: 75,
      },
      strengths: [
        "Relevant answer",
        "Clear explanation",
        "Good use of technical context",
      ],
      areasToImprove: [
        "Add specific examples",
        "Mention tools or technologies used",
        "Explain the result or impact",
      ],
      suggestedKeywords: [
        "Problem Solving",
        "Scalability",
        "Debugging",
        "Collaboration",
      ],
      tip: "Use the STAR method: Situation, Task, Action, and Result. Add one specific example and explain the outcome.",
      improvedAnswer:
        "A stronger answer should include the context, tools used, action taken, and result achieved.",
    },
  };
}

function buildInterviewPrompt(type, payload) {
  if (type === "Interview Questions") {
    return `
Generate ICT job interview questions.

Configuration:
Target ICT Role: ${payload.targetRole || "Full Stack Developer"}
Interview Type: ${payload.interviewType || "Technical + HR"}
Experience Level: ${payload.experienceLevel || "Mid-Level"}
Difficulty: ${payload.difficulty || "Intermediate"}
Focus Areas: ${(payload.focusAreas || []).join(", ")}

User Profile:
${JSON.stringify(payload.profile || {}, null, 2)}

Return only valid JSON using this exact structure:

{
  "questions": [
    {
      "question": "",
      "category": ""
    }
  ]
}

Rules:
1. Generate 5 interview questions.
2. Questions must match the target ICT role.
3. Questions must match the experience level and difficulty.
4. Include both technical and communication/HR questions if selected.
5. Use focus areas when creating technical questions.
6. Do not use markdown.
7. Return JSON only.
`;
  }

  return `
Analyze this ICT mock interview answer.

Configuration:
Target ICT Role: ${payload.targetRole || "Full Stack Developer"}
Interview Type: ${payload.interviewType || "Technical + HR"}
Experience Level: ${payload.experienceLevel || "Mid-Level"}
Difficulty: ${payload.difficulty || "Intermediate"}
Focus Areas: ${(payload.focusAreas || []).join(", ")}

Question:
${payload.question || ""}

User Answer:
${payload.answer || ""}

User Profile:
${JSON.stringify(payload.profile || {}, null, 2)}

Return only valid JSON using this exact structure:

{
  "feedback": {
    "overallAssessment": "",
    "summary": "",
    "scores": {
      "relevance": 0,
      "clarity": 0,
      "depth": 0,
      "confidence": 0
    },
    "strengths": [],
    "areasToImprove": [],
    "suggestedKeywords": [],
    "tip": "",
    "improvedAnswer": ""
  }
}

Rules:
1. Scores must be from 0 to 100.
2. The tip must be short, practical, and specific to this question and answer.
3. If the answer is weak, the tip should explain exactly what to add.
4. If the answer is good, the tip should explain how to make it stronger.
5. Do not invent fake experience.
6. Return JSON only.
`;
}
