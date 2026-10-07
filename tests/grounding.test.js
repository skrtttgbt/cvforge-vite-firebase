import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGroundedProfileContext,
  factualResume,
  validateGeneratedClaims,
  safeUrl,
  sharedDraft,
} from "../src/utils/grounding.js";
import { getProfileCompletion } from "../src/utils/profileValidation.js";
import { generateGroundedDraft } from "../src/utils/generateGroundedDraft.js";
import { questionsMatchRole } from "../src/utils/interviewRoles.js";
import { generateInterviewQuestions, rolePracticeQuestions } from '../src/utils/generateInterviewQuestions.js';
test("empty and placeholder profiles never yield invented skills or experience", () => {
  const facts = buildGroundedProfileContext({
    fullName: "Your Name",
    skills: [],
    experience: [],
    education: null,
    summary: "N/A",
    targetRole: "select role",
  });
  assert.deepEqual(facts, {});
  const resume = factualResume({});
  assert.deepEqual(resume.technicalSkills, []);
  assert.deepEqual(resume.workExperience, []);
  assert.equal(resume.professionalSummary, "");
});
test("deduplicate facts and exclude credentials, provider metadata, and empty objects", () => {
  assert.deepEqual(
    buildGroundedProfileContext({
      skills: ["React", "React", "N/A"],
      experience: [{}],
      uid: "private",
      email: "private@example.com",
    }),
    { skills: ["React"] },
  );
});
test("reject unsupported skills, employers, graduate status, credentials and metrics", () => {
  const facts = {
    fullName: "Alice",
    targetRole: "Frontend Developer",
    skills: [{ skillName: "HTML" }],
  };
  for (const claim of [
    "React",
    "Recent graduate",
    "five years of experience",
    "Acme Corp",
    "AWS certified",
    "Improved throughput by 50%",
  ])
    assert.equal(
      validateGeneratedClaims({ professionalSummary: claim }, facts).length,
      1,
    );
  assert.deepEqual(
    validateGeneratedClaims(
      {
        fullName: "Alice",
        targetRole: "Frontend Developer",
        technicalSkills: [{ skillName: "HTML" }],
      },
      facts,
    ),
    [],
  );
  assert.equal(
    validateGeneratedClaims({ technicalSkills: ["Frontend Developer"] }, facts)
      .length,
    1,
  );
});
test("only http and https links survive protocol validation", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///private",
    "not a url",
  ])
    assert.equal(safeUrl(url), "");
  assert.equal(safeUrl("https://example.com"), "https://example.com/");
});
test("contact details are stripped by default without mutating owner draft", () => {
  const draft = {
    resume: {
      contact: { email: "a@example.com", phone: "123", location: "Manila" },
    },
  };
  assert.deepEqual(sharedDraft(draft).resume.contact, {
    email: "",
    phone: "",
    location: "",
  });
  assert.equal(
    sharedDraft(draft, { showEmail: true }).resume.contact.email,
    "a@example.com",
  );
  assert.equal(draft.resume.contact.phone, "123");
});
test("completion excludes placeholders, incomplete rows and invalid links", () => {
  const result = getProfileCompletion({
    fullName: "Your Name",
    targetRole: "N/A",
    projects: [{ projectTitle: "Test" }],
    links: { github: "javascript:alert(1)" },
    skills: [],
    education: { college: [{}] },
  });
  assert.equal(result.completed, 0);
  assert.equal(result.missing.length, 8);
  const real = getProfileCompletion({
    fullName: "Alice",
    email: "a@example.com",
    location: "Manila",
    targetRole: "Data Analyst",
    links: { github: "https://example.com" },
  });
  assert.equal(real.completed, 3);
});
test("recent graduate requires explicit recent graduation information", () => {
  assert.equal(
    buildGroundedProfileContext({
      summary: "A recent graduate",
      education: { college: [{ startYear: "2025" }] },
    }).summary,
    undefined,
  );
  assert.equal(
    buildGroundedProfileContext({
      summary: "A recent graduate",
      education: {
        college: [{ yearGraduated: String(new Date().getFullYear()) }],
      },
    }).summary,
    "A recent graduate",
  );
});
test("generation retries exactly once and removes unverifiable output", async () => {
  const calls = [];
  const result = await generateGroundedDraft(
    "Resume Draft",
    { profile: { fullName: "Alice", skills: [], experience: [] } },
    async (request) => {
      calls.push(request);
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                resume: {
                  professionalSummary:
                    "Recent graduate with strong React experience",
                  technicalSkills: ["React"],
                },
              }),
            },
          },
        ],
      };
    },
  );
  assert.equal(calls.length, 2);
  assert.match(calls[1].messages[1].content, /Correction/);
  assert.equal(result.status, "draft");
  assert.deepEqual(result.resume.technicalSkills, []);
  assert.equal(result.resume.professionalSummary, "");
  assert.match(result.warning, /could not be verified/);
});
test("grounded second response is accepted without a third request", async () => {
  let calls = 0;
  const result = await generateGroundedDraft(
    "Portfolio Draft",
    { profile: { fullName: "Alice", targetRole: "Data Analyst" } },
    async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              resume:
                ++calls === 1
                  ? { fullName: "Alice", technicalSkills: ["SQL"] }
                  : {
                      fullName: "Alice",
                      targetRole: "Data Analyst",
                      technicalSkills: [],
                    },
            }),
          },
        },
      ],
    }),
  );
  assert.equal(calls, 2);
  assert.equal(result.status, "draft");
  assert.equal(result.warning, undefined);
  assert.equal(result.resume.targetRole, "Data Analyst");
});
test("interview topics follow the canonical role", () => {
  assert.equal(
    questionsMatchRole(
      [{ question: "Explain React state.", category: "Technical" }],
      "Frontend Developer",
    ),
    true,
  );
  assert.equal(
    questionsMatchRole(
      [{ question: "Explain SQL joins.", category: "Technical" }],
      "Data Analyst",
    ),
    true,
  );
  assert.equal(
    questionsMatchRole(
      [{ question: "Explain React state.", category: "Technical" }],
      "Data Analyst",
    ),
    false,
  );
  assert.equal(
    questionsMatchRole(
      [{ question: "Describe CSS layouts.", category: "Technical" }],
      "Data Analyst",
    ),
    false,
  );
});

test('interview validation recognizes role topic synonyms and category context', () => {
  for (const [role, question, category] of [
    ['Data Analyst', 'How would you use Excel to identify outliers?', 'Technical'],
    [' data analyst ', 'How would you handle missing values?', 'Technical'],
    ['Data Analyst', 'How would you handle incomplete records?', 'Data cleaning'],
    ['Backend Developer', 'Explain SQL joins.', 'Technical'],
    ['UI/UX Designer', 'How do you create wireframes?', 'Technical'],
    ['Cybersecurity Specialist', 'How would you respond to phishing?', 'Technical'],
    ['Frontend Developer', 'How do you update the DOM?', 'Technical'],
    ['Mobile Developer', 'How do you handle offline usage?', 'Technical'],
    ['Data Analyst', 'Tell me about a difficult collaboration.', 'Behavioral'],
  ]) assert.equal(questionsMatchRole([{question, category}], role), true, question);
  assert.equal(questionsMatchRole([{question:'Explain React state.',category:'General'}], 'Data Analyst'), false);
  assert.equal(questionsMatchRole([{question:'Explain MySQL transactions.',category:'Technical'}], 'Frontend Developer'), false);
  assert.equal(questionsMatchRole([{question:'',category:'SQL'}], 'Data Analyst'), false);
  assert.equal(questionsMatchRole([null], 'Data Analyst'), false);
  assert.equal(questionsMatchRole([], 'Data Analyst'), false);
});

test('interview generation retries rejected content and accepts a valid second response', async () => {
  let calls = 0;
  const result = await generateInterviewQuestions({ role: 'Data Analyst', interviewType: 'Technical Only', messages: [] }, async () => ({ choices: [{ message: { content: JSON.stringify({ questions: ++calls === 1 ? [{ question: 'Explain React state.', category: 'Technical' }] : rolePracticeQuestions('Data Analyst', 'Technical Only') }) } }] }));
  assert.equal(calls, 2);
  assert.equal(result.source, 'ai');
  assert.equal(result.questions.length, 5);
});

test('repeated invalid AI content produces explicitly labeled role-based questions, respecting interview type', async () => {
  for (const interviewType of ['Technical Only', 'HR / Behavioral Only', 'Technical + HR']) {
    let calls = 0;
    const result = await generateInterviewQuestions({ role: 'Data Analyst', interviewType, messages: [] }, async () => {
      calls++;
      return { choices: [{ message: { content: calls === 1 ? 'invalid JSON' : JSON.stringify({ questions: [{ question: 'Explain React state.', category: 'General' }] }) } }] };
    });
    assert.equal(calls, 2);
    assert.equal(result.source, 'role-based');
    assert.match(result.notice, /role-based practice/);
    assert.equal(result.questions.length, 5);
    assert.equal(questionsMatchRole(result.questions, 'Data Analyst'), true);
    if (interviewType === 'Technical Only') assert.ok(result.questions.every(q => q.category !== 'Behavioral'));
    if (interviewType === 'HR / Behavioral Only') assert.ok(result.questions.every(q => q.category === 'Behavioral'));
  }
});

test('interview generation preserves provider errors and does not fabricate AI availability', async () => {
  let calls = 0;
  await assert.rejects(generateInterviewQuestions({ role: 'Data Analyst', interviewType: 'Technical Only', messages: [] }, async () => { calls++; throw new Error('Provider unavailable'); }), /Provider unavailable/);
  assert.equal(calls, 1);
});

test('fresh generation retains every saved education and other record when AI omits entries', async () => {
  const profile={fullName:'Alice',targetRole:'Data Analyst',skills:['SQL'],education:{primary:{schoolName:'Primary School',yearGraduated:'2010'},secondary:{schoolName:'Secondary School',yearGraduated:'2016'},college:[{schoolName:'College',degreeProgram:'ICT',yearGraduated:'2020'},{schoolName:'University',degreeProgram:'Statistics',yearGraduated:'2024'}],vocational:[{institution:'Training Center',course:'Data Course',completionYear:'2023'}]},experience:[{companyName:'Team',jobTitle:'Analyst',description:'Built SQL reports.',isCurrent:true,startDate:'2024-01'}],projects:[{projectTitle:'Reports',description:'SQL reports.',technologiesUsed:'SQL',isOngoing:true}],certifications:[{name:'SQL Certificate',organization:'Training Center',credentialId:'ABC'}]};
  const result=await generateGroundedDraft('Resume',{profile},async()=>({choices:[{message:{content:JSON.stringify({resume:{fullName:'Alice',targetRole:'Data Analyst',education:[],workExperience:[],projects:[],certifications:[],technicalSkills:[]}})}}]}));
  const source=factualResume(profile);
  for(const key of ['education','workExperience','projects','certifications','technicalSkills']) assert.deepEqual(result.resume[key],source[key]);
  assert.equal(result.resume.education.length,5);
  assert.equal(result.resume.education[0].degree,'Primary Education');
  assert.equal(result.resume.education[1].degree,'Secondary Education');
  assert.equal(result.resume.workExperience[0].isCurrent,true);
  assert.equal(result.resume.certifications[0].credentialId,'ABC');
});
